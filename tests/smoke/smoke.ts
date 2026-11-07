/**
 * Smoke test (owner: dev3) — boots the production server (web build + API on one port) against a
 * throwaway database with DEMO_MODE=fixtures, then checks:
 *   • every parameterless, no-auth GET endpoint in the contract registry answers 200 with a
 *     payload that matches its schema (new endpoints are covered automatically)
 *   • the web app and its SPA fallback are served, and unknown /api routes return the error envelope
 * Usage: `npm run build && npm run smoke`   ·   against a running app: SMOKE_URL=http://host:port npm run smoke
 */
import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApiErrorBody, endpoints, successBody } from '@app/shared';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const external = process.env.SMOKE_URL;
let server: ChildProcess | undefined;
let tmp: string | undefined;
let serverLog = '';

function fail(message: string): never {
  console.error(`✗ smoke: ${message}`);
  if (serverLog) console.error(`--- server output ---\n${serverLog}`);
  cleanup();
  process.exit(1);
}

function cleanup() {
  server?.kill();
  // Windows may hold the SQLite file briefly after the server is terminated.
  if (tmp) rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, () => {
      const address = probe.address();
      probe.close(() => resolve(typeof address === 'object' && address ? address.port : 0));
    });
  });
}

async function waitForHealth(base: string) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  fail(`server did not become healthy at ${base} within 30s`);
}

async function main() {
  let base = external;
  if (!base) {
    if (!existsSync(join(ROOT, 'apps/web/dist/index.html'))) {
      fail('apps/web/dist is missing — run `npm run build` first.');
    }
    const port = await freePort();
    tmp = mkdtempSync(join(tmpdir(), 'smoke-'));
    server = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts', '--prod'], {
      cwd: join(ROOT, 'apps/api'),
      env: {
        ...process.env,
        PORT: String(port),
        DB_FILE: join(tmp, 'smoke.db'),
        DEMO_MODE: 'fixtures',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout?.on('data', (d) => (serverLog += d));
    server.stderr?.on('data', (d) => (serverLog += d));
    server.on('exit', (code) => {
      if (code) fail(`server exited with code ${code}`);
    });
    base = `http://localhost:${port}`;
  }

  await waitForHealth(base);
  const results: string[] = [];
  const pending: string[] = [];

  for (const endpoint of Object.values(endpoints)) {
    if (endpoint.method !== 'GET' || endpoint.auth || endpoint.path.includes(':')) continue;
    const res = await fetch(base + endpoint.path);
    const body: unknown = await res.json().catch(() => null);
    const error = ApiErrorBody.safeParse(body);
    // Contracts are merged before the API implements them; that's expected, not a failure.
    if (
      res.status === 404 &&
      error.success &&
      error.data.error.message.startsWith('No route for')
    ) {
      pending.push(`${endpoint.id} GET ${endpoint.path}`);
      continue;
    }
    if (res.status !== 200) fail(`${endpoint.id} GET ${endpoint.path} → HTTP ${res.status}`);
    if (!successBody(endpoint.response).safeParse(body).success) {
      fail(`${endpoint.id} GET ${endpoint.path} → payload doesn't match contract`);
    }
    results.push(`${endpoint.id} GET ${endpoint.path}`);
  }

  const home = await fetch(`${base}/`);
  if (!(await home.text()).includes('<div id="root">')) fail('GET / did not return the web app');
  results.push('GET / serves the web app');

  const deepLink = await fetch(`${base}/some/client/route`);
  if (!deepLink.headers.get('content-type')?.includes('text/html'))
    fail('SPA fallback not working');
  results.push('SPA fallback for client routes');

  const missing = await fetch(`${base}/api/__smoke_missing__`);
  if (missing.status !== 404 || !ApiErrorBody.safeParse(await missing.json()).success) {
    fail('unknown /api route did not return a 404 error envelope');
  }
  results.push('unknown /api route → 404 envelope');

  for (const line of results) console.log(`✓ ${line}`);
  for (const line of pending)
    console.log(`! ${line} — in the contract, not implemented by the API yet`);
  console.log(`✓ smoke passed (${results.length} checks) against ${base}`);
}

main()
  .catch((err) => fail(err instanceof Error ? err.message : String(err)))
  .finally(cleanup);
