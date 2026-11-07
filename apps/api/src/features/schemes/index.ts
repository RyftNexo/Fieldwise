// C-05. The verified list lives in catalogue.ts (built from facts.ts); seed.ts copies it into the `schemes` table.
import { endpoints, type Scheme } from '@app/shared';
import { asc } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../../db/client';
import { reply } from '../../lib/http';
import { schemes } from './schema';

export const router = new Hono();

type SchemeRow = typeof schemes.$inferSelect;

/** Optional contract fields are left out when the column is null, never sent as null. */
function toScheme({ sortOrder: _sortOrder, ...row }: SchemeRow): Scheme {
  const { ratePerHa, maxHa, grantRate, investmentCeiling, deadline, ...required } = row;
  return {
    ...required,
    ...(ratePerHa !== null ? { ratePerHa } : {}),
    ...(maxHa !== null ? { maxHa } : {}),
    ...(grantRate !== null ? { grantRate } : {}),
    ...(investmentCeiling !== null ? { investmentCeiling } : {}),
    ...(deadline !== null ? { deadline } : {}),
  };
}

router.get(endpoints.listSchemes.path, async (c) => {
  const rows = await db.select().from(schemes).orderBy(asc(schemes.sortOrder));
  return reply(c, endpoints.listSchemes, rows.map(toScheme));
});
