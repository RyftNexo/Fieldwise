import { endpoints, type FarmProfile, type GrantMatch, type Lead } from '@app/shared';
import { desc } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../../db/client';
import { AppError, parseBody, reply } from '../../lib/http';
import { evaluateProfile, totalEstimatedEur } from '../advice/rules';
import { leads } from './schema';

export const router = new Hono();

/** The schemes the rules engine finds for this profile that the farmer picked. Figures never come from the client. */
function findMatches(profile: FarmProfile, schemeIds: string[]): GrantMatch[] {
  const profileMatches = evaluateProfile(profile);
  const unknownIds = schemeIds.filter(
    (id) => !profileMatches.some((match) => match.schemeId === id),
  );
  if (unknownIds.length > 0) {
    throw new AppError('VALIDATION_ERROR', 'Unknown scheme id', [
      {
        path: 'schemeIds',
        message: `Not a match for this farm: ${unknownIds.join(', ')}`,
      },
    ]);
  }
  const uniqueIds = new Set(schemeIds);
  return profileMatches.filter((match) => uniqueIds.has(match.schemeId));
}

// C-06: the server decides matches and the total; it never trusts figures from the client.
router.post(endpoints.createLead.path, async (c) => {
  const input = await parseBody(c, endpoints.createLead);
  const matches = findMatches(input.profile, input.schemeIds);
  const lead: Lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: input.name,
    phone: input.phone,
    email: input.email,
    profile: input.profile,
    matches,
    estimatedTotalEur: totalEstimatedEur(matches),
  };
  await db.insert(leads).values({
    ...lead,
    phone: lead.phone ?? null,
    email: lead.email ?? null,
  });
  return reply(c, endpoints.createLead, lead, 201);
});

// C-07: newest first
router.get(endpoints.listLeads.path, async (c) => {
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  const leadList: Lead[] = rows.map(({ phone, email, ...row }) => ({
    ...row,
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
  }));
  return reply(c, endpoints.listLeads, leadList);
});
