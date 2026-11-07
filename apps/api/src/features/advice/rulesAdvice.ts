// Turns a FarmProfile into a full AdviceResponse using only the rules engine (no AI): this is what C-04 returns,
// and what C-03 will return once Gemini replaces the "extract" and "explain" steps.
import type { AdviceResponse, FarmProfile, GrantMatch } from '@app/shared';
import { checkedAt } from '../schemes/facts';
import { evaluateProfile, totalEstimatedEur } from './rules';
import { dateOnly, formatEur } from './rules/format';

/** A short plain-English summary written from the matches alone, so it can never state a figure the rules did not compute. */
export function buildRulesSummary(matches: GrantMatch[]): string {
  if (matches.length === 0) {
    return 'We did not find a scheme that clearly fits what you told us. Ask your Teagasc adviser what else may apply to your farm.';
  }

  const valued = matches.find((match) => match.value);
  const headline = valued?.value
    ? `${valued.name} looks like your biggest opportunity: up to ${formatEur(valued.value.totalEur)}${valued.value.years ? ` over ${valued.value.years} years` : ''}, once a professional confirms your land.`
    : `${matches[0]?.name} is the first scheme to look at.`;

  const others = matches.filter((match) => match !== valued).map((match) => match.shortName);
  const followUp = others.length > 0 ? ` Also check: ${others.join(', ')}.` : '';
  return `${headline}${followUp} These are estimates, not promises.`;
}

export function buildRulesAdvice(profile: FarmProfile): AdviceResponse {
  const matches = evaluateProfile(profile);
  const summary = buildRulesSummary(matches);
  const nextSteps = [...new Set(matches.map((match) => match.nextStep))];

  return {
    profile,
    matches,
    summary,
    nextSteps,
    disclaimers: [
      `Scheme rates and rules come from gov.ie and were last checked on ${dateOnly(checkedAt)}. They change, so confirm before you act.`,
      'This is a first look, not an eligibility decision. The Department of Agriculture makes the final decision.',
      'We cannot check your herd number, land parcels, soil or entitlements, so some answers are "likely" or "check".',
    ],
    steps: {
      extract: { skipped: true, reason: 'The profile was supplied directly.', profile },
      rules: {
        engine: 'rules engine (no AI)',
        matches: matches.map(({ schemeId, eligible, value }) => ({
          schemeId,
          eligible,
          totalEur: value?.totalEur ?? null,
        })),
        estimatedTotalEur: totalEstimatedEur(matches),
      },
      explain: { method: 'template', summary },
    },
    mode: 'live',
  };
}
