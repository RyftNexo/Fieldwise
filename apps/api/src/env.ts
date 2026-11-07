import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/** apps/api/ — paths in .env are relative to this folder, wherever the process starts. */
export const API_ROOT = fileURLToPath(new URL('..', import.meta.url));

try {
  process.loadEnvFile(resolve(API_ROOT, '.env'));
} catch {
  // No .env file: defaults below apply.
}

const Env = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  DB_FILE: z.string().min(1).default('./data/app.db'),
  DEMO_MODE: z.enum(['off', 'fixtures']).default('off'),
  /** Server-side only. Missing is fine until a live OpenAI call is made (or DEMO_MODE=fixtures). */
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default('gpt-4.1-mini'),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
  // New variables: add them here AND in apps/api/.env.example.
  // Secrets: z.string().optional(), then fail with a clear AppError where they're used.
});

export const env = Env.parse(process.env);

/** `npm start` passes --prod: serve the built web app and skip dev-only checks. */
export const isProd = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';

/** Absolute DB path (or ':memory:' for tests). */
export const DB_PATH = env.DB_FILE === ':memory:' ? ':memory:' : resolve(API_ROOT, env.DB_FILE);
