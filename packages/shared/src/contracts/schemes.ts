import { z } from 'zod';
import { SchemeStatus } from './advice';
import { Timestamp } from './common';

const Text = z.string().trim().min(1);

export const Scheme = z.object({
  id: Text,
  name: Text,
  shortName: Text,
  summary: Text,
  criteria: z.array(Text),
  ratePerHa: z.number().nonnegative().optional(),
  maxHa: z.number().positive().optional(),
  /** Fraction of eligible investment, from 0 to 1 (e.g. 0.4 = 40%). */
  grantRate: z.number().min(0).max(1).optional(),
  investmentCeiling: z.number().nonnegative().optional(),
  status: SchemeStatus,
  deadline: z.iso.date().optional(),
  url: z.url({ protocol: /^https$/ }),
  source: Text,
  /** null means the criteria/rates have not been verified; never imply a check occurred. */
  checkedAt: Timestamp.nullable(),
});
export type Scheme = z.infer<typeof Scheme>;
export const SchemeList = z.array(Scheme);
export type SchemeList = z.infer<typeof SchemeList>;
