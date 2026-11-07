import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Feature auto-discovery: every folder in src/features/ is a feature.
 *   index.ts  → must export `router` (a Hono app with full /api/... paths)
 *   schema.ts → optional Drizzle tables
 *   seed.ts   → optional `seed(db)` for demo data
 * Adding a feature never means editing a shared file. Folders starting with "_" are ignored.
 */
export const FEATURES_DIR = fileURLToPath(new URL('../features', import.meta.url));

export function featureNames(): string[] {
  return readdirSync(FEATURES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();
}

export async function importFeatureFile<T>(feature: string, file: string): Promise<T | undefined> {
  for (const ext of ['.ts', '.js']) {
    const path = join(FEATURES_DIR, feature, `${file}${ext}`);
    if (existsSync(path)) return (await import(pathToFileURL(path).href)) as T;
  }
  return undefined;
}
