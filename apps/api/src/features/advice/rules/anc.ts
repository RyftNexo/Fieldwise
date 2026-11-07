// Areas of Natural Constraint. Facts: schemes/facts.ts. Designation is by townland, which we cannot look up,
// so this never says better than "check", and it gives no euro total because the land category is unknown.
import type { FarmProfile, GrantMatch } from '@app/shared';
import { ancFacts, officialUrls } from '../../schemes/facts';
import { formatEur, keepsLivestock } from './format';

export function evaluateAnc(profile: FarmProfile): GrantMatch | null {
  const livestock = keepsLivestock(profile);
  if (!livestock && profile.enterprise !== 'tillage') return null;

  const highestRate = ancFacts.category1[0].ratePerHaEur;
  const lowestRate = ancFacts.category3[0].ratePerHaEur;
  const reasons = [
    `ANC pays per hectare in designated hard-farming areas: from ${formatEur(lowestRate)} to ${formatEur(highestRate)} per ha on the first hectares, depending on the land category.`,
    profile.county
      ? `Whether your land is designated depends on its townland, not just the county (${profile.county}). Check gov.ie's list.`
      : 'Whether your land is designated depends on its townland. Check gov.ie’s list.',
  ];
  reasons.push(
    livestock
      ? `You keep livestock, which is what the stocking rule counts: at least ${ancFacts.minStockingLuPerHa} livestock units per forage hectare for ${ancFacts.minStockingWeeks} weeks. We cannot check your numbers.`
      : 'Tillage land is paid without the stocking rule.',
  );
  if (profile.activeFarmer === false) {
    reasons.push('You must be an active farmer to be paid, and you said you are not.');
  }

  return {
    schemeId: 'anc',
    name: 'Areas of Natural Constraint',
    shortName: 'ANC',
    eligible: 'check',
    reasons,
    status: 'unknown',
    nextStep:
      'Look up your townlands on the gov.ie ANC list, then tick ANC on your BISS application.',
    url: officialUrls.anc,
  };
}
