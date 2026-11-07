// Seeds the schemes table from the verified catalogue (facts.ts), so db:reset always matches gov.ie as last checked.
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { schemeCatalogue } from './catalogue';
import { schemes } from './schema';

export async function seed(db: LibSQLDatabase) {
  await db.insert(schemes).values(
    schemeCatalogue.map((scheme, sortOrder) => ({
      ...scheme,
      sortOrder,
      ratePerHa: scheme.ratePerHa ?? null,
      maxHa: scheme.maxHa ?? null,
      grantRate: scheme.grantRate ?? null,
      investmentCeiling: scheme.investmentCeiling ?? null,
      deadline: scheme.deadline ?? null,
    })),
  );
}
