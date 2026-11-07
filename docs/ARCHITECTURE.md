# Architecture

Owner: **dev1** (product). Fill in the first section at kickoff; keep the rest in step with reality.

## What we're building

- **Problem:** _(from the brief)_
- **Users:** _(who, in one line)_
- **Demo path:** _(the 3–6 steps judges will see — detail in DEMO.md)_
- **Out of scope:** _(what we deliberately won't build)_

## System

```text
Browser ── React app (apps/web, Vite :5173 in dev)
   │  call(endpoints.x) — typed by @app/shared, validated on arrival
   ▼  /api/* (Vite proxy in dev; same server in demo)
Hono API (apps/api, :8787) ── parseBody / reply validate against the same contracts
   │  Drizzle ORM
   ▼
SQLite file (apps/api/data/app.db) — recreated from schema + seed by `npm run db:reset`
   ⇢ external APIs / LLMs (src/services, server-side keys, DEMO_MODE=fixtures fallback)
```
**Demo / production mode:** `npm run demo` resets the DB, builds the web app, and serves the build and `/api` from
a single Node process on one port — offline-capable.

## Stack (Profile A — default)

| Layer     | Choice                                                                    | Why                                                          |
| --------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Repo      | npm workspaces (`apps/*`, `packages/*`)                                   | No extra tooling                                             |
| Web       | Vite 8, React 19, TypeScript 7, Tailwind 4, React Router, TanStack Query  | Fast, well known to agents, polished UI quickly              |
| API       | Hono on Node 22+, run with tsx                                            | Small, typed, easy tests (`app.request`), streaming for LLMs |
| Data      | SQLite + Drizzle (libsql), schema per feature, no migration files | Zero infra, offline demo, no migration conflicts             |
| Contracts | Zod in `packages/shared` (types + runtime validation + fixtures)          | One definition shared by web, API, mocks and seeds           |
| Quality   | Biome, Vitest, smoke test, CI on every PR                                 | One formatter keeps three agents' diffs clean                |

**Profile B** (AI/data-heavy brief): `apps/api` becomes Python FastAPI; contracts move to Pydantic + OpenAPI, and
web types are generated from it (dev3). Ownership, workflow and the web app stay the same. Record the switch in DECISIONS.md.

## Repo layout

```text
apps/web/         dev1  src/app (shell, routing) · src/features/* · src/components · src/api/client.ts · src/mocks
apps/api/         dev2  src/features/*/{index,schema,seed}.ts · src/lib/http.ts · src/db · src/env.ts
packages/shared/  dev3  src/contracts/* (schemas + endpoints.ts registry) · src/fixtures/*
tests/smoke/      dev3  boots the production build and checks every simple GET contract
scripts/          dev3  guard, setup, task, sync, handoff, worktree, verify (+ tests)
docs/             mixed see OWNERSHIP.md
```

## Adding a feature (no shared files touched)

- **Web:** create `apps/web/src/features/<name>/index.tsx` exporting `routes` (and `nav`). It appears automatically.
- **API:** create `apps/api/src/features/<name>/index.ts` exporting `router`; add `schema.ts` / `seed.ts` if it has
  data, then `npm run db:reset`.
- **Contract:** dev3 adds it to `packages/shared` first (see API_CONTRACTS.md § Adding an endpoint).

## Testing layers

| Layer                            | Tool                                 | Owner |
| -------------------------------- | ------------------------------------ | ----- |
| Contracts and fixtures           | Vitest (`packages/shared`)           | dev3  |
| API endpoints vs contracts       | Vitest + `app.request`, in-memory DB | dev2  |
| Web logic and mocks vs contracts | Vitest                               | dev1  |
| Whole app, production build      | `npm run smoke` (CI and checkpoints) | dev3  |
| Ownership, hooks, task parser    | `node --test scripts/tests`          | dev3  |
