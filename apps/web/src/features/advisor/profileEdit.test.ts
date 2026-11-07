import type { FarmProfile } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { draftFromProfile, profileFromDraft } from './profileEdit';

const profile: FarmProfile = {
  hectares: 40,
  enterprise: 'suckler',
  county: 'Cork',
  marginalHectares: 3,
  nearWatercourse: true,
  missing: ['your age', 'whether you already claim BISS'],
};

describe('profile editing', () => {
  it('preserves known data and applies corrected values', () => {
    const draft = draftFromProfile(profile);
    const edited = profileFromDraft(profile, {
      ...draft,
      hectares: '42',
      age: '55',
      activeFarmer: 'yes',
    });

    expect(edited).toMatchObject({
      hectares: 42,
      age: 55,
      activeFarmer: true,
      enterprise: 'suckler',
      county: 'Cork',
    });
    expect(edited.missing).toEqual([]);
  });

  it('does not turn facts the farmer never gave into false values', () => {
    const draft = draftFromProfile({
      ...profile,
      nearWatercourse: undefined,
      plannedInvestment: undefined,
    });
    const edited = profileFromDraft(profile, { ...draft, age: '55' });

    expect(edited.nearWatercourse).toBeUndefined();
    expect(edited.plannedInvestment).toBeUndefined();
    expect(edited.activeFarmer).toBeUndefined();
  });

  it('rejects marginal land larger than the whole farm', () => {
    expect(() =>
      profileFromDraft(profile, {
        ...draftFromProfile(profile),
        hectares: '2',
        marginalHectares: '3',
      }),
    ).toThrow('Marginal land cannot exceed the total farm area');
  });
});
