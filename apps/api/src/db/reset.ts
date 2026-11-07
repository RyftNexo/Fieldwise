/**
 * `npm run db:reset` — delete the local SQLite file, recreate tables from the Drizzle schema
 * and seed demo data. Use after every schema change; the local DB is disposable.
 */
import { rmSync } from 'node:fs';
import { DB_PATH } from '../env';

if (DB_PATH !== ':memory:') {
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    rmSync(`${DB_PATH}${suffix}`, { force: true });
  }
}

// Import after deleting so the client sees a brand-new database.
const { client, ensureDatabase } = await import('./client');
await ensureDatabase();
const result = await client.execute(
  "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '\\_%' escape '\\'",
);
client.close();
console.log(`✓ Database reset: ${DB_PATH}`);
console.log(`  tables: ${result.rows.map((row) => String(row.name)).join(', ') || '(none)'}`);
