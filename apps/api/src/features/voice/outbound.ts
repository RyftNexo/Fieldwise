import { env } from '../../env';
import { AppError } from '../../lib/http';

interface CallDeps {
  fetchImpl?: typeof fetch;
}

interface TwilioCall {
  sid?: string;
  code?: number;
  message?: string;
}

/** Twilio's hosted speech demo. Used until TWILIO_PUBLIC_BASE points at this API. */
export const twilioSpeechTemplate =
  'https://webhooks.twilio.com/v1/Voice/Template/voice_speech_recognition';

/** Where Twilio fetches TwiML after the mobile answers. */
export function outboundVoiceUrl(): string {
  const publicBase = env.TWILIO_PUBLIC_BASE?.replace(/\/$/u, '');
  if (publicBase) return `${publicBase}/api/voice/incoming`;
  return twilioSpeechTemplate;
}

/** Dial `to` from the Twilio number. When they answer, Twilio loads the voice webhook. */
export async function placeOutboundCall(to: string, deps: CallDeps = {}): Promise<string> {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) {
    throw new AppError(
      'UPSTREAM_ERROR',
      'The phone line is not ready. Set the Twilio number to call from, and the account token.',
    );
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const response = await fetchImpl(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: from,
        Url: outboundVoiceUrl(),
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  const payload = (await response.json().catch(() => null)) as TwilioCall | null;
  if (!response.ok || !payload?.sid)
    throw new AppError('UPSTREAM_ERROR', ringFailure(payload?.code));
  return payload.sid;
}

function ringFailure(code: number | undefined): string {
  if (code === 21219 || code === 21215 || code === 21216) {
    return 'This trial account can only ring a verified mobile. Verify it in the Twilio console, with the country code and no leading 0.';
  }
  if (code === 21211 || code === 21217) {
    return 'Twilio could not dial that number. Use the country code and drop the leading 0.';
  }
  if (code === 21212 || code === 21606) {
    return 'The Twilio number in TWILIO_FROM_NUMBER cannot place voice calls.';
  }
  return 'Twilio could not place the call.';
}
