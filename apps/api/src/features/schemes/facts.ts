// Scheme facts the rules engine and the schemes endpoint both read. One place to update when rates change.
//
// Every number below was read from gov.ie (scheme pages, the BISS 2026 terms and conditions, S.I. 484/2023) or
// Teagasc, checked on `checkedAt`. Anything we could not confirm is left out or marked `null`, never guessed.

/** When these facts were last compared with the official pages. */
export const checkedAt = '2026-11-07T00:00:00.000Z';

/** Native Tree Area Scheme: small native woodland on farmland (NTA1) or along water (NTA2). */
export const ntasFacts = {
  /** Area of one planting. S.I. 484/2023 reg 6. */
  minHaPerArea: 0.1,
  maxHaPerArea: 1,
  /** NTA1 and NTA2 combined. */
  maxHaTotal: 2,
  /** NTA2 plantings must be no wider than this. */
  nta2MaxWidthMetres: 20,
  /** One-off establishment grant per hectare (grant 1 is 75%, grant 2 is 25% at least four years later). */
  grantPerHaEur: 6_744,
  grant1PerHaEur: 5_058,
  grant2PerHaEur: 1_686,
  premiumYears: 10,
  nta1PremiumPerHaEur: 2_206,
  nta2PremiumPerHaEur: 2_284,
  /** The scheme closes to new applicants on this date (S.I. 484/2023 reg 4). */
  closesOn: '2027-12-31',
} as const;

export interface AncRateBand {
  /** Hectares paid at `ratePerHaEur`, counted from the first hectare of the category. */
  fromHa: number;
  toHa: number;
  ratePerHaEur: number;
}

/** Areas of Natural Constraint. Rates are listed per land category; designation is by townland (gov.ie list). */
export const ancFacts = {
  category1: [
    { fromHa: 0, toHa: 12, ratePerHaEur: 148 },
    { fromHa: 12, toHa: 34, ratePerHaEur: 112 },
  ],
  category2: [
    { fromHa: 0, toHa: 10, ratePerHaEur: 111 },
    { fromHa: 10, toHa: 30, ratePerHaEur: 104 },
  ],
  category3: [
    { fromHa: 0, toHa: 8, ratePerHaEur: 93 },
    { fromHa: 8, toHa: 30, ratePerHaEur: 88.25 },
  ],
  /** Combined categories are paid up to this many hectares (34 if 30 to 34 ha are Category 1). */
  maxHaCombined: 30,
  maxHaCategory1Only: 34,
  /** Stocking rule: livestock units per forage hectare, for 28 consecutive weeks and as an annual average. */
  minStockingLuPerHa: 0.1,
  minStockingWeeks: 28,
  /** No payment is made below this amount. */
  minPaymentEur: 100,
} as const satisfies Record<string, unknown>;

/** Basic Income Support for Sustainability. Paid per entitlement, and each farmer's entitlement values differ. */
export const bissFacts = {
  /** No farmer gets more than this per entitlement in 2026. */
  maxPerEntitlementEur: 285,
  /** In 2026 every entitlement is worth at least this share of the national average. */
  minShareOfNationalAverage: 0.85,
  /** Capped payment per farmer per year. */
  maxPaymentEur: 66_000,
  minPaymentEur: 100,
  /** Herd number (or an application for one) was needed by this date for 2026. */
  herdNumberDeadline2026: '2026-05-15',
} as const;

/** Agri-Climate Rural Environment Scheme. Payments depend on the actions chosen and field scores. */
export const acresFacts = {
  generalMaxPerYearEur: 7_311,
  cooperationMaxPerYearEur: 10_500,
  cooperationResultsBasedMaxEur: 7_000,
  cooperationInvestmentsAndLandscapeMaxEur: 3_500,
  /** Highest results-based rate per hectare (field score 10, grassland, peatland or scrubland). */
  topResultsRatePerHaEur: 400,
  /** A farmer enters General or Co-operation, never both. */
} as const;

export const officialUrls = {
  ntas: 'https://www.gov.ie/en/department-of-agriculture-food-and-the-marine/publications/native-tree-area-scheme/',
  anc: 'https://www.gov.ie/en/department-of-agriculture-food-and-the-marine/services/areas-of-natural-constraints/',
  biss: 'https://www.gov.ie/en/department-of-agriculture-food-and-the-marine/services/basic-income-support-for-sustainability-biss-scheme/',
  acres:
    'https://www.gov.ie/en/department-of-agriculture-food-and-the-marine/services/agri-climate-rural-environment-scheme-acres/',
} as const;
