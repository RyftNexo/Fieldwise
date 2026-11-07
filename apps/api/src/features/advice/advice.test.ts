import { ApiErrorBody, endpoints, farmProfileFixtures, successBody } from '@app/shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import { ensureDatabase } from '../../db/client';

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

describe('C-03 POST /api/advice', () => {
  it('returns advice that matches the contract', async () => {
    const res = await post(endpoints.advice.path, { text: 'I farm 40 hectares of suckler beef.' });
    expect(res.status).toBe(200);
    const { data } = successBody(endpoints.advice.response).parse(await res.json());
    expect(data.matches.length).toBeGreaterThan(0);
  });

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

  it('rejects marginal land larger than the farm with VALIDATION_ERROR', async () => {
    const profile = { ...farmProfileFixtures.declan, marginalHectares: 500 };
    const res = await post(endpoints.evaluateAdvice.path, { profile });
    expect(res.status).toBe(400);
    expect(ApiErrorBody.parse(await res.json()).error.code).toBe('VALIDATION_ERROR');
  });
});
