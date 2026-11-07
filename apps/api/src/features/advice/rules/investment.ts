// Investment grants (solar, sheds, slurry storage). Their rules and rates are NOT verified yet, so these only
// point the farmer to an adviser; they never claim eligibility or a figure.
import { type FarmProfile, type GrantMatch, schemeFixtures } from '@app/shared';

const investmentSchemeIds: Partial<Record<NonNullable<FarmProfile['plannedInvestment']>, string>> =
  {
    solar: 'scis',
    shed: 'awnss',
    slurry: 'awnss',
  };

export function evaluateInvestment(profile: FarmProfile): GrantMatch | null {
  const schemeId = profile.plannedInvestment && investmentSchemeIds[profile.plannedInvestment];
  const scheme = schemeFixtures.find((candidate) => candidate.id === schemeId);
  if (!scheme) return null;

  return {
    schemeId: scheme.id,
    name: scheme.name,
    shortName: scheme.shortName,
    eligible: 'check',
    reasons: [
      `You plan a ${profile.plannedInvestment} investment, which this scheme can support.`,
      'We have not verified this scheme’s rules or rates yet, so we cannot say whether you qualify or how much you could get.',
    ],
    status: 'unknown',
    nextStep: scheme.criteria[0] ?? 'Speak with a farm adviser.',
    url: scheme.url,
  };
}
