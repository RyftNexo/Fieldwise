import { AdviceResponse, farmProfileFixtures } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { buildRulesAdvice } from '../rulesAdvice';
import { evaluateProfile } from './index';
import { makeProfile } from './testProfiles';

describe('evaluateProfile', () => {
  it('Declan: NTAS first (the only euro figure), then ANC, BISS and ACRES', () => {
    const ids = evaluateProfile(farmProfileFixtures.declan).map((match) => match.schemeId);
    expect(ids).toEqual(['ntas', 'biss', 'anc', 'acres']);
  });

  it('Aoife: dairy farm planning solar panels gets the unverified solar pointer', () => {
    const ids = evaluateProfile(farmProfileFixtures.aoife).map((match) => match.schemeId);
    expect(ids).toEqual(['biss', 'anc', 'acres', 'scis']);
  });

  it('Mary: sheep farm planning a shed gets the unverified building pointer', () => {
    const ids = evaluateProfile(farmProfileFixtures.mary).map((match) => match.schemeId);
    expect(ids).toEqual(['biss', 'anc', 'acres', 'awnss']);
  });

  it('is deterministic: the same profile gives the same matches', () => {
    expect(evaluateProfile(farmProfileFixtures.declan)).toEqual(
      evaluateProfile(farmProfileFixtures.declan),
    );
  });
});

describe('buildRulesAdvice', () => {
  it.each(Object.entries(farmProfileFixtures))(
    '%s: the advice matches the contract',
    (_name, profile) => {
      expect(() => AdviceResponse.parse(buildRulesAdvice(profile))).not.toThrow();
    },
  );

  it('puts the NTAS figure in the summary and keeps it under 120 words', () => {
    const advice = buildRulesAdvice(farmProfileFixtures.declan);
    expect(advice.summary).toContain('€58,388');
    expect(advice.summary.split(/\s+/u).length).toBeLessThanOrEqual(120);
  });

  it('still returns BISS and a summary when the enterprise is not listed', () => {
    const advice = buildRulesAdvice(makeProfile({ enterprise: 'other' }));
    expect(AdviceResponse.parse(advice).matches.map((match) => match.schemeId)).toEqual(['biss']);
  });
});
