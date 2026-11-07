import { endpoints, schemeFixtures, successBody } from '@app/shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import { ensureDatabase } from '../../db/client';

let app: Awaited<ReturnType<typeof createApp>>;

beforeAll(async () => {
  await ensureDatabase();
  app = await createApp();
});

describe('C-05 GET /api/schemes', () => {
  it('returns the scheme list that matches the contract', async () => {
    const res = await app.request(endpoints.listSchemes.path);
    expect(res.status).toBe(200);
    const { data } = successBody(endpoints.listSchemes.response).parse(await res.json());
    expect(data.map((scheme) => scheme.id)).toEqual(schemeFixtures.map((scheme) => scheme.id));
  });
});
