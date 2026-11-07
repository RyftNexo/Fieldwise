// Native Tree Area Scheme. Facts: schemes/facts.ts (S.I. 484/2023, gov.ie, Teagasc).
import type { FarmProfile, GrantMatch } from '@app/shared';
import { checkedAt, ntasFacts, officialUrls } from '../../schemes/facts';
import { dateOnly, formatEur, formatHa } from './format';

/** Hectares we can suggest planting. NTA2 is a strip beside water; NTA1 is a small native wood on farmed land. */
export function plantableHectares(profile: FarmProfile) {
  const nearWater = profile.nearWatercourse === true;
  // With no figure for unused land, a river-side strip is the only planting we can point to.
  const landAvailable = profile.marginalHectares ?? (nearWater ? ntasFacts.maxHaPerArea : 0);
  const nta2Ha = nearWater ? Math.min(ntasFacts.maxHaPerArea, landAvailable) : 0;
  const nta1Ha = Math.min(ntasFacts.maxHaPerArea, landAvailable - nta2Ha);
  return { nta1Ha, nta2Ha, totalHa: nta1Ha + nta2Ha };
}

/** Returns null when the farm has no land NTAS could use. */
export function evaluateNtas(profile: FarmProfile): GrantMatch | null {
  const { nta1Ha, nta2Ha, totalHa } = plantableHectares(profile);
  if (totalHa < ntasFacts.minHaPerArea) return null;

  const oneOffEur = totalHa * ntasFacts.grantPerHaEur;
  const annualEur = nta1Ha * ntasFacts.nta1PremiumPerHaEur + nta2Ha * ntasFacts.nta2PremiumPerHaEur;
  const totalEur = oneOffEur + annualEur * ntasFacts.premiumYears;

  const reasons: string[] = [];
  if (profile.marginalHectares) {
    reasons.push(`You have ${formatHa(profile.marginalHectares)} that is wet, rough or unused.`);
  }
  if (nta2Ha > 0) {
    reasons.push(
      `A strip of native trees beside your watercourse (NTA2) could be up to ${formatHa(nta2Ha)}, no wider than ${ntasFacts.nta2MaxWidthMetres} m.`,
    );
  }
  if (nta1Ha > 0) {
    reasons.push(`A small native wood on farmed land (NTA1) could be up to ${formatHa(nta1Ha)}.`);
  }
  reasons.push(`The scheme allows ${formatHa(ntasFacts.maxHaTotal)} in total.`);

  const siteUnknown = profile.peatSoil == null || profile.designatedSite == null;
  const siteRisk = profile.peatSoil === true || profile.designatedSite === true;
  reasons.push(
    siteRisk
      ? 'You told us the land is on peat soil or in a designated site, so a registered forester must confirm it can be planted.'
      : siteUnknown
        ? 'We cannot tell whether the land is peat soil or in a designated site (SAC or SPA). A registered forester confirms this.'
        : 'You told us the land is not on peat soil or in a designated site. A registered forester still confirms the site.',
  );

  return {
    schemeId: 'ntas',
    name: 'Native Tree Area Scheme',
    shortName: 'NTAS',
    eligible: siteRisk ? 'check' : siteUnknown ? 'likely' : 'yes',
    reasons,
    value: {
      oneOffEur,
      annualEur,
      years: ntasFacts.premiumYears,
      totalEur,
      basis: `${formatEur(ntasFacts.grantPerHaEur)} per ha one-off grant, plus yearly premiums of ${formatEur(ntasFacts.nta1PremiumPerHaEur)} (NTA1) or ${formatEur(ntasFacts.nta2PremiumPerHaEur)} (NTA2) per ha for ${ntasFacts.premiumYears} years. The most you could get; rates from gov.ie, checked ${dateOnly(checkedAt)}.`,
    },
    status: 'open',
    deadline: ntasFacts.closesOn,
    nextStep: 'Ask a registered forester to walk the land with you. They make the application.',
    url: officialUrls.ntas,
  };
}
