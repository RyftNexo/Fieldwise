# dev1 · Keith · Claude Code — tasks

Only **dev1** edits this file. Task IDs: `D1-NN`. Statuses: Not Started · In Progress · Blocked · Review · Done.
Update status with `npm run task -- status <ID> "<Status>"`; add a task with `npm run task -- new "<title>"`.

## Tasks

### D1-01 · Run the kickoff and record the decisions

- Status: Done
- Depends on: —
- Paths: docs/TASK_BOARD.md, docs/DECISIONS.md, docs/ARCHITECTURE.md, docs/DEMO.md
- Accept: kickoff checklist in TASK_BOARD.md complete; one demo path written in DEMO.md; decisions logged; app name set in apps/web/src/app/config.ts
- Notes: first 30 minutes after the brief — no feature code before contract v1

### D1-02 · First real screen on the demo path (mock mode)

- Status: Done
- Depends on: D3-01
- Paths: apps/web/src/features/**
- Accept: renders from mocks (`npm run dev:mock`), handles loading/empty/error, typed via @app/shared, `npm run verify` green
- Notes: switch to live mode once dev2's endpoints are merged

### D1-03 · Remove the example notes UI once a real feature exists

- Status: Done
- Depends on: D1-04
- Paths: apps/web/src/features/notes/**, apps/web/src/mocks/handlers.ts
- Accept: notes folder and its mock handlers deleted; app still builds. Order: web (this) → api (D2-03) → contracts (D3-04)

### D1-04 · Advisor page on local preview data (pre-contract)
- Status: Done
- Depends on: —
- Paths: apps/web/src/features/advisor/**, apps/web/src/features/home/**, apps/web/src/app/**, apps/web/src/index.css, apps/web/index.html
- Accept: Landing page is the advisor: hero input, example prompts, Extract → Rules → Explain stepper with each step's JSON, 'what we understood' chips, grant cards (eligibility, €, reasons, status, link), plain-English summary, next steps, disclaimer; runs on clearly bannered local preview data until C-03 exists; loading, empty and error states; mobile-first; npm run verify green

### D1-05 · Voice input (mic button, en-IE)
- Status: Done
- Depends on: —
- Paths: apps/web/src/features/advisor/**
- Accept: Mic button next to the input uses the browser's SpeechRecognition (en-IE, interim results fill the box live, auto-submits on a pause); hidden when unsupported; clear error if the mic is blocked; tested on the stage laptop in Chrome
- Notes: microphone input confirmed on the demo laptop in Chrome

### D1-06 · Editable profile chips and raw-data drawer
- Status: Done
- Depends on: D3-01
- Paths: apps/web/src/features/advisor/**, apps/web/src/mocks/handlers.ts
- Accept: Editing a chip re-runs the rules via C-04 (no LLM) and the € figures update; 'Show the raw data' drawer lists the scheme criteria and sources from C-05; mocks for C-04/C-05 built from shared fixtures

### D1-07 · Send to a registered forester + forester inbox
- Status: Done
- Depends on: D3-01
- Paths: apps/web/src/features/advisor/**, apps/web/src/features/forester/**, apps/web/src/mocks/handlers.ts
- Accept: Button on the results saves a lead via C-06 with a confirmation; /forester inbox lists leads (newest first) with profile, matched schemes and € estimate; loading, empty and error states

### D1-08 · Polish pass and pitch slides
- Status: Not Started
- Depends on: —
- Paths: apps/web/**, docs/DEMO.md
- Accept: Mobile and projector check at 125% zoom, focus states, copy pass; slides: problem, Declan, demo, architecture (code decides, AI talks), honest limits, business (forester leads)

### D1-09 · Forester lead flow on local preview data (pre-contract)
- Status: Done
- Depends on: —
- Paths: apps/web/src/features/advisor/**, apps/web/src/features/forester/**, apps/web/src/components/**
- Accept: When the results include a forestry scheme, a 'Send to a registered forester' form (name, phone, consent) saves a lead and confirms it; /forester inbox lists leads newest first with place, farm chips, matched schemes with badges, € estimate and contact; validation, loading, empty and error states; preview banner; npm run verify green

### D1-10 · Design overhaul (Organic field)
- Status: Done
- Depends on: —
- Paths: apps/web/**
- Accept: New design system (Lexend + Source Sans 3 bundled, field green / harvest amber / cream tokens, shared UI primitives) applied to header, footer, advisor (hero, landing sections, stepper, results, cards, forester form) and forester inbox; behaviour unchanged; 375/768/1280 checked; AA contrast; reduced motion; npm run verify green

### D1-11 · Payment estimates from a linear regression on CAP Beneficiaries 2024
- Status: In Progress
- Depends on: D3-05, D3-06
- Paths: apps/api/ml/**, apps/api/src/features/estimates/**, apps/api/src/features/advice/**, apps/web/src/features/advisor/**, docs/DECISIONS.md, docs/DEMO.md
- Accept: Trainer (stdlib Python) fits OLS on log(payment) with county effects per scheme (BISS I.1, ANC V.2, ACRES V.1) with an 80/20 split and reports R²; model JSON committed, raw data never; API attaches a PaymentEstimate to matches without a value on C-03, C-04 and fixtures replay; cards show 'Typical payment in Co. X (estimate)' with the 10th–90th percentile range, R² and source; estimates never count toward the headline; npm run verify green

## Requests to others

<!-- - REQ dev1→dev3 (open): <what> — needed by <task> -->
- REQ dev1→dev3 (closed): contract v1 — C-03 `POST /api/advice`, C-04 `POST /api/advice/evaluate`, C-05 `GET /api/schemes`, C-06 `POST /api/leads`, C-07 `GET /api/leads`, with fixtures for Declan, Aoife and Mary; proposed shapes in docs/ARCHITECTURE.md § Contract v1 draft — delivered in D3-01
- REQ dev1→dev3 (closed): remove the resolved Gemini reconciliation note from `docs/INTEGRATION.md` (done in PR #15) — needed before cp-2
- REQ dev1→dev2 (closed): extraction (C-03) accepts acres and converts them (1 acre ≈ 0.405 ha) and lists unclear facts in `missing` (in `extract.ts`) — needed by D1-05, D1-06
- REQ dev1→dev2 (open): agree to hand the LLM pipeline to dev1 (Keith): `apps/api/src/features/advice/**` and `apps/api/src/services/**`, plus the new `apps/api/src/features/estimates/**` and `apps/api/ml/**`. Toby keeps the rest of the API, including the Twilio voice routes that call the pipeline — needed by D1-11
- REQ dev1→dev3 (open): D3-05 — ownership PR adding, after `apps/api/** dev2`: `apps/api/src/features/advice/** dev1`, `apps/api/src/features/estimates/** dev1`, `apps/api/src/services/** dev1`, `apps/api/ml/** dev1` (all three approve) — needed by D1-11
- REQ dev1→dev3 (open): D3-06 — additive contract change: `PaymentEstimate` { typicalEur, lowEur, highEur (per year), area, basis, model, r2, sampleSize, source } and optional `GrantMatch.estimate` (only when `value` is absent), one fixture with an estimate, API_CONTRACTS.md change log — needed by D1-11

## Log

<!-- - 10:42 D1-02 → In Progress -->
- 11:48 D1-01 → In Progress
- 11:48 D1-04 → In Progress
- 12:14 D1-04 → Review
- 12:38 D1-05 → In Progress
- 12:51 D1-09 → In Progress
- 12:56 D1-09 → Review
- 12:58 D1-04 → Done
- 12:58 D1-09 → Done
- 13:08 D1-03 → In Progress
- 13:10 D1-03 → Review
- 13:22 D1-05 → Review
- 13:24 D1-03 → Done
- 13:25 D1-02 → In Progress
- 13:25 D1-07 → In Progress
- 13:27 D1-02 → Review
- 13:27 D1-07 → Review
- 13:53 D1-10 → In Progress
- 14:11 D1-02 → Done
- 14:11 D1-05 → Done
- 14:11 D1-07 → Done
- 14:35 D1-06 → In Progress
- 14:35 D1-05 microphone input confirmed on the demo laptop in Chrome
- 14:44 D1-06 → Review
- 14:44 D1-01 → Review
- 15:08 D1-10 → Review
- 15:08 D1-06 → Done
- 15:09 D1-01 → Done
- 15:43 D1-11 → In Progress
- 15:43 D1-10 → Done
