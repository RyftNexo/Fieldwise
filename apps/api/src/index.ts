import { serve } from '@hono/node-server';
import { createApp } from './app';
import { ensureDatabase } from './db/client';
import { env, isProd } from './env';

await ensureDatabase();
const app = await createApp();

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  const what = isProd ? 'App (web build + API)' : 'API';
  console.log(`${what} listening on http://localhost:${info.port}`);
});
