import { describe, expect, it } from 'vitest';
import { profileToChips, summariseMatches } from './summary';
import type { FarmProfile, GrantMatch } from './types';

const match = (overrides: Partial<GrantMatch>): GrantMatch => ({
  schemeId: 'x',
  name: 'Scheme',
  shortName: 'S',
  eligible: 'yes',
  reasons: [],
  status: 'open',
  nextStep: '',
  url: 'https://www.gov.ie',
  ...overrides,
});

describe('summariseMatches', () => {
  it("adds up priced 'yes' and 'likely' matches and never counts 'check'", () => {
    const headline = summariseMatches([
      match({ schemeId: 'ntas', eligible: 'likely', value: { totalEur: 44_900, basis: '' } }),
      match({ schemeId: 'tams', eligible: 'check', value: { totalEur: 10_000, basis: '' } }),
      match({ schemeId: 'biss', eligible: 'yes' }),
    ]);
    expect(headline).toEqual({ schemeCount: 3, valuedCount: 1, totalEur: 44_900 });
  });

  it('handles no matches', () => {
    expect(summariseMatches([])).toEqual({ schemeCount: 0, valuedCount: 0, totalEur: 0 });
  });
});

describe('profileToChips', () => {
  const declan: FarmProfile = {
    hectares: 40,
    enterprise: 'suckler',
    county: 'Cork',
    region: 'West Cork',
    marginalHectares: 3,
    nearWatercourse: true,
    peatSoil: null,
    missing: ['your age'],
  };

  it('lists what the farmer told us, then what is missing', () => {
    expect(profileToChips(declan).map((chip) => chip.label)).toEqual([
      '40 ha',
      'Suckler beef',
      'West Cork',
      '3 ha of marginal land',
      'Beside a river or stream',
      'Your age?',
    ]);
    expect(profileToChips(declan).at(-1)).toMatchObject({ missing: true });
  });

  it('falls back to the county and labels investments', () => {
    const labels = profileToChips({
      hectares: 35,
      enterprise: 'sheep',
      county: 'Kerry',
      gender: 'female',
      plannedInvestment: 'shed',
      missing: [],
    }).map((chip) => chip.label);
    expect(labels).toEqual(['35 ha', 'Sheep', 'Co. Kerry', 'Woman farmer', 'Planning a new shed']);
  });
});
