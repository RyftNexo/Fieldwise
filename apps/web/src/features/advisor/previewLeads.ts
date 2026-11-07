// PREVIEW (pre-contract, D1-09 / decision D-018). Leads live in memory in this browser tab, so the forester flow can
// be built before C-06/C-07 exist. Delete this file in D1-07: the button will call `call(endpoints.…)` to create a
// lead and the inbox will call it to list them. The two example leads are made up.
import { summariseMatches } from './summary';
import type { CreateLeadInput, FarmProfile, GrantMatch, Lead } from './types';

const MINUTE = 60_000;

function ntasMatch(part: 'NTA1' | 'NTA2', totalEur: number, reason: string): GrantMatch {
  return {
    schemeId: 'ntas',
    name: 'Native Tree Area Scheme',
    shortName: 'NTAS',
    eligible: 'likely',
    reasons: [
      reason,
      "Peat soils and designated sites are excluded, so the site needs a forester's check.",
    ],
    value: {
      years: 10,
      totalEur,
      basis: `1 ha under ${part} over 10 years. Launch figures, still to check against gov.ie.`,
    },
    status: 'unknown',
    nextStep: 'A registered forester walks the site and makes the application.',
    url: 'https://www.gov.ie/en/search/?q=Native+Tree+Area+Scheme',
  };
}

function exampleLead(
  id: string,
  minutesAgo: number,
  name: string,
  email: string,
  profile: FarmProfile,
  matches: GrantMatch[],
): Lead {
  return {
    id,
    createdAt: new Date(Date.now() - minutesAgo * MINUTE).toISOString(),
    name,
    email,
    profile,
    matches,
    estimatedTotalEur: summariseMatches(matches).totalEur,
  };
}

let leads: Lead[] = [
  exampleLead(
    'example-siobhan',
    25,
    'Siobhán',
    'siobhan@example.com',
    {
      hectares: 25,
      enterprise: 'suckler',
      county: 'Cork',
      region: 'Skibbereen',
      marginalHectares: 1,
      nearWatercourse: true,
      missing: [],
    },
    [ntasMatch('NTA2', 22_840, 'About 1 ha beside a stream, right for a strip of native trees.')],
  ),
  exampleLead(
    'example-pat',
    130,
    'Pat',
    'pat@example.com',
    {
      hectares: 60,
      enterprise: 'dairy',
      county: 'Cork',
      region: 'Macroom',
      marginalHectares: 1,
      missing: [],
    },
    [ntasMatch('NTA1', 22_060, 'A rough 1 ha corner that could become native woodland.')],
  ),
];

const pause = () =>
  new Promise<void>((resolve) => setTimeout(resolve, import.meta.env.MODE === 'test' ? 0 : 250));

/** Every lead, newest first. */
export async function listPreviewLeads(): Promise<Lead[]> {
  await pause();
  return [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The real API will re-check the rules from `schemeIds`; the preview keeps the matches the page already has. */
export async function createPreviewLead(
  input: CreateLeadInput,
  matches: GrantMatch[],
): Promise<Lead> {
  await pause();
  const chosen = matches.filter((match) => input.schemeIds.includes(match.schemeId));
  const lead: Lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: input.name,
    phone: input.phone,
    email: input.email,
    profile: input.profile,
    matches: chosen,
    estimatedTotalEur: summariseMatches(chosen).totalEur,
  };
  leads = [lead, ...leads];
  return lead;
}
