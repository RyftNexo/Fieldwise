// Basic Income Support for Sustainability. Paid per entitlement; we cannot see a farmer's entitlements,
// so there is no euro figure here.
import type { FarmProfile, GrantMatch } from '@app/shared';
import { bissFacts, officialUrls } from '../../schemes/facts';
import { formatEur, formatHa } from './format';

export function evaluateBiss(profile: FarmProfile): GrantMatch {
  const notActive = profile.activeFarmer === false;
  const reasons = [
    profile.hectares === undefined
      ? 'BISS pays on each eligible hectare you farm, up to the number of payment entitlements you hold. You did not give a farm size, so there is no hectare total here.'
      : `You farm ${formatHa(profile.hectares)}. BISS pays on each eligible hectare you farm, up to the number of payment entitlements you hold.`,
    notActive
      ? 'You must be the active farmer on the land, and you said you are not, so check before you claim.'
      : 'You must be an active farmer with a herd number. We assume you are, so confirm it.',
    `The value of an entitlement differs from farmer to farmer. In 2026 none is above ${formatEur(bissFacts.maxPerEntitlementEur)}. You can see yours on MyAgFood.ie.`,
  ];

  return {
    schemeId: 'biss',
    name: 'Basic Income Support for Sustainability',
    shortName: 'BISS',
    eligible: notActive ? 'check' : 'likely',
    reasons,
    status: 'unknown',
    nextStep:
      'Claim BISS every year. ANC and other schemes are applied for on the same application.',
    url: officialUrls.biss,
  };
}
