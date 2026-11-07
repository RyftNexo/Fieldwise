import { z } from 'zod';
import { FarmProfile, GrantMatch } from './advice';
import { Id, Timestamp } from './common';

const Name = z.string().trim().min(1).max(120);
const Phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s().-]+$/, 'Use a valid phone number')
  .refine((phone) => {
    const digits = phone.replace(/\D/g, '').length;
    return digits >= 7 && digits <= 15;
  }, 'Use 7 to 15 digits');
const Email = z.email().max(254);

export const CreateLeadInput = z
  .object({
    profile: FarmProfile,
    schemeIds: z.array(z.string().trim().min(1)).min(1),
    name: Name,
    phone: Phone.optional(),
    email: Email.optional(),
    consent: z.literal(true),
  })
  .refine((lead) => Boolean(lead.phone || lead.email), {
    path: ['phone'],
    message: 'Provide a phone number or email address',
  });
export type CreateLeadInput = z.infer<typeof CreateLeadInput>;

/** Matches and totals are calculated by the server, never trusted from the submitted lead. */
export const Lead = z.object({
  id: Id,
  createdAt: Timestamp,
  name: Name,
  phone: Phone.optional(),
  email: Email.optional(),
  profile: FarmProfile,
  matches: z.array(GrantMatch),
  estimatedTotalEur: z.number().nonnegative(),
});
export type Lead = z.infer<typeof Lead>;
export const LeadList = z.array(Lead);
export type LeadList = z.infer<typeof LeadList>;
