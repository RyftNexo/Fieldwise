# Architecture

Owner: **dev1** (product). Fill in the first section at kickoff; keep the rest in step with reality.

## What we're building

**GrantGuide** is a plain-language grant advisor for Irish farmers. A farmer describes their farm in their own
words, typed or spoken. GrantGuide checks it against Department of Agriculture (DAFM) scheme rules. It returns the grants
they likely qualify for, each with a € estimate, the rule that fired, the deadline and a link.

- **Problem:** grant rules live in dense DAFM PDFs and spreadsheets. Farmers leave money unclaimed or pay a consultant
  just to find out whether they qualify.
- **Users:** farmers who aren't technical, often on a phone. Persona: Declan, 55, farms 40 ha of suckler beef in West
  Cork; 3 ha beside a river are too wet to graze.
- **Demo path:** describe the farm → watch Extract → Rules → Explain → check "what we understood" → grant cards with €
  and reasons → next steps → send to a registered forester. Detail in DEMO.md.
- **Out of scope:** DAFM login or herd-number checks, land-parcel (LPIS) maps, nitrates or soil compliance, user
  accounts, live scraping of gov.ie, email alerts, a phone-call version.
- **Pitch line:** "We don't trust the AI to make grant decisions. Code does the matching and the maths; the LLM only
  listens and talks."

## How a question becomes advice

1. **Extract** (Gemini, `apps/api`): free text → a strict JSON `FarmProfile` (Gemini response schema, then validated
   with Zod). Anything the farmer didn't mention goes into `missing`.
2. **Rules** (pure TypeScript in `apps/api`, no AI): one function per scheme checks the profile against hard-coded
   criteria and computes the €. Conditions we can't verify (peat soil, designated sites) return `likely` or `check`
   with the reason. Each scheme has a table of unit tests.
3. **Explain** (Gemini): a summary of at most 120 words covering the engine's results only. No new schemes, no new
   figures.
4. **Render** (`apps/web`): structured cards, chips and a checklist, never a wall of chat text. Editing a chip re-runs
   step 2 only (C-04).

`DEMO_MODE=fixtures` replays recorded Gemini replies, so the demo also works offline.

## Contract v1 draft (proposed by dev1; dev3 owns the real one in D3-01)

The web app builds against these shapes. Until they are merged into `packages/shared`, the advisor page runs on local
preview data (D1-04, decision D-018).

| ID   | Method | Path                   | Request           | Response `data`                        |
| ---- | ------ | ---------------------- | ----------------- | -------------------------------------- |
| C-03 | POST   | `/api/advice`          | `{ text }`        | `AdviceResponse`                       |
| C-04 | POST   | `/api/advice/evaluate` | `{ profile }`     | `AdviceResponse` (rules only, no LLM)  |
| C-05 | GET    | `/api/schemes`         | —                 | `Scheme[]`                             |
| C-06 | POST   | `/api/leads`           | `CreateLeadInput` | `Lead` (201)                           |
| C-07 | GET    | `/api/leads`           | —                 | `Lead[]`, newest first                 |

```text
FarmProfile     hectares: number · enterprise: suckler|beef|dairy|sheep|tillage|mixed|other
                county?: string · region?: string ("West Cork") · age?: number · gender?: female|male
                marginalHectares?: number (wet, rough or unused land) · nearWatercourse?: boolean
                peatSoil?: boolean|null · designatedSite?: boolean|null (SAC/SPA; null = unknown)
                activeFarmer?: boolean (claims BISS) · plannedInvestment?: shed|solar|slurry|machinery|none
                missing: string[] (things worth asking the farmer)
GrantMatch      schemeId · name · shortName · eligible: yes|likely|check · reasons: string[] (plain English)
                value?: { oneOffEur?, annualEur?, years?, totalEur, basis } · status: open|closed|rolling|unknown
                deadline?: ISO date · nextStep: string · url: official gov.ie page
Scheme          id · name · shortName · summary · criteria: string[] · ratePerHa? · maxHa? · grantRate?
                investmentCeiling? · status · deadline? · url · source · checkedAt
AdviceResponse  profile · matches: GrantMatch[] · summary (≤120 words) · nextSteps: string[] · disclaimers: string[]
                steps: { extract, rules, explain } (raw JSON per stage, shown in the stepper) · mode: live|fixtures
CreateLeadInput profile · schemeIds: string[] · name · phone? · email? · consent: true
Lead            id · createdAt · name · phone? · email? · profile · matches: GrantMatch[] · estimatedTotalEur
```

Fixtures: Declan (the demo), Aoife (29, 60 ha dairy in Tipperary, wants solar panels) and Mary (35 ha of sheep in
Kerry, planning a slatted shed).

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
