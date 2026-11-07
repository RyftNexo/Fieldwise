---
paths:
  - "apps/api/**"
---

# API conventions (owner: dev2)

- Stack: Hono on Node (run with tsx), Zod, SQLite via Drizzle + libsql (`@libsql/client`, async: `await db.select()…`).
- **Features** live in `src/features/<name>/`: `index.ts` exports `router` (a Hono app); optional `schema.ts`
  (Drizzle tables) and `seed.ts` (`seed(db)`). All auto-discovered — never edit a central route list or schema file.
- Route paths come from the contract: `router.get(endpoints.x.path, …)`. Validate input with
  `parseBody(c, endpoints.x)` / `parseQuery(c, schema)`; respond with `reply(c, endpoints.x, data, status?)` — it
  type-checks against the contract and validates at runtime outside production.
- Errors: `throw new AppError('NOT_FOUND', 'Booking not found')`; the global handler renders
  `{ error: { code, message, details } }`. Codes and statuses: `docs/API_CONTRACTS.md`.
- DB: IDs are `crypto.randomUUID()` strings, timestamps ISO strings. Schema change → `npm run db:reset` (drops and
  recreates the local DB from schema + seed). No migration files.
- Config and secrets only via `src/env.ts` (reads `apps/api/.env`); every new variable also goes in `.env.example`.
- External/LLM calls live in `src/services/`, run server-side only, use a timeout, and return fixtures when
  `env.DEMO_MODE === 'fixtures'` (the demo safety net).
- Tests: Vitest with `app.request()` against a fresh in-memory DB; assert every response parses with its contract schema.
