import type { Context } from 'hono';
import { Hono } from 'hono';
import { env } from '../../env';
import { beginVoiceAdvice, cancelVoiceJob, voiceJob } from './jobs';
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
  'Grant Guide. Tell me about your farm in your own words.',
  'How many hectares, what you keep, and where you farm.',
].join(' ');

router.post('/api/voice/incoming', async (c) => {
  const params = await readForm(c);
  const denied = denyUnlessTwilio(c, params);
  if (denied) return denied;
  return xml(c, gatherTwiml(openingPrompt, '/api/voice/advice?attempt=1'));
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
  return xml(c, waitTwiml(1));
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
  return xml(c, waitTwiml(poll + 1));
});

function missedTwiml(attempt: number): string {
  if (attempt >= maxAttempts) {
    return hangupTwiml(
      "We still couldn't hear you. Please call again when you can describe the farm.",
    );
  }
  return gatherTwiml(
    "I didn't catch that. Please describe the farm again.",
    `/api/voice/advice?attempt=${attempt + 1}`,
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
  if (!valid) return c.text('Twilio signature required', 403);
  return undefined;
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
