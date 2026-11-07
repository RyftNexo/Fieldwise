import type { AdviceResponse, FarmProfile, GrantMatch } from '../contracts/advice';
import type { CreateLeadInput, Lead } from '../contracts/leads';
import type { Scheme } from '../contracts/schemes';

/** Contract examples, not a verified scheme catalogue or eligibility engine. No payment rates are asserted. */
export const schemeFixtures: [Scheme, Scheme, Scheme] = [
  {
    id: 'ntas',
    name: 'Native Tree Area Scheme',
    shortName: 'NTAS',
    summary: 'A native woodland option to discuss with a registered forester.',
    criteria: ['A forester must check site suitability and the current scheme conditions.'],
    status: 'unknown',
    url: 'https://www.gov.ie/en/department-of-agriculture-food-and-the-marine/publications/native-tree-area-scheme/',
    source: 'DAFM; fixture metadata only, scheme criteria and rates not verified.',
    checkedAt: null,
  },
  {
    id: 'scis',
    name: 'Solar Capital Investment Scheme',
    shortName: 'SCIS',
    summary: 'A solar investment option to discuss with a farm adviser.',
    criteria: ['Confirm the current investment rules, required approvals and application window.'],
    status: 'unknown',
    url: 'https://www.gov.ie/en/search/?q=Solar+Capital+Investment+Scheme',
    source: 'DAFM; fixture metadata only, scheme criteria and rates not verified.',
    checkedAt: null,
  },
  {
    id: 'awnss',
    name: 'Animal Welfare and Nutrient Storage Scheme',
    shortName: 'AWNSS',
    summary: 'A housing investment option to discuss with a farm adviser.',
    criteria: ['Confirm the current eligible works, planning requirements and application window.'],
    status: 'unknown',
    url: 'https://www.gov.ie/en/search/?q=Animal+Welfare+and+Nutrient+Storage+Scheme',
    source: 'DAFM; fixture metadata only, scheme criteria and rates not verified.',
    checkedAt: null,
  },
];

export const farmProfileFixtures = {
  declan: {
    hectares: 40,
    enterprise: 'suckler',
    county: 'Cork',
    region: 'West Cork',
    marginalHectares: 3,
    nearWatercourse: true,
    peatSoil: null,
    designatedSite: null,
    missing: ['your age', 'the soil type of the wet land', 'whether you already claim BISS'],
  },
  aoife: {
    hectares: 60,
    enterprise: 'dairy',
    county: 'Tipperary',
    age: 29,
    gender: 'female',
    plannedInvestment: 'solar',
    missing: ['the planned installation cost', 'whether you already claim BISS'],
  },
  mary: {
    hectares: 35,
    enterprise: 'sheep',
    county: 'Kerry',
    plannedInvestment: 'shed',
    missing: ['your age', 'the planned building cost', 'whether planning permission is needed'],
  },
} satisfies Record<string, FarmProfile>;

function adviceFixture(profile: FarmProfile, scheme: Scheme): AdviceResponse {
  const match: GrantMatch = {
    schemeId: scheme.id,
    name: scheme.name,
    shortName: scheme.shortName,
    eligible: 'check',
    reasons: [
      'This example is for testing. Eligibility and payment amounts have not been verified.',
    ],
    status: 'unknown',
    nextStep: scheme.criteria[0] ?? 'Speak with a farm adviser.',
    url: scheme.url,
  };
  const summary = `Ask an adviser about ${scheme.name}. This fixture demonstrates the response format; it does not establish eligibility or estimate a payment.`;
  return {
    profile,
    matches: [match],
    summary,
    nextSteps: [match.nextStep],
    disclaimers: [
      'Contract fixture only: scheme conditions, availability and payment rates are not verified.',
      'The Department of Agriculture makes the final eligibility decision.',
    ],
    steps: {
      extract: { profile, fixture: true },
      rules: { matches: [match], fixture: true },
      explain: { summary, fixture: true },
    },
    mode: 'fixtures',
  };
}

export const adviceFixtures: Record<keyof typeof farmProfileFixtures, AdviceResponse> = {
  declan: adviceFixture(farmProfileFixtures.declan, schemeFixtures[0]),
  aoife: adviceFixture(farmProfileFixtures.aoife, schemeFixtures[1]),
  mary: adviceFixture(farmProfileFixtures.mary, schemeFixtures[2]),
};

/** Synthetic contact data; never seed real farmers' details. */
export const createLeadFixture: CreateLeadInput = {
  profile: farmProfileFixtures.declan,
  schemeIds: ['ntas'],
  name: 'Declan (demo)',
  email: 'declan@example.test',
  consent: true,
};

export const leadFixtures: Lead[] = [
  {
    id: '4f427c08-82e6-4eb0-8cd0-f54ef9d14213',
    createdAt: '2026-11-07T12:00:00.000Z',
    name: createLeadFixture.name,
    email: createLeadFixture.email,
    profile: createLeadFixture.profile,
    matches: adviceFixtures.declan.matches,
    // No verified estimates in the fixture; an empty sum is zero, not a promise of payment.
    estimatedTotalEur: 0,
  },
];
