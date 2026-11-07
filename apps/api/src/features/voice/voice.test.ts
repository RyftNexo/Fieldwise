import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import { ensureDatabase } from '../../db/client';
import { env } from '../../env';
import { signTwilioWebhook } from './signature';

let app: Awaited<ReturnType<typeof createApp>>;

beforeAll(async () => {
  await ensureDatabase();
  app = await createApp();
});

const authToken = 'test-twilio-token';
const original = {
  sid: env.TWILIO_ACCOUNT_SID,
  token: env.TWILIO_AUTH_TOKEN,
  demoMode: env.DEMO_MODE,
  publicBase: env.TWILIO_PUBLIC_BASE,
};

afterEach(() => {
  env.TWILIO_ACCOUNT_SID = original.sid;
  env.TWILIO_AUTH_TOKEN = original.token;
  env.DEMO_MODE = original.demoMode;
  env.TWILIO_PUBLIC_BASE = original.publicBase;
});

function configureLine() {
  env.TWILIO_ACCOUNT_SID = 'ACtest';
  env.TWILIO_AUTH_TOKEN = authToken;
  env.TWILIO_PUBLIC_BASE = undefined;
}

async function postVoice(path: string, params: Record<string, string>, signature?: string) {
  const url = `http://localhost${path}`;
  return app.request(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...(signature ? { 'x-twilio-signature': signature } : {}),
    },
    body: new URLSearchParams(params).toString(),
  });
}

function signed(path: string, params: Record<string, string>) {
  return signTwilioWebhook(`http://localhost${path}`, params, authToken);
}

describe('POST /api/voice/incoming', () => {
  it('rejects a call that Twilio did not sign', async () => {
    configureLine();
    const res = await postVoice('/api/voice/incoming', { CallSid: 'CA1' }, 'wrong');
    expect(res.status).toBe(403);
  });

  it('accepts the signature Twilio computed for the public tunnel URL', async () => {
    configureLine();
    env.TWILIO_PUBLIC_BASE = 'https://demo.trycloudflare.com';
    const params = { CallSid: 'CA1' };
    const signature = signTwilioWebhook(
      'https://demo.trycloudflare.com/api/voice/incoming',
      params,
      authToken,
    );
    const res = await postVoice('/api/voice/incoming', params, signature);
    expect(res.status).toBe(200);
  });

  it('asks the caller to describe the farm', async () => {
    configureLine();
    const params = { CallSid: 'CA1' };
    const res = await postVoice(
      '/api/voice/incoming',
      params,
      signed('/api/voice/incoming', params),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/xml');
    const body = await res.text();
    expect(body).toContain('<Gather');
    expect(body).toContain('action="/api/voice/advice?attempt=1"');
    expect(body).toContain('Polly.Niamh');
    expect(body).toContain('hectares');
  });
});

describe('POST /api/voice/advice', () => {
  it('reads the recorded summary for a known example farm', async () => {
    configureLine();
    env.DEMO_MODE = 'fixtures';
    const path = '/api/voice/advice?attempt=1';
    const params = {
      CallSid: 'CA1',
      SpeechResult: 'A suckler farm in West Cork, about 40 hectares, wet land by the river.',
    };
    const res = await postVoice(path, params, signed(path, params));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('58,388');
    expect(body).toContain('<Hangup/>');
    expect(body).toContain('Department of Agriculture');
  });

  it('asks again when the line stays quiet', async () => {
    configureLine();
    const path = '/api/voice/advice?attempt=1';
    const params = { CallSid: 'CA1', SpeechResult: '' };
    const res = await postVoice(path, params, signed(path, params));
    const body = await res.text();
    expect(body).toContain('I didn&apos;t catch that');
    expect(body).toContain('attempt=2');
  });

  it('speaks a phone-friendly line when fixtures mode does not know the farm', async () => {
    configureLine();
    env.DEMO_MODE = 'fixtures';
    const path = '/api/voice/advice?attempt=1';
    const params = { CallSid: 'CA1', SpeechResult: 'I grow bananas in a greenhouse.' };
    const res = await postVoice(path, params, signed(path, params));
    const body = await res.text();
    expect(body).toContain('West Cork suckler farm');
    expect(body).toContain('<Hangup/>');
  });
});
