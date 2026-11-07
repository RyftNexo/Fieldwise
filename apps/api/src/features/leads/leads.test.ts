import { ApiErrorBody, createLeadFixture, endpoints, successBody } from '@app/shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app';
import { ensureDatabase } from '../../db/client';

let app: Awaited<ReturnType<typeof createApp>>;

beforeAll(async () => {
  await ensureDatabase();
  app = await createApp();
});

const postLead = (body: unknown) =>
  app.request(endpoints.createLead.path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('C-06 POST /api/leads', () => {
  it('creates a lead and computes matches and total on the server', async () => {
    const res = await postLead(createLeadFixture);
    expect(res.status).toBe(201);
    const { data } = successBody(endpoints.createLead.response).parse(await res.json());
    expect(data.name).toBe(createLeadFixture.name);
    expect(data.matches.map((match) => match.schemeId)).toEqual(createLeadFixture.schemeIds);
    // Declan's NTAS figure is worked out by the rules engine: €13,488 grant plus 10 years of €4,490.
    expect(data.matches[0]?.value?.totalEur).toBe(58_388);
    expect(data.estimatedTotalEur).toBe(58_388);
  });

  it('rejects a lead without consent with VALIDATION_ERROR', async () => {
    const res = await postLead({ ...createLeadFixture, consent: false });
    expect(res.status).toBe(400);
    expect(ApiErrorBody.parse(await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a lead with no phone or email with VALIDATION_ERROR', async () => {
    const { email: _email, ...withoutContact } = createLeadFixture;
    const res = await postLead(withoutContact);
    expect(res.status).toBe(400);
    expect(ApiErrorBody.parse(await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an unknown scheme id with VALIDATION_ERROR', async () => {
    const res = await postLead({ ...createLeadFixture, schemeIds: ['not-a-scheme'] });
    expect(res.status).toBe(400);
    expect(ApiErrorBody.parse(await res.json()).error.code).toBe('VALIDATION_ERROR');
  });
});

describe('C-07 GET /api/leads', () => {
  it('starts with the three demo leads, with matches worked out by the rules engine', async () => {
    const res = await app.request(endpoints.listLeads.path);
    const { data } = successBody(endpoints.listLeads.response).parse(await res.json());
    const demoNames = ['Declan Murphy', 'Aoife Ryan', 'Mary Walsh'];
    const demoLeads = data.filter((lead) => demoNames.includes(lead.name));
    expect(demoLeads).toHaveLength(3);
    const declan = demoLeads.find((lead) => lead.name === 'Declan Murphy');
    expect(declan?.estimatedTotalEur).toBe(58_388);
    for (const lead of demoLeads) expect(lead.matches.length).toBeGreaterThan(0);
  });

  it('lists saved leads, newest first', async () => {
    const first = successBody(endpoints.createLead.response).parse(
      await (await postLead({ ...createLeadFixture, name: 'First lead' })).json(),
    ).data;
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = successBody(endpoints.createLead.response).parse(
      await (await postLead({ ...createLeadFixture, name: 'Second lead' })).json(),
    ).data;

    const res = await app.request(endpoints.listLeads.path);
    expect(res.status).toBe(200);
    const { data } = successBody(endpoints.listLeads.response).parse(await res.json());
    const ids = data.map((lead) => lead.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
  });
});
