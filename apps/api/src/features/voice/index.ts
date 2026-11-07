import type { Context } from 'hono';
import { Hono } from 'hono';
import { env } from '../../env';
import { adviseFromText } from '../advice/pipeline';
import { replayRecording } from '../advice/recordings';
import { scriptFromAdvice, spokenFailure } from './script';
import { isValidTwilioSignature, webhookUrls } from './signature';
import { gatherTwiml, hangupTwiml } from './twiml';

/**
 * Inbound phone line. Twilio posts form data here and expects TwiML, not the JSON API.
 * One description from the caller, then the same advice pipeline as POST /api/advice.
 */
export const router = new Hono();

const maxAttempts = 2;
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
  const attempt = attemptOf(c);
  if (speech.length < 3) return xml(c, missedTwiml(attempt));

  try {
    const text = speech.slice(0, 10_000);
    const advice =
      env.DEMO_MODE === 'fixtures' ? replayRecording(text) : await adviseFromText(text);
    return xml(c, hangupTwiml(scriptFromAdvice(advice)));
  } catch (error) {
    console.error('voice advice failed');
    return xml(c, hangupTwiml(spokenFailure(error)));
  }
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

function attemptOf(c: Context): number {
  const attempt = Number(c.req.query('attempt'));
  return Number.isInteger(attempt) && attempt > 0 ? attempt : 1;
}

function xml(c: Context, document: string) {
  return c.body(document, 200, { 'content-type': 'text/xml; charset=utf-8' });
}
