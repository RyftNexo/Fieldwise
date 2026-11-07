// EXAMPLE FEATURE — seeds from the shared fixtures so mock mode and live mode show the same data.
import { noteFixtures } from '@app/shared';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { notes } from './schema';

export async function seed(db: LibSQLDatabase) {
  await db.insert(notes).values(noteFixtures);
}
