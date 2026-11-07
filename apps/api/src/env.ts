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
  /** Twilio voice webhook. Missing is fine until a call arrives. */
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  /** Public https origin Twilio calls, with no path. Makes the signature match behind a tunnel. */
  TWILIO_PUBLIC_BASE: z.string().url().optional(),
  /** Twilio number that places the Ring call, in +E.164. Missing until a Voice number is bought. */
  TWILIO_FROM_NUMBER: z.string().min(1).optional(),
  /** Mobile the Call button dials, in +E.164. Stays in .env, never in source. */
  TWILIO_RING_TO: z.string().min(1).optional(),
  // New variables: add them here AND in apps/api/.env.example.
  // Secrets: z.string().optional(), then fail with a clear AppError where they're used.
});

export const env = Env.parse(process.env);

/** `npm start` passes --prod: serve the built web app and skip dev-only checks. */
export const isProd = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';

/** Absolute DB path (or ':memory:' for tests). */
export const DB_PATH = env.DB_FILE === ':memory:' ? ':memory:' : resolve(API_ROOT, env.DB_FILE);
