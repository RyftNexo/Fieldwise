import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { DB_PATH } from '../env';
import { createSchema, seedDatabase } from './setup';

/**
 * SQLite via libsql: prebuilt binaries for every OS ship through npm (no compiler, any Node version),
 * and the same client can later point at a hosted Turso database if the brief needs one.
 */
const isNewDatabase = DB_PATH === ':memory:' || !existsSync(DB_PATH);
if (DB_PATH !== ':memory:') mkdirSync(dirname(DB_PATH), { recursive: true });

export const client = createClient({
  url: DB_PATH === ':memory:' ? ':memory:' : pathToFileURL(DB_PATH).href, // file:/// works on Windows too
});

/** Drizzle instance (async: `await db.select()…`). Import tables from the feature's own schema.ts. */
export const db = drizzle(client);
export type DB = typeof db;

let ready: Promise<void> | undefined;

/**
 * Called once at startup (and in tests). A brand-new database gets its tables created from
 * each feature's schema.ts and is seeded with demo data. Schema changed? Run `npm run db:reset`.
 */
export function ensureDatabase(): Promise<void> {
  ready ??= (async () => {
    await client.execute('PRAGMA foreign_keys = ON');
    if (isNewDatabase) {
      await createSchema(client);
      await seedDatabase(db);
    }
  })();
  return ready;
}

export async function databaseHealthy(): Promise<boolean> {
  try {
    await client.execute('select 1');
    return true;
  } catch {
    return false;
  }
}
