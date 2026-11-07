// The rules engine: pure functions, no AI, no I/O. Same profile in, same matches out.
import type { Eligibility, FarmProfile, GrantMatch } from '@app/shared';
import { evaluateAcres } from './acres';
import { evaluateAnc } from './anc';
import { evaluateBiss } from './biss';
import { evaluateInvestment } from './investment';
import { evaluateNtas } from './ntas';

const eligibilityRank: Record<Eligibility, number> = { yes: 0, likely: 1, check: 2 };

/** Every scheme that applies to the profile: most certain first, then the biggest euro value. */
export function evaluateProfile(profile: FarmProfile): GrantMatch[] {
  const matches = [
    evaluateNtas(profile),
    evaluateAnc(profile),
    evaluateBiss(profile),
    evaluateAcres(profile),
    evaluateInvestment(profile),
  ].filter((match): match is GrantMatch => match !== null);

  return matches.sort(
    (a, b) =>
      eligibilityRank[a.eligible] - eligibilityRank[b.eligible] ||
      (b.value?.totalEur ?? 0) - (a.value?.totalEur ?? 0),
  );
}

export function totalEstimatedEur(matches: GrantMatch[]): number {
  return matches.reduce((total, match) => total + (match.value?.totalEur ?? 0), 0);
}
