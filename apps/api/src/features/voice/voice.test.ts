import { ApiErrorBody, buildPath, endpoints, successBody } from '@app/shared';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app';
import { ensureDatabase } from '../../db/client';
import { env } from '../../env';
import { clearVoiceJobs, noteOutboundCall } from './jobs';
import { clearRingAttempts } from './ringPolicy';
import { signTwilioWebhook } from './signature';
import { voiceMaxPolls } from './twiml';

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
  openaiKey: env.OPENAI_API_KEY,
  from: env.TWILIO_FROM_NUMBER,
  ringTo: env.TWILIO_RING_TO,
};

afterEach(() => {
  clearVoiceJobs();
  env.TWILIO_ACCOUNT_SID = original.sid;
  env.TWILIO_AUTH_TOKEN = original.token;
  env.DEMO_MODE = original.demoMode;
  env.TWILIO_PUBLIC_BASE = original.publicBase;
  env.OPENAI_API_KEY = original.openaiKey;
  env.TWILIO_FROM_NUMBER = original.from;
  env.TWILIO_RING_TO = original.ringTo;
  clearRingAttempts();
  vi.unstubAllGlobals();
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
  it('accepts an unsigned webhook from the configured public host', async () => {
    configureLine();
    env.TWILIO_PUBLIC_BASE = 'https://demo.trycloudflare.com';
    const res = await app.request('http://localhost/api/voice/incoming', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-forwarded-host': 'demo.trycloudflare.com',
        'x-forwarded-proto': 'https',
      },
      body: new URLSearchParams({ CallSid: 'CA1' }).toString(),
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<Gather');
  });

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
    expect(await res.text()).toContain(
      'action="https://demo.trycloudflare.com/api/voice/advice?attempt=1"',
    );
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
    expect(body).toContain('actionOnEmptyResult="true"');
    expect(body).toContain('speechTimeout="3"');
    expect(body).not.toContain('speechModel=');
    expect(body).not.toContain('Polly.');
    expect(body).toContain('hectares');
  });
});

describe('POST /api/voice/ring', () => {
  function twilioFetch() {
    return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      Response.json({ sid: 'CA-outbound' }),
    );
  }

  it('does not call Twilio for a number outside the demo list', async () => {
    configureLine();
    env.TWILIO_FROM_NUMBER = '+353800000000';
    env.TWILIO_RING_TO = '+353871234567';
    const fetchImpl = twilioFetch();
    vi.stubGlobal('fetch', fetchImpl);

    const res = await app.request(endpoints.ringVoiceCall.path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to: '+353831111111' }),
    });

    expect(res.status).toBe(403);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not call Twilio again inside the gap', async () => {
    configureLine();
    env.TWILIO_FROM_NUMBER = '+353800000000';
    env.TWILIO_RING_TO = '+353871234567';
    const fetchImpl = twilioFetch();
    vi.stubGlobal('fetch', fetchImpl);
    const body = JSON.stringify({ to: '087 123 4567' });

    const first = await app.request(endpoints.ringVoiceCall.path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
    const second = await app.request(endpoints.ringVoiceCall.path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });

    const placed = successBody(endpoints.ringVoiceCall.response).parse(await first.json());
    expect(placed.data.callSid).toBe('CA-outbound');
    expect(placed.data.to).toBe('+353871234567');
    expect(first.status).toBe(201);
    expect(second.status).toBe(429);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/voice/calls/:callSid', () => {
  it('stays on ringing until the caller has described the farm', async () => {
    noteOutboundCall('CA-ring', '+353871234567');
    const res = await app.request(buildPath(endpoints.getVoiceCall.path, { callSid: 'CA-ring' }));
    expect(res.status).toBe(200);
    const { data } = successBody(endpoints.getVoiceCall.response).parse(await res.json());
    expect(data.state).toBe('ringing');
    expect(data.to).toBe('+353871234567');
  });

  it('returns the advice once the phone line has a result', async () => {
    configureLine();
    env.DEMO_MODE = 'fixtures';
    noteOutboundCall('CA-screen', '+353871234567');
    const path = '/api/voice/advice?attempt=1';
    const params = {
      CallSid: 'CA-screen',
      SpeechResult: 'A suckler farm in West Cork, about 40 hectares, wet land by the river.',
    };
    await postVoice(path, params, signed(path, params));

    const res = await app.request(buildPath(endpoints.getVoiceCall.path, { callSid: 'CA-screen' }));
    expect(res.status).toBe(200);
    const { data } = successBody(endpoints.getVoiceCall.response).parse(await res.json());
    expect(data.state).toBe('done');
    expect(data.to).toBe('+353871234567');
    expect(data.advice?.summary).toContain('58,388');
  });

  it('returns 404 for a call this server does not know', async () => {
    const res = await app.request(
      buildPath(endpoints.getVoiceCall.path, { callSid: 'CA-missing' }),
    );
    expect(res.status).toBe(404);
    expect(ApiErrorBody.parse(await res.json()).error.code).toBe('NOT_FOUND');
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
    expect(body).toContain('<Gather');
    expect(body).toContain('actionOnEmptyResult="true"');
    expect(body).toContain('I didn&apos;t catch that');
    expect(body).toContain('attempt=2');
  });

  it('hangs up when the caller is still silent on the last attempt', async () => {
    configureLine();
    const path = '/api/voice/advice?attempt=2';
    const params = { CallSid: 'CA1', SpeechResult: '' };
    const res = await postVoice(path, params, signed(path, params));
    const body = await res.text();
    expect(body).toContain('<Hangup/>');
    expect(body).toContain('couldn&apos;t hear you');
    expect(body).not.toContain('<Gather');
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

  it('returns before a slow model finishes, then speaks once the result is ready', async () => {
    configureLine();
    env.DEMO_MODE = 'off';
    env.OPENAI_API_KEY = 'test-key-not-real';
    const releases: Array<(response: Response) => void> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise<Response>((resolve, reject) => {
          const abort = () => reject(new DOMException('The operation was aborted', 'AbortError'));
          if (init?.signal?.aborted) {
            abort();
            return;
          }
          init?.signal?.addEventListener('abort', abort, { once: true });
          releases.push(resolve);
        });
      }),
    );

    const path = '/api/voice/advice?attempt=1';
    const params = {
      CallSid: 'CA-slow',
      SpeechResult:
        '40 hectares of suckler beef in West Cork, with 3 hectares wet beside the river.',
    };
    const started = Date.now();
    const res = await postVoice(path, params, signed(path, params));
    expect(Date.now() - started).toBeLessThan(1_000);
    const waiting = await res.text();
    expect(waiting).toContain('<Pause length="4"/>');
    expect(waiting).toContain('/api/voice/result?poll=1');
    expect(waiting).not.toContain('<Hangup/>');
    expect(releases).toHaveLength(1);

    const again = await postVoice(path, params, signed(path, params));
    expect(await again.text()).toContain('/api/voice/result?poll=1');
    expect(releases).toHaveLength(1);

    releases[0]?.(completion(extractedProfile));
    await vi.waitFor(() => expect(releases).toHaveLength(2));
    releases[1]?.(completion('You could get up to €58,388 once a forester checks the wet land.'));

    const resultPath = '/api/voice/result?poll=1';
    const resultParams = { CallSid: 'CA-slow' };
    await vi.waitFor(async () => {
      const done = await postVoice(resultPath, resultParams, signed(resultPath, resultParams));
      const spoken = await done.text();
      expect(spoken).toContain('<Hangup/>');
      expect(spoken).toContain('58,388');
    });
  });

  it('stops a model call that is still running when the wait budget runs out', async () => {
    configureLine();
    env.DEMO_MODE = 'off';
    env.OPENAI_API_KEY = 'test-key-not-real';
    let aborted = false;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          const abort = () => {
            aborted = true;
            reject(new DOMException('The operation was aborted', 'AbortError'));
          };
          init?.signal?.addEventListener('abort', abort, { once: true });
        });
      }),
    );

    const advicePath = '/api/voice/advice?attempt=1';
    const params = { CallSid: 'CA-budget', SpeechResult: 'Forty hectares of sheep in Kerry.' };
    await postVoice(advicePath, params, signed(advicePath, params));

    const resultPath = `/api/voice/result?poll=${voiceMaxPolls}`;
    const resultParams = { CallSid: 'CA-budget' };
    const res = await postVoice(resultPath, resultParams, signed(resultPath, resultParams));
    const body = await res.text();
    expect(body).toContain('taking too long');
    expect(body).toContain('<Hangup/>');
    expect(aborted).toBe(true);
  });
});

const completion = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const extractedProfile = JSON.stringify({
  hectares: 40,
  enterprise: 'suckler',
  county: null,
  region: 'West Cork',
  age: null,
  gender: null,
  marginalHectares: 3,
  nearWatercourse: true,
  peatSoil: null,
  designatedSite: null,
  activeFarmer: null,
  plannedInvestment: null,
  missing: [],
});
