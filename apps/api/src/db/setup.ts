import type { Client } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { featureNames, importFeatureFile } from '../lib/features';

/** Merge every feature's schema.ts exports into one object (tables only matter). */
export async function loadSchema(): Promise<Record<string, unknown>> {
  const merged: Record<string, unknown> = {};
  for (const name of featureNames()) {
    const mod = await importFeatureFile<Record<string, unknown>>(name, 'schema');
    if (mod) Object.assign(merged, mod);
  }
  return merged;
}

/**
 * Create all tables on an EMPTY database straight from the Drizzle schema (no migration files —
 * they conflict when three people add them in parallel). Uses drizzle-kit's programmatic API.
 */
export async function createSchema(client: Client): Promise<void> {
  const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import('drizzle-kit/api');
  const schema = await loadSchema();
  const empty = await generateSQLiteDrizzleJson({});
  const current = await generateSQLiteDrizzleJson(schema);
  const statements = await generateSQLiteMigration(empty, current);
  if (statements.length) await client.batch(statements, 'write');
}

type Seed = (db: LibSQLDatabase) => void | Promise<void>;

/** Run every feature's seed(db) in feature-name order. */
export async function seedDatabase(db: LibSQLDatabase): Promise<void> {
  for (const name of featureNames()) {
    const mod = await importFeatureFile<{ seed?: Seed }>(name, 'seed');
    await mod?.seed?.(db);
  }
}
