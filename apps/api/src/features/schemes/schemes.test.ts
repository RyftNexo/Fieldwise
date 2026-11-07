import { endpoints, successBody } from '@app/shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import { ensureDatabase } from '../../db/client';
import { schemeCatalogue } from './catalogue';
import { ancFacts, ntasFacts } from './facts';

let app: Awaited<ReturnType<typeof createApp>>;

beforeAll(async () => {
  await ensureDatabase();
  app = await createApp();
});

const verifiedIds = ['ntas', 'anc', 'biss', 'acres'];

describe('C-05 GET /api/schemes', () => {
  it('returns the catalogue in a shape that matches the contract', async () => {
    const res = await app.request(endpoints.listSchemes.path);
    expect(res.status).toBe(200);
    const { data } = successBody(endpoints.listSchemes.response).parse(await res.json());
    expect(data.map((scheme) => scheme.id)).toEqual(schemeCatalogue.map((scheme) => scheme.id));
  });

  it('serves exactly what the catalogue holds, read back from the seeded table', async () => {
    const res = await app.request(endpoints.listSchemes.path);
    const { data } = successBody(endpoints.listSchemes.response).parse(await res.json());
    expect(data).toEqual(schemeCatalogue);
  });

  it('lists NTAS, ANC, BISS and ACRES first, each with a check date and an official gov.ie link', () => {
    const verified = schemeCatalogue.slice(0, verifiedIds.length);
    expect(verified.map((scheme) => scheme.id)).toEqual(verifiedIds);
    for (const scheme of verified) {
      expect(scheme.checkedAt).not.toBeNull();
      expect(new URL(scheme.url).hostname).toBe('www.gov.ie');
    }
  });

  it('never claims a check for schemes whose facts are unverified', () => {
    for (const scheme of schemeCatalogue.filter((s) => !verifiedIds.includes(s.id))) {
      expect(scheme.checkedAt).toBeNull();
    }
  });
});

describe('verified facts', () => {
  it('NTAS grant instalments add up to the establishment grant', () => {
    expect(ntasFacts.grant1PerHaEur + ntasFacts.grant2PerHaEur).toBe(ntasFacts.grantPerHaEur);
  });

  it('NTAS premium totals match the published ten-year figures', () => {
    expect(ntasFacts.nta1PremiumPerHaEur * ntasFacts.premiumYears).toBe(22_060);
    expect(ntasFacts.nta2PremiumPerHaEur * ntasFacts.premiumYears).toBe(22_840);
  });

  it('ANC rate bands are contiguous from the first hectare', () => {
    for (const bands of [ancFacts.category1, ancFacts.category2, ancFacts.category3]) {
      expect(bands[0].fromHa).toBe(0);
      expect(bands[0].toHa).toBe(bands[1].fromHa);
    }
  });
});
