import { z } from 'zod';
import { Timestamp } from './common';

/** C-00 · GET /api/health — liveness + DB check. Used by the web status badge and smoke tests. */
export const HealthStatus = z.object({
  status: z.literal('ok'),
  time: Timestamp,
  db: z.enum(['ok', 'error', 'mock']),
  /** 'fixtures' when DEMO_MODE=fixtures (external APIs replaced by recorded responses). */
  demoMode: z.enum(['off', 'fixtures']),
});
export type HealthStatus = z.infer<typeof HealthStatus>;
