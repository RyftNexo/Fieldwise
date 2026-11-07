// PREVIEW DATA (pre-contract, D1-04 / decision D-018). Delete this file in D1-02, when the page calls C-03 through
// `call(endpoints.…)` and the mocks are built from the shared fixtures.
// The figures are placeholders from the kickoff plan and have NOT been checked against gov.ie (decision D-013).
import type { PipelineStage } from './pipeline';
import type { AdviceResponse, FarmProfile, GrantMatch } from './types';

const DECLAN_PROFILE: FarmProfile = {
  hectares: 40,
  enterprise: 'suckler',
  county: 'Cork',
  region: 'West Cork',
  marginalHectares: 3,
  nearWatercourse: true,
  peatSoil: null,
  designatedSite: null,
  missing: ['your age', 'the soil type of the wet land', 'whether you already claim BISS'],
};

const DECLAN_MATCHES: GrantMatch[] = [
  {
    schemeId: 'ntas',
    name: 'Native Tree Area Scheme',
    shortName: 'NTAS',
    eligible: 'likely',
    reasons: [
      "You have 3 ha you can't graze, beside a river.",
      'NTA2 pays for a strip of native trees along a watercourse: up to 1 ha, at most 20 m wide.',
      'NTA1 covers up to 1 ha more of native woodland, so up to 2 ha in total.',
      'Peat soils and designated sites (SAC/SPA) are excluded, so a registered forester has to confirm the site.',
    ],
    value: {
      years: 10,
      totalEur: 44_900,
      basis:
        '1 ha under NTA1 (about €22,060) + 1 ha under NTA2 (about €22,840) over 10 years. Launch figures, still to check against gov.ie.',
    },
    status: 'unknown',
    nextStep: 'Ask a registered forester to walk the wet land with you. They make the application.',
    url: 'https://www.gov.ie/en/search/?q=Native+Tree+Area+Scheme',
  },
  {
    schemeId: 'anc',
    name: 'Areas of Natural Constraint',
    shortName: 'ANC',
    eligible: 'likely',
    reasons: [
      'Much of West Cork is designated as an Area of Natural Constraint.',
      'You keep cattle, so you probably meet the minimum stocking rate (0.15 livestock units per hectare for 7 months).',
      'Your land parcels decide the final amount.',
    ],
    status: 'unknown',
    nextStep: 'Tick ANC on your next BISS application.',
    url: 'https://www.gov.ie/en/search/?q=Areas+of+Natural+Constraint',
  },
  {
    schemeId: 'biss',
    name: 'Basic Income Support for Sustainability',
    shortName: 'BISS',
    eligible: 'likely',
    reasons: [
      'You farm 40 ha yourself, so you are likely an active farmer.',
      'BISS is the base payment. ANC and CRISS are paid on top of it.',
    ],
    status: 'unknown',
    nextStep: 'Make sure you claim BISS every year. The amount depends on your entitlements.',
    url: 'https://www.gov.ie/en/search/?q=Basic+Income+Support+for+Sustainability',
  },
  {
    schemeId: 'acres',
    name: 'Agri-Climate Rural Environment Scheme',
    shortName: 'ACRES',
    eligible: 'check',
    reasons: [
      'Your wet land borders a river, and ACRES pays for actions that protect water, such as buffer strips.',
      'Whether you can join depends on whether a new intake is open.',
    ],
    status: 'unknown',
    nextStep: 'Ask your Teagasc office in Cork whether ACRES is taking new applicants.',
    url: 'https://www.gov.ie/en/search/?q=Agri-Climate+Rural+Environment+Scheme',
  },
];

const DECLAN_SUMMARY =
  "Your 3 wet hectares beside the river are your best opportunity. Under the Native Tree Area Scheme you could plant native trees on up to 2 hectares, worth about €44,900 over 10 years, as long as a registered forester confirms the soil isn't peat and the land isn't in a designated site. Keep claiming BISS, tick ANC on your next application, and ask Teagasc whether ACRES is open for a river buffer strip.";

const STAGE_DELAY_MS: Record<PipelineStage, number> = { extract: 900, rules: 600, explain: 900 };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Walks through the three stages with short pauses so the stepper can be built before the API exists, then
 * returns Declan's worked example, whatever the question was.
 */
export async function getPreviewAdvice(
  text: string,
  onStage: (stage: PipelineStage) => void,
): Promise<AdviceResponse> {
  for (const stage of ['extract', 'rules', 'explain'] as const) {
    onStage(stage);
    await wait(STAGE_DELAY_MS[stage]);
  }
  return {
    profile: DECLAN_PROFILE,
    matches: DECLAN_MATCHES,
    summary: DECLAN_SUMMARY,
    nextSteps: [
      'Ring a registered forester to look at the 3 wet hectares (soil type, designated sites).',
      'Have your herd number and your land parcel map from agfood.ie to hand.',
      'Ask the Teagasc office in Cork whether ACRES is open to new applicants.',
      'Tick ANC on your next BISS application.',
    ],
    disclaimers: [
      'Preview figures: not yet checked against gov.ie.',
      'GrantGuide is a guide, not a decision. The Department of Agriculture makes the final call.',
    ],
    steps: {
      extract: { model: 'gemini (preview)', input: text, output: DECLAN_PROFILE },
      rules: {
        engine: 'rules engine (no AI)',
        schemesChecked: ['NTAS', 'ANC', 'BISS', 'ACRES'],
        fired: [
          'ntas.watercourse_strip',
          'ntas.native_woodland',
          'ntas.exclusions_unverified',
          'anc.region',
          'anc.stocking_rate',
          'biss.active_farmer',
          'acres.watercourse',
        ],
        valuesEur: { ntas: 44_900 },
      },
      explain: {
        model: 'gemini (preview)',
        words: DECLAN_SUMMARY.split(/\s+/).length,
        mentions: ['NTAS', 'ANC', 'BISS', 'ACRES'],
      },
    },
    mode: 'fixtures',
  };
}
