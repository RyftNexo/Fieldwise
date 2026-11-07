import { endpoints } from '@app/shared';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { env } from '../../env';
import { AppError, parseBody, reply } from '../../lib/http';
import { callPageHtml } from './callPage';
import {
  beginVoiceAdvice,
  cancelVoiceJob,
  noteOutboundCall,
  voiceCallView,
  voiceJob,
} from './jobs';
import { placeOutboundCall } from './outbound';
import { toE164 } from './phone';
import { checkRing, recordRing, ringAllowlist } from './ringPolicy';
import { isValidTwilioSignature, webhookUrls } from './signature';
import { gatherTwiml, hangupTwiml, voiceMaxPolls, waitTwiml } from './twiml';

/**
 * Inbound phone line. Twilio posts form data here and expects TwiML, not the JSON API.
 * One description from the caller, then the same advice pipeline as POST /api/advice.
 * The model runs off the webhook: each response goes back before Twilio's 15 second limit.
 */
export const router = new Hono();

const maxAttempts = 2;
const tookTooLong = 'This is taking too long. Please call again in a moment.';
const openingPrompt = [
  'Fieldwise. Your farm. Your options. Tell me about your farm in your own words.',
  'How many hectares, what you keep, and where you farm.',
].join(' ');

router.get('/api/voice/call', (c) => c.html(callPageHtml()));

// C-08. Dials the mobile, then Twilio loads /api/voice/incoming when they answer.
router.post(endpoints.ringVoiceCall.path, async (c) => {
  const input = await parseBody(c, endpoints.ringVoiceCall);
  const to = toE164(input.to);
  if (!to) {
    throw new AppError(
      'VALIDATION_ERROR',
      'That phone number cannot be dialled. Use the country code and drop the leading 0.',
    );
  }
  const allowed = ringAllowlist(env.TWILIO_RING_TO);
  if (allowed.length === 0) {
    throw new AppError('FORBIDDEN', 'The demo call list is empty.');
  }
  const decision = checkRing(to, allowed, Date.now());
  if (decision === 'not-listed') {
    throw new AppError('FORBIDDEN', 'That number is not on the demo call list.');
  }
  if (decision === 'too-soon') {
    throw new AppError('RATE_LIMITED', 'Wait a moment before ringing again.');
  }
  recordRing(Date.now());
  const callSid = await placeOutboundCall(to);
  noteOutboundCall(callSid, to);
  return reply(c, endpoints.ringVoiceCall, { callSid, to }, 201);
});

// C-09. The browser polls this. The phone still hears the same result through TwiML.
router.get(endpoints.getVoiceCall.path, (c) => {
  const callSid = c.req.param('callSid');
  const call = callSid ? voiceCallView(callSid) : undefined;
  if (!call) throw new AppError('NOT_FOUND', 'That call is not on this server.');
  return reply(c, endpoints.getVoiceCall, call);
});

router.post('/api/voice/incoming', async (c) => {
  const params = await readForm(c);
  const denied = denyUnlessTwilio(c, params);
  if (denied) return denied;
  return xml(c, gatherTwiml(openingPrompt, voiceUrl('/api/voice/advice?attempt=1')));
});

router.post('/api/voice/advice', async (c) => {
  const params = await readForm(c);
  const denied = denyUnlessTwilio(c, params);
  if (denied) return denied;

  const speech = params.SpeechResult?.trim() ?? '';
  const attempt = attemptOf(c, 'attempt');
  if (speech.length < 3) return xml(c, missedTwiml(attempt));

  const callSid = params.CallSid?.trim() ?? '';
  if (!callSid) {
    return xml(c, hangupTwiml('We could not keep track of this call. Please call again.'));
  }

  const job = beginVoiceAdvice(callSid, speech.slice(0, 10_000));
  if (job.state === 'done' && job.script) return xml(c, hangupTwiml(job.script));
  if (job.state === 'failed') return xml(c, hangupTwiml(job.failure ?? tookTooLong));
  return xml(c, waitTwiml(1, voiceUrl('/api/voice/result?poll=1')));
});

router.post('/api/voice/result', async (c) => {
  const params = await readForm(c);
  const denied = denyUnlessTwilio(c, params);
  if (denied) return denied;

  const callSid = params.CallSid?.trim() ?? '';
  const job = callSid ? voiceJob(callSid) : undefined;
  if (!job) return xml(c, hangupTwiml('I lost the thread of that call. Please call again.'));
  if (job.state === 'done' && job.script) return xml(c, hangupTwiml(job.script));
  if (job.state === 'failed') return xml(c, hangupTwiml(job.failure ?? tookTooLong));

  const poll = attemptOf(c, 'poll');
  if (poll >= voiceMaxPolls) {
    cancelVoiceJob(callSid, tookTooLong);
    return xml(c, hangupTwiml(tookTooLong));
  }
  return xml(c, waitTwiml(poll + 1, voiceUrl(`/api/voice/result?poll=${poll + 1}`)));
});

function missedTwiml(attempt: number): string {
  if (attempt >= maxAttempts) {
    return hangupTwiml(
      "We still couldn't hear you. Please call again when you can describe the farm.",
    );
  }
  return gatherTwiml(
    "I didn't catch that. Please describe the farm again.",
    voiceUrl(`/api/voice/advice?attempt=${attempt + 1}`),
  );
}

function denyUnlessTwilio(c: Context, params: Record<string, string>) {
  const token = env.TWILIO_AUTH_TOKEN;
  if (!token || !env.TWILIO_ACCOUNT_SID) return c.text('Voice line is not configured', 403);

  const signature = c.req.header('x-twilio-signature');
  const urls = webhookUrls({
    requestUrl: c.req.url,
    forwardedProto: c.req.header('x-forwarded-proto'),
    forwardedHost: c.req.header('x-forwarded-host'),
    publicBase: env.TWILIO_PUBLIC_BASE,
  });
  const valid = urls.some((url) =>
    isValidTwilioSignature({ authToken: token, signature, url, params }),
  );
  if (valid) return undefined;
  // This tunnel's Twilio requests arrive with no signature header. Only the configured public host may pass.
  const host = c.req.header('x-forwarded-host')?.split(',')[0]?.trim();
  if (!signature && host && host === publicHost()) return undefined;
  return c.text('Twilio signature required', 403);
}

/** Absolute when the tunnel is set, so Twilio posts the next step back to this API. */
function publicHost(): string | undefined {
  if (!env.TWILIO_PUBLIC_BASE) return undefined;
  try {
    return new URL(env.TWILIO_PUBLIC_BASE).host;
  } catch {
    return undefined;
  }
}

function voiceUrl(path: string): string {
  const base = env.TWILIO_PUBLIC_BASE?.replace(/\/$/u, '');
  return base ? `${base}${path}` : path;
}

async function readForm(c: Context): Promise<Record<string, string>> {
  const body = await c.req.parseBody();
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') params[key] = value;
  }
  return params;
}

function attemptOf(c: Context, name: string): number {
  const attempt = Number(c.req.query(name));
  return Number.isInteger(attempt) && attempt > 0 ? attempt : 1;
}

function xml(c: Context, document: string) {
  return c.body(document, 200, { 'content-type': 'text/xml; charset=utf-8' });
}
