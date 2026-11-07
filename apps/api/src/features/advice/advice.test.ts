import { ApiErrorBody, endpoints, farmProfileFixtures, successBody } from '@app/shared';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app';
import { ensureDatabase } from '../../db/client';
import { env } from '../../env';
import { loadRecordings } from './recordings';

let app: Awaited<ReturnType<typeof createApp>>;

beforeAll(async () => {
  await ensureDatabase();
  app = await createApp();
});

const post = (path: string, body: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const declanText = loadRecordings()[0]?.text ?? '';
const originalDemoMode = env.DEMO_MODE;
const originalKey = env.OPENAI_API_KEY;

afterEach(() => {
  env.DEMO_MODE = originalDemoMode;
  env.OPENAI_API_KEY = originalKey;
  vi.unstubAllGlobals();
});

/** A fake model: the first call extracts a profile (JSON), the second writes the summary. */
function stubLlm(extraction: unknown, summary: string) {
  const reply = (text: string) =>
    new Response(
      JSON.stringify({ choices: [{ message: { content: text }, finish_reason: 'stop' }] }),
      { status: 200 },
    );
  const fetchStub = vi
    .fn()
    .mockResolvedValueOnce(reply(JSON.stringify(extraction)))
    .mockResolvedValueOnce(reply(summary));
  vi.stubGlobal('fetch', fetchStub);
  return fetchStub;
}

describe('C-03 POST /api/advice (live, model stubbed)', () => {
  beforeEach(() => {
    env.DEMO_MODE = 'off';
    env.OPENAI_API_KEY = 'test-key-not-real';
  });

  it('extracts, runs the rules and explains, returning contract-valid advice', async () => {
    stubLlm(
      {
        hectares: 40,
        enterprise: 'suckler',
        marginalHectares: 3,
        nearWatercourse: true,
        missing: [],
      },
      'Your wet land by the river could bring up to €58,388 from NTAS.',
    );
    const res = await post(endpoints.advice.path, { text: declanText });
    expect(res.status).toBe(200);
    const { data } = successBody(endpoints.advice.response).parse(await res.json());
    expect(data.mode).toBe('live');
    expect(data.matches[0]?.value?.totalEur).toBe(58_388);
    expect(data.summary).toContain('€58,388');
  });

  it('keeps the rules’ summary when the model invents a figure', async () => {
    stubLlm(
      {
        hectares: 40,
        enterprise: 'suckler',
        marginalHectares: 3,
        nearWatercourse: true,
        missing: [],
      },
      'Get €1,000,000!',
    );
    const res = await post(endpoints.advice.path, { text: declanText });
    const { data } = successBody(endpoints.advice.response).parse(await res.json());
    expect(data.summary).not.toContain('1,000,000');
    expect(data.steps.explain).toMatchObject({ method: 'template' });
  });

  it('answers 502 UPSTREAM_ERROR when the model is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const res = await post(endpoints.advice.path, { text: declanText });
    expect(res.status).toBe(502);
    expect(ApiErrorBody.parse(await res.json()).error.code).toBe('UPSTREAM_ERROR');
  });

  it('answers UPSTREAM_ERROR when no key is configured, without calling the model', async () => {
    delete env.OPENAI_API_KEY;
    const fetchStub = vi.fn();
    vi.stubGlobal('fetch', fetchStub);
    const res = await post(endpoints.advice.path, { text: declanText });
    expect(res.status).toBe(502);
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it('still answers when the text has no farm size', async () => {
    stubLlm(
      { hectares: 0, enterprise: 'other', missing: ['farm size'] },
      'Schemes may still apply.',
    );
    const res = await post(endpoints.advice.path, { text: 'I want a grant' });
    expect(res.status).toBe(200);
    const { data } = successBody(endpoints.advice.response).parse(await res.json());
    expect(data.profile.hectares).toBeUndefined();
    expect(data.profile.missing).toContain('farm size');
  });
});

describe('C-03 POST /api/advice (DEMO_MODE=fixtures)', () => {
  beforeEach(() => {
    env.DEMO_MODE = 'fixtures';
  });

  it.each(loadRecordings().map((recording) => [recording.id, recording.text] as const))(
    'replays the %s recording without calling the model',
    async (_id, text) => {
      const fetchStub = vi.fn();
      vi.stubGlobal('fetch', fetchStub);
      const res = await post(endpoints.advice.path, { text });
      expect(res.status).toBe(200);
      const { data } = successBody(endpoints.advice.response).parse(await res.json());
      expect(data.mode).toBe('fixtures');
      expect(fetchStub).not.toHaveBeenCalled();
    },
  );

  it('says the offline demo only knows the examples when the farm is not recorded', async () => {
    const res = await post(endpoints.advice.path, { text: 'I grow potatoes in Wexford' });
    expect(res.status).toBe(502);
    expect(ApiErrorBody.parse(await res.json()).error.message).toContain('three example farms');
  });
});

describe('C-03 input validation', () => {
  it('rejects empty text with VALIDATION_ERROR', async () => {
    const res = await post(endpoints.advice.path, { text: '   ' });
    expect(res.status).toBe(400);
    expect(ApiErrorBody.parse(await res.json()).error.code).toBe('VALIDATION_ERROR');
  });
});

describe('C-04 POST /api/advice/evaluate', () => {
  it('echoes the submitted profile in the advice', async () => {
    const res = await post(endpoints.evaluateAdvice.path, { profile: farmProfileFixtures.aoife });
    expect(res.status).toBe(200);
    const { data } = successBody(endpoints.evaluateAdvice.response).parse(await res.json());
    expect(data.profile).toEqual(farmProfileFixtures.aoife);
  });

  it('computes matches from the profile: Declan gets an NTAS value, Mary does not', async () => {
    const valueFor = async (profile: unknown) => {
      const res = await post(endpoints.evaluateAdvice.path, { profile });
      const { data } = successBody(endpoints.evaluateAdvice.response).parse(await res.json());
      return data.matches.find((match) => match.schemeId === 'ntas')?.value?.totalEur;
    };
    expect(await valueFor(farmProfileFixtures.declan)).toBe(58_388);
    expect(await valueFor(farmProfileFixtures.mary)).toBeUndefined();
  });

  it('rejects marginal land larger than the farm with VALIDATION_ERROR', async () => {
    const profile = { ...farmProfileFixtures.declan, marginalHectares: 500 };
    const res = await post(endpoints.evaluateAdvice.path, { profile });
    expect(res.status).toBe(400);
    expect(ApiErrorBody.parse(await res.json()).error.code).toBe('VALIDATION_ERROR');
  });
});
