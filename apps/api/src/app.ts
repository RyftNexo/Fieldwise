import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { ERROR_STATUS } from '@app/shared';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { API_ROOT, isProd } from './env';
import { featureNames, importFeatureFile } from './lib/features';
import { AppError } from './lib/http';

const WEB_DIST = join(API_ROOT, '..', 'web', 'dist');

/** Build the app: mount every feature router, then (in --prod) the built web app. */
export async function createApp() {
  const app = new Hono();
  if (!process.env.VITEST) app.use('/api/*', logger());

  for (const name of featureNames()) {
    const mod = await importFeatureFile<{ router?: Hono }>(name, 'index');
    if (!mod?.router) {
      throw new Error(`src/features/${name}/index.ts must export \`router\` (a Hono app)`);
    }
    app.route('/', mod.router);
  }

  if (isProd) mountWebApp(app);

  app.notFound((c) =>
    c.json(
      { error: { code: 'NOT_FOUND', message: `No route for ${c.req.method} ${c.req.path}` } },
      404,
    ),
  );

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        err.status,
      );
    }
    if (err instanceof HTTPException) {
      return c.json(
        { error: { code: 'INTERNAL', message: err.message } },
        err.status as typeof ERROR_STATUS.INTERNAL,
      );
    }
    console.error(err);
    return c.json({ error: { code: 'INTERNAL', message: 'Something went wrong' } }, 500);
  });

  return app;
}

/** Single-port demo: static files from apps/web/dist + SPA fallback for non-/api routes. */
function mountWebApp(app: Hono) {
  const indexFile = join(WEB_DIST, 'index.html');
  if (!existsSync(indexFile)) {
    console.warn('⚠ apps/web/dist is missing — run `npm run build` to serve the web app.');
    return;
  }
  const indexHtml = readFileSync(indexFile, 'utf8');
  app.use('*', serveStatic({ root: relative(process.cwd(), WEB_DIST) || '.' }));
  app.get('*', async (c, next) => {
    if (c.req.path.startsWith('/api')) return next();
    return c.html(indexHtml);
  });
}
