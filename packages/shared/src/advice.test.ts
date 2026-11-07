import { describe, expect, it } from 'vitest';
import {
  AdviceInput,
  AdviceResponse,
  adviceFixtures,
  CreateLeadInput,
  createLeadFixture,
  EvaluateAdviceInput,
  endpoints,
  FarmProfile,
  farmProfileFixtures,
  GrantMatch,
  GrantValue,
  Lead,
  leadFixtures,
  Scheme,
  schemeFixtures,
} from './index';

describe('GrantGuide contract v1', () => {
  it('registers the five agreed endpoint methods and paths', () => {
    expect(
      Object.values(endpoints)
        .filter((endpoint) => Number(endpoint.id.slice(2)) >= 3)
        .map(({ id, method, path }) => [id, method, path]),
    ).toEqual([
      ['C-03', 'POST', '/api/advice'],
      ['C-04', 'POST', '/api/advice/evaluate'],
      ['C-05', 'GET', '/api/schemes'],
      ['C-06', 'POST', '/api/leads'],
      ['C-07', 'GET', '/api/leads'],
    ]);
  });

  it('validates every persona, catalogue entry and lead through the registry', () => {
    for (const fixture of Object.values(adviceFixtures)) {
      expect(endpoints.advice.response.safeParse(fixture).success).toBe(true);
      expect(endpoints.evaluateAdvice.response.safeParse(fixture).success).toBe(true);
      expect(EvaluateAdviceInput.safeParse({ profile: fixture.profile }).success).toBe(true);
    }
    for (const fixture of schemeFixtures) expect(Scheme.safeParse(fixture).success).toBe(true);
    for (const fixture of leadFixtures) expect(Lead.safeParse(fixture).success).toBe(true);
    expect(endpoints.listSchemes.response.safeParse(schemeFixtures).success).toBe(true);
    expect(endpoints.listLeads.response.safeParse(leadFixtures).success).toBe(true);
    expect(endpoints.createLead.request?.safeParse(createLeadFixture).success).toBe(true);
    expect(endpoints.createLead.response.safeParse(leadFixtures[0]).success).toBe(true);
  });

  it('keeps unknown extraction facts unknown', () => {
    const profile = FarmProfile.parse(farmProfileFixtures.declan);
    expect(profile.peatSoil).toBeNull();
    expect(profile.designatedSite).toBeNull();
    expect(profile.activeFarmer).toBeUndefined();
    expect(profile.age).toBeUndefined();
  });

  it.each([
    { hectares: -1 },
    { hectares: 0 },
    { hectares: Number.POSITIVE_INFINITY },
    { marginalHectares: 41 },
    { marginalHectares: -1 },
    { age: 29.5 },
    { enterprise: 'invented' },
    { nearWatercourse: 'yes' },
    { missing: undefined },
  ])('rejects invalid profile fields: %j', (fields) => {
    expect(FarmProfile.safeParse({ ...farmProfileFixtures.declan, ...fields }).success).toBe(false);
  });

  it('rejects blank or excessive input and summaries above 120 words', () => {
    expect(AdviceInput.safeParse({ text: '   ' }).success).toBe(false);
    expect(AdviceInput.safeParse({ text: 'a'.repeat(10_001) }).success).toBe(false);
    expect(AdviceInput.parse({ text: '  My farm  ' }).text).toBe('My farm');
    for (const [count, valid] of [
      [120, true],
      [121, false],
    ] as const) {
      expect(
        AdviceResponse.safeParse({
          ...adviceFixtures.declan,
          summary: Array(count).fill('word').join(' '),
        }).success,
      ).toBe(valid);
    }
  });

  it('accepts empty results and JSON stages for a rules-only response', () => {
    expect(
      AdviceResponse.safeParse({
        ...adviceFixtures.declan,
        matches: [],
        steps: { extract: null, rules: { matches: [] }, explain: null },
      }).success,
    ).toBe(true);
    expect(
      AdviceResponse.safeParse({
        ...adviceFixtures.declan,
        steps: { extract: undefined, rules: {}, explain: {} },
      }).success,
    ).toBe(false);
  });

  it('validates monetary estimates, rates, dates and URLs', () => {
    expect(GrantValue.safeParse({ totalEur: -1, basis: 'test' }).success).toBe(false);
    expect(GrantValue.safeParse({ totalEur: 0, basis: 'No estimated payment' }).success).toBe(true);
    expect(Scheme.safeParse({ ...schemeFixtures[0], grantRate: 40 }).success).toBe(false);
    expect(Scheme.safeParse({ ...schemeFixtures[0], grantRate: 0.4 }).success).toBe(true);
    expect(Scheme.safeParse({ ...schemeFixtures[0], deadline: '2026-02-30' }).success).toBe(false);
    expect(Scheme.safeParse({ ...schemeFixtures[0], checkedAt: 'yesterday' }).success).toBe(false);
    expect(
      GrantMatch.safeParse({ ...adviceFixtures.declan.matches[0], url: 'javascript:alert(1)' })
        .success,
    ).toBe(false);
  });

  it.each([
    { consent: false },
    { consent: undefined },
    { email: undefined },
    { email: 'invalid' },
    { name: ' ' },
    { schemeIds: [] },
    { email: undefined, phone: 'abc' },
    { email: undefined, phone: '123' },
  ])('rejects invalid lead submissions: %j', (fields) => {
    expect(CreateLeadInput.safeParse({ ...createLeadFixture, ...fields }).success).toBe(false);
  });

  it('accepts either contact method and ignores client-supplied matches and totals', () => {
    expect(
      CreateLeadInput.safeParse({
        ...createLeadFixture,
        email: undefined,
        phone: '+353 87 000 0000',
      }).success,
    ).toBe(true);
    const lead = CreateLeadInput.parse({
      ...createLeadFixture,
      estimatedTotalEur: 999999,
      matches: [],
    });
    expect(lead).not.toHaveProperty('estimatedTotalEur');
    expect(lead).not.toHaveProperty('matches');
  });
});
