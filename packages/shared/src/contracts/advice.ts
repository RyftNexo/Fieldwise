import { z } from 'zod';

const Text = z.string().trim().min(1);
const Amount = z.number().nonnegative();

export const Enterprise = z.enum([
  'suckler',
  'beef',
  'dairy',
  'sheep',
  'tillage',
  'mixed',
  'other',
]);
export type Enterprise = z.infer<typeof Enterprise>;
export const Investment = z.enum(['shed', 'solar', 'slurry', 'machinery', 'none']);
export type Investment = z.infer<typeof Investment>;
export const Eligibility = z.enum(['yes', 'likely', 'check']);
export type Eligibility = z.infer<typeof Eligibility>;
export const SchemeStatus = z.enum(['open', 'closed', 'rolling', 'unknown']);
export type SchemeStatus = z.infer<typeof SchemeStatus>;

/** Missing facts stay absent (or explicitly unknown); extraction must not invent them. */
export const FarmProfile = z
  .object({
    hectares: z.number().positive(),
    enterprise: Enterprise,
    county: Text.optional(),
    region: Text.optional(),
    age: z.number().int().min(0).max(120).optional(),
    gender: z.enum(['female', 'male']).optional(),
    marginalHectares: Amount.optional(),
    nearWatercourse: z.boolean().optional(),
    peatSoil: z.boolean().nullable().optional(),
    designatedSite: z.boolean().nullable().optional(),
    activeFarmer: z.boolean().optional(),
    plannedInvestment: Investment.optional(),
    missing: z.array(Text),
  })
  .refine((profile) => (profile.marginalHectares ?? 0) <= profile.hectares, {
    path: ['marginalHectares'],
    message: 'Marginal land cannot exceed the total farm area',
  });
export type FarmProfile = z.infer<typeof FarmProfile>;

export const GrantValue = z.object({
  oneOffEur: Amount.optional(),
  annualEur: Amount.optional(),
  years: z.number().int().positive().optional(),
  totalEur: Amount,
  basis: Text,
});
export type GrantValue = z.infer<typeof GrantValue>;

export const GrantMatch = z.object({
  schemeId: Text,
  name: Text,
  shortName: Text,
  eligible: Eligibility,
  reasons: z.array(Text).min(1),
  value: GrantValue.optional(),
  status: SchemeStatus,
  deadline: z.iso.date().optional(),
  nextStep: Text,
  url: z.url({ protocol: /^https$/ }),
});
export type GrantMatch = z.infer<typeof GrantMatch>;

export const AdviceResponse = z.object({
  profile: FarmProfile,
  matches: z.array(GrantMatch),
  summary: Text.refine((text) => text.split(/\s+/u).length <= 120, 'Use at most 120 words'),
  nextSteps: z.array(Text),
  disclaimers: z.array(Text),
  steps: z.object({ extract: z.json(), rules: z.json(), explain: z.json() }),
  mode: z.enum(['live', 'fixtures']),
});
export type AdviceResponse = z.infer<typeof AdviceResponse>;

export const AdviceInput = z.object({ text: Text.max(10_000) });
export type AdviceInput = z.infer<typeof AdviceInput>;
export const EvaluateAdviceInput = z.object({ profile: FarmProfile });
export type EvaluateAdviceInput = z.infer<typeof EvaluateAdviceInput>;
