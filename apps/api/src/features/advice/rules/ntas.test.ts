import type { FarmProfile } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { evaluateNtas, plantableHectares } from './ntas';
import { makeProfile } from './testProfiles';

describe('NTAS plantable hectares', () => {
  const cases: Array<[string, Partial<FarmProfile>, { nta1Ha: number; nta2Ha: number }]> = [
    [
      'wet land beside a river: one NTA2 strip and one NTA1 wood',
      { marginalHectares: 3, nearWatercourse: true },
      { nta1Ha: 1, nta2Ha: 1 },
    ],
    [
      'wet land, no river: NTA1 only, one hectare at most',
      { marginalHectares: 3 },
      { nta1Ha: 1, nta2Ha: 0 },
    ],
    [
      'half a hectare beside a river: all of it goes to NTA2',
      { marginalHectares: 0.5, nearWatercourse: true },
      { nta1Ha: 0, nta2Ha: 0.5 },
    ],
    [
      'river but no figure for unused land: a river strip only',
      { nearWatercourse: true },
      { nta1Ha: 0, nta2Ha: 1 },
    ],
    ['no unused land and no river', {}, { nta1Ha: 0, nta2Ha: 0 }],
  ];

  it.each(cases)('%s', (_name, overrides, expected) => {
    expect(plantableHectares(makeProfile(overrides))).toMatchObject(expected);
  });
});

describe('NTAS evaluation', () => {
  it('works out the euro value for Declan: 2 ha, grant plus 10 years of premiums', () => {
    const match = evaluateNtas(makeProfile({ marginalHectares: 3, nearWatercourse: true }));
    expect(match?.value).toMatchObject({
      oneOffEur: 13_488,
      annualEur: 4_490,
      years: 10,
      totalEur: 58_388,
    });
    expect(match?.deadline).toBe('2027-12-31');
  });

  it('returns nothing when there is no land to plant', () => {
    expect(evaluateNtas(makeProfile())).toBeNull();
    expect(evaluateNtas(makeProfile({ marginalHectares: 0 }))).toBeNull();
  });

  const eligibility: Array<[string, Partial<FarmProfile>, string]> = [
    ['soil and site unknown', { peatSoil: null, designatedSite: null }, 'likely'],
    ['soil and site not mentioned', {}, 'likely'],
    ['neither peat nor designated', { peatSoil: false, designatedSite: false }, 'yes'],
    ['peat soil', { peatSoil: true, designatedSite: false }, 'check'],
    ['designated site', { peatSoil: false, designatedSite: true }, 'check'],
  ];

  it.each(eligibility)('%s → %s', (_name, overrides, expected) => {
    const match = evaluateNtas(
      makeProfile({ marginalHectares: 3, nearWatercourse: true, ...overrides }),
    );
    expect(match?.eligible).toBe(expected);
  });
});
