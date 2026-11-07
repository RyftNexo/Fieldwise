// PRE-CONTRACT view models (D1-04, decision D-018). They mirror docs/ARCHITECTURE.md § Contract v1 draft, so D1-02
// can replace this file with `import type { … } from '@app/shared'` once D3-01 merges. Don't add fields here that
// aren't in the draft: ask dev3 instead.

export type Enterprise = 'suckler' | 'beef' | 'dairy' | 'sheep' | 'tillage' | 'mixed' | 'other';
export type Eligibility = 'yes' | 'likely' | 'check';
export type SchemeStatus = 'open' | 'closed' | 'rolling' | 'unknown';
export type Investment = 'shed' | 'solar' | 'slurry' | 'machinery' | 'none';

export interface FarmProfile {
  hectares: number;
  enterprise: Enterprise;
  county?: string;
  /** The farmer's own words for where they are, e.g. "West Cork". */
  region?: string;
  age?: number;
  gender?: 'female' | 'male';
  /** Land that is wet, rough or unused. */
  marginalHectares?: number;
  nearWatercourse?: boolean;
  /** null = we don't know yet. */
  peatSoil?: boolean | null;
  /** SAC or SPA. null = we don't know yet. */
  designatedSite?: boolean | null;
  /** Claims BISS. */
  activeFarmer?: boolean;
  plannedInvestment?: Investment;
  /** Things worth asking the farmer, in plain words ("your age"). */
  missing: string[];
}

export interface GrantValue {
  oneOffEur?: number;
  annualEur?: number;
  years?: number;
  totalEur: number;
  /** How the rules engine got the number, in plain words. */
  basis: string;
}

export interface GrantMatch {
  schemeId: string;
  name: string;
  shortName: string;
  eligible: Eligibility;
  /** The rules that fired, in plain English. */
  reasons: string[];
  value?: GrantValue;
  status: SchemeStatus;
  /** ISO date. */
  deadline?: string;
  nextStep: string;
  /** Official scheme page. */
  url: string;
}

export interface AdviceResponse {
  profile: FarmProfile;
  matches: GrantMatch[];
  /** Up to 120 words, written by the Explain step from the matches only. */
  summary: string;
  nextSteps: string[];
  disclaimers: string[];
  /** Raw JSON from each stage, shown in the pipeline stepper. */
  steps: { extract: unknown; rules: unknown; explain: unknown };
  mode: 'live' | 'fixtures';
}

export interface CreateLeadInput {
  profile: FarmProfile;
  /** The matched schemes the farmer wants a forester to look at. */
  schemeIds: string[];
  name: string;
  phone?: string;
  email?: string;
  consent: true;
}

export interface Lead {
  id: string;
  /** ISO timestamp. */
  createdAt: string;
  name: string;
  phone?: string;
  email?: string;
  profile: FarmProfile;
  matches: GrantMatch[];
  estimatedTotalEur: number;
}
