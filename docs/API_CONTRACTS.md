# API contracts

Owner: **dev3**. Source of truth for shapes: `packages/shared/src/contracts/` (Zod). This file documents the
conventions and lists every endpoint. Both must change in the same PR.

## Conventions

| Topic       | Rule                                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base path   | Everything under `/api`. Web calls it same-origin (Vite proxy in dev, one server in demo), so no CORS.                                                           |
| Format      | JSON in and out, `content-type: application/json`. Field names `camelCase`; paths lowercase plural nouns (`/api/bookings/:id`).                                  |
| Success     | HTTP 200 (201 for creates), body `{ "data": <payload> }`. The payload matches the endpoint's `response` schema.                                                  |
| Errors      | Non-2xx, body `{ "error": { "code": ErrorCode, "message": string, "details"?: any } }`. `message` is safe to show users.                                         |
| Validation  | Every body and query is validated with the contract's Zod schema on the server → 400 `VALIDATION_ERROR`, `details: [{ path, message }]`.                         |
| Auth        | When an endpoint has `auth: true`: header `Authorization: Bearer <token>` → 401 `UNAUTHORIZED` if missing or invalid. Until auth is decided, endpoints are open. |
| IDs         | Opaque strings (UUID v4). Never assume numbers.                                                                                                                  |
| Time        | ISO-8601 UTC strings (`2026-11-07T10:00:00.000Z`). Format for display in the web app only.                                                                       |
| Lists       | Plain arrays at first. If paging is needed: `?limit=&cursor=` → `{ items, nextCursor }` (agree first).                                                           |
| Demo safety | Endpoints that call external services return recorded fixtures when the API runs with `DEMO_MODE=fixtures`.                                                      |

## Error codes

| Code               | HTTP | When                                                                          |
| ------------------ | ---- | ----------------------------------------------------------------------------- |
| `VALIDATION_ERROR` | 400  | Body or query fails its schema; malformed JSON                                |
| `UNAUTHORIZED`     | 401  | Missing or invalid token                                                      |
| `FORBIDDEN`        | 403  | Authenticated but not allowed                                                 |
| `NOT_FOUND`        | 404  | Unknown route or resource                                                     |
| `CONFLICT`         | 409  | Duplicate or state conflict                                                   |
| `RATE_LIMITED`     | 429  | Too many requests (ours or upstream)                                          |
| `UPSTREAM_ERROR`   | 502  | An external API (e.g. an LLM) failed                                          |
| `INTERNAL`         | 500  | Bug; also used when a response doesn't match its contract (dev and test runs) |

## Environment variables

| App | Variable        | Default         | Purpose                                                           |
| --- | --------------- | --------------- | ----------------------------------------------------------------- |
| api | `PORT`          | `8787`          | API port (also serves the web build in demo mode)                 |
| api | `DB_FILE`       | `./data/app.db` | SQLite file, relative to `apps/api` (`:memory:` in tests)         |
| api | `DEMO_MODE`     | `off`           | `fixtures` → external calls return recorded responses             |
| web | `VITE_API_MODE` | `live`          | `mock` → use `src/mocks/handlers.ts` (same as `npm run dev:mock`) |

Add new variables to `apps/<app>/.env.example` **and** this table (API: also `src/env.ts`). Secrets: server-side only.

## Endpoints

| ID   | Method | Path          | Auth | Request           | Response `data` | Status  | Notes                            |
| ---- | ------ | ------------- | ---- | ----------------- | --------------- | ------- | -------------------------------- |
| C-00 | GET    | `/api/health` | no   | —                 | `HealthStatus`  | live    | Liveness + DB check              |
| C-01 | GET    | `/api/notes`  | no   | —                 | `Note[]`        | EXAMPLE | Remove after real features exist |
| C-02 | POST   | `/api/notes`  | no   | `CreateNoteInput` | `Note` (201)    | EXAMPLE | Remove after real features exist |
| C-03 | POST | `/api/advice` | no | `AdviceInput` (`{ text }`) | `AdviceResponse` | live | Extract → deterministic rules → explain |
| C-04 | POST | `/api/advice/evaluate` | no | `EvaluateAdviceInput` (`{ profile }`) | `AdviceResponse` | live | Rules only; no LLM calls |
| C-05 | GET | `/api/schemes` | no | — | `Scheme[]` | live | Criteria, sources and verification timestamp |
| C-06 | POST | `/api/leads` | no | `CreateLeadInput` | `Lead` (201) | live | Explicit consent and contact method required |
| C-07 | GET | `/api/leads` | no | — | `Lead[]` | live | Newest first; local demo only |

Statuses: _proposed_ (agreed, not in code) → _live_ (in the registry; mocks may exist) → _implemented_ (API done)
→ _removed_. Use `C-03` onwards for new endpoints.

## Adding an endpoint

1. **Agree it** (humans): method, path, request, response, errors, auth.
2. **dev3:** schemas in `packages/shared/src/contracts/<resource>.ts`, register it in `endpoints.ts` with the next
   `C-NN`, add a fixture, update the table above and the change log. Small PR, merged first, announced.
3. **dev2:** `router.<method>(endpoints.x.path, …)` with `parseBody`/`reply` in `apps/api/src/features/<name>/` plus a test.
4. **dev1:** `mock(endpoints.x)(…)` in `apps/web/src/mocks/handlers.ts`, then `call(endpoints.x, …)` from the UI.
   Works in mock mode before the API exists.

## GrantGuide v1 details (C-03–C-07)

- Registry keys: `advice`, `evaluateAdvice`, `listSchemes`, `createLead`, `listLeads`. These are registered
  contracts; API implementation belongs to dev2. Keep the example notes endpoints until D3-04's prerequisites pass.
- The shapes follow the kickoff draft in `docs/ARCHITECTURE.md`. Public schemas and inferred types are exported
  from `@app/shared`. `AdviceInput.text` is trimmed, nonempty and at most 10,000 characters.
- `FarmProfile.hectares` must be positive; `marginalHectares` is nonnegative and cannot exceed it. Unmentioned
  optional fields stay absent. `peatSoil` and `designatedSite` also accept explicit `null` for unknown facts.
  `missing` is always an array; it must not be replaced by invented profile values.
- `AdviceResponse.summary` is at most 120 whitespace-separated words. `matches` can be empty. Each pipeline
  stage is a required JSON value; C-04 may return `null` for skipped extraction/explanation stages, with a
  deterministic summary. `mode` is `live` or `fixtures`.
- Monetary values are finite, nonnegative euro amounts. `GrantValue.totalEur` comes with a plain-language
  `basis`; the API computes it. `Scheme.grantRate` is a fraction in [0, 1], not a percentage in [0, 100].
  Deadlines are ISO calendar dates; timestamps are UTC ISO datetimes. Scheme URLs must use HTTPS.
- `Scheme.checkedAt` is a UTC timestamp or `null` when criteria/rates have not been verified. Contract fixtures
  use `null`, `status: unknown` and `eligible: check`, and omit payment estimates. Their metadata is not a
  verified scheme catalogue. Dev2 must replace it with sourced, checked rules before presenting real advice.
- C-06 requires `consent: true`, a nonblank name, at least one scheme ID, and a valid email or phone number
  (7–15 digits, optional leading +, spaces/parentheses/dots/hyphens). Missing contact details or consent return
  `VALIDATION_ERROR`. Dev2 must validate scheme IDs against its catalogue and recompute matches and totals from
  the submitted profile; client-supplied totals/matches are not part of the request schema.
- C-07 exposes contact details without auth only for the agreed local demo. Do not use real contact data in
  fixtures. Authentication/access policy must be agreed before any public hosting. `estimatedTotalEur: 0` in
  the demo lead is an empty sum of estimates, not a verified payment figure.
- Shared examples: `farmProfileFixtures` and `adviceFixtures` keyed by `declan`, `aoife`, `mary`;
  `schemeFixtures`, `createLeadFixture`, and `leadFixtures`. Rules/extraction/explanation outputs are explicitly
  labelled fixture data; these examples do not implement any of the API's business logic.

## Change log

| Time  | IDs              | Change                                   | Breaking? | By    |
| ----- | ---------------- | ---------------------------------------- | --------- | ----- |
| setup | C-00, C-01, C-02 | Initial skeleton: health + example notes | —         | setup |
| 2026-11-07 | C-03–C-07 | GrantGuide v1 schemas, registry and three persona fixtures; consent/contact validation, nullable verification timestamp | no (additive) | dev3 |
