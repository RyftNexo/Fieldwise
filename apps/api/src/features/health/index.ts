import { endpoints } from '@app/shared';
import { Hono } from 'hono';
import { databaseHealthy } from '../../db/client';
import { env } from '../../env';
import { reply } from '../../lib/http';

export const router = new Hono();

router.get(endpoints.health.path, async (c) =>
  reply(c, endpoints.health, {
    status: 'ok',
    time: new Date().toISOString(),
    db: (await databaseHealthy()) ? 'ok' : 'error',
    demoMode: env.DEMO_MODE,
  }),
);
