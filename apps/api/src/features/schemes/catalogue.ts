// The list `GET /api/schemes` returns, built from the verified facts in facts.ts.
import { type Scheme, schemeFixtures } from '@app/shared';
import { acresFacts, ancFacts, bissFacts, checkedAt, ntasFacts, officialUrls } from './facts';

const gov = 'DAFM (gov.ie)';

const ntas: Scheme = {
  id: 'ntas',
  name: 'Native Tree Area Scheme',
  shortName: 'NTAS',
  summary:
    'Pays you to plant small areas of native trees on your land, with a yearly premium for 10 years. Good for wet corners and river edges.',
  criteria: [
    `Each planting is between ${ntasFacts.minHaPerArea} and ${ntasFacts.maxHaPerArea} ha, and ${ntasFacts.maxHaTotal} ha in total across the scheme.`,
    `NTA1 is a small native wood on farmed land. NTA2 protects water and can be no wider than ${ntasFacts.nta2MaxWidthMetres} m.`,
    `One-off grant of €${ntasFacts.grantPerHaEur.toLocaleString('en-IE')} per ha, paid 75% after planting and 25% at least four years later.`,
    `Yearly premium for ${ntasFacts.premiumYears} years: €${ntasFacts.nta1PremiumPerHaEur.toLocaleString('en-IE')} per ha (NTA1) or €${ntasFacts.nta2PremiumPerHaEur.toLocaleString('en-IE')} per ha (NTA2).`,
    'A registered forester should help with the application. The woodland is legally protected from felling afterwards.',
  ],
  ratePerHa: ntasFacts.nta1PremiumPerHaEur,
  maxHa: ntasFacts.maxHaTotal,
  status: 'open',
  deadline: ntasFacts.closesOn,
  url: officialUrls.ntas,
  source: `${gov}; S.I. 484/2023; Teagasc. Premium shown is the NTA1 annual rate.`,
  checkedAt,
};

const anc: Scheme = {
  id: 'anc',
  name: 'Areas of Natural Constraint',
  shortName: 'ANC',
  summary:
    'A yearly payment per hectare for farming land in a designated hard-farming area, claimed on your BISS application.',
  criteria: [
    'Your land must be in a designated ANC townland (gov.ie publishes the list by county).',
    'Declare the land on your BISS application each year and apply for ANC.',
    `Keep at least ${ancFacts.minStockingLuPerHa} livestock units per forage hectare for ${ancFacts.minStockingWeeks} weeks, and as a yearly average.`,
    'Category 1 pays €148 per ha for the first 12 ha, then €112 up to 34 ha. Category 2 pays €111 for the first 10 ha, then €104 up to 30 ha. Category 3 pays €93 for the first 8 ha, then €88.25 up to 30 ha.',
    `You must be an active farmer with a herd number. Nothing is paid below €${ancFacts.minPaymentEur}.`,
  ],
  ratePerHa: ancFacts.category1[0].ratePerHaEur,
  maxHa: ancFacts.maxHaCategory1Only,
  status: 'unknown',
  url: officialUrls.anc,
  source: `${gov}; BISS terms and conditions (ANC section); Teagasc. Highest rate shown. gov.ie labels the rate table 2021; the 2025 and 2026 terms list the same rates. Application dates not verified.`,
  checkedAt,
};

const biss: Scheme = {
  id: 'biss',
  name: 'Basic Income Support for Sustainability',
  shortName: 'BISS',
  summary:
    'The main yearly income support, paid on each eligible hectare you farm. The amount depends on the payment entitlements you hold.',
  criteria: [
    'One eligible hectare is needed for each payment entitlement you hold.',
    'You must hold a herd number (or have applied by 15 May 2026) and be an active farmer.',
    `Entitlement values differ from farmer to farmer. In 2026 none is above €${bissFacts.maxPerEntitlementEur}, and none is below 85% of the national average. Check yours on MyAgFood.ie.`,
    `The most one farmer can be paid in a year is €${bissFacts.maxPaymentEur.toLocaleString('en-IE')}. Nothing is paid below €${bissFacts.minPaymentEur}.`,
  ],
  status: 'unknown',
  url: officialUrls.biss,
  source: `${gov}; BISS 2026 terms and conditions. No per-hectare rate is shown because it depends on your entitlements. Application dates not verified.`,
  checkedAt,
};

const acres: Scheme = {
  id: 'acres',
  name: 'Agri-Climate Rural Environment Scheme',
  shortName: 'ACRES',
  summary:
    'Pays for farming in ways that help nature, climate and water. Payment depends on the actions you choose and how your fields score.',
  criteria: [
    `ACRES General pays up to €${acresFacts.generalMaxPerYearEur.toLocaleString('en-IE')} a year, available nationally.`,
    `ACRES Co-operation pays up to €${acresFacts.cooperationMaxPerYearEur.toLocaleString('en-IE')} a year (up to €${acresFacts.cooperationResultsBasedMaxEur.toLocaleString('en-IE')} results-based and €${acresFacts.cooperationInvestmentsAndLandscapeMaxEur.toLocaleString('en-IE')} for investments and landscape actions), in priority areas only.`,
    'You enter one of the two, not both.',
    `Results-based grassland payments reach €${acresFacts.topResultsRatePerHaEur} per ha for the best field score, and fall as the score drops.`,
    'An approved ACRES adviser helps you choose actions and apply. Whether the scheme is open to new entrants now is not confirmed here.',
  ],
  status: 'unknown',
  url: officialUrls.acres,
  source: `${gov}; scheme page updated 2 September 2026. The caps are yearly, not per hectare. Intake dates not verified.`,
  checkedAt,
};

// SCIS and AWNSS are still contract fixtures: their rates and rules are not verified, so checkedAt stays null.
const unverified: Scheme[] = schemeFixtures.filter((scheme) => scheme.id !== 'ntas');

export const schemeCatalogue: Scheme[] = [ntas, anc, biss, acres, ...unverified];
