import { ApiErrorBody, endpoints, successBody } from '@app/shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { ensureDatabase } from './db/client';

let app: Awaited<ReturnType<typeof createApp>>;

beforeAll(async () => {
  await ensureDatabase();
  app = await createApp();
});

describe('C-00 GET /api/health', () => {
  it('returns ok with a healthy database', async () => {
    const res = await app.request(endpoints.health.path);
    expect(res.status).toBe(200);
    const body = successBody(endpoints.health.response).parse(await res.json());
    expect(body.data.db).toBe('ok');
  });
});

describe('unknown routes', () => {
  it('use the standard error envelope', async () => {
    const res = await app.request('/api/does-not-exist');
    expect(res.status).toBe(404);
    const body = ApiErrorBody.parse(await res.json());
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
