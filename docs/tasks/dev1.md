# dev1 · Keith · Claude Code — tasks

Only **dev1** edits this file. Task IDs: `D1-NN`. Statuses: Not Started · In Progress · Blocked · Review · Done.
Update status with `npm run task -- status <ID> "<Status>"`; add a task with `npm run task -- new "<title>"`.

## Tasks

### D1-01 · Run the kickoff and record the decisions

- Status: In Progress
- Depends on: —
- Paths: docs/TASK_BOARD.md, docs/DECISIONS.md, docs/ARCHITECTURE.md, docs/DEMO.md
- Accept: kickoff checklist in TASK_BOARD.md complete; one demo path written in DEMO.md; decisions logged; app name set in apps/web/src/app/config.ts
- Notes: first 30 minutes after the brief — no feature code before contract v1

### D1-02 · First real screen on the demo path (mock mode)

- Status: Not Started
- Depends on: D3-01
- Paths: apps/web/src/features/**
- Accept: renders from mocks (`npm run dev:mock`), handles loading/empty/error, typed via @app/shared, `npm run verify` green
- Notes: switch to live mode once dev2's endpoints are merged

### D1-03 · Remove the example notes UI once a real feature exists

- Status: Not Started
- Depends on: D1-02
- Paths: apps/web/src/features/notes/**, apps/web/src/mocks/handlers.ts
- Accept: notes folder and its mock handlers deleted; app still builds. Order: web (this) → api (D2-03) → contracts (D3-04)

### D1-04 · Advisor page on local preview data (pre-contract)
- Status: Review
- Depends on: —
- Paths: apps/web/src/features/advisor/**, apps/web/src/features/home/**, apps/web/src/app/**, apps/web/src/index.css, apps/web/index.html
- Accept: Landing page is the advisor: hero input, example prompts, Extract → Rules → Explain stepper with each step's JSON, 'what we understood' chips, grant cards (eligibility, €, reasons, status, link), plain-English summary, next steps, disclaimer; runs on clearly bannered local preview data until C-03 exists; loading, empty and error states; mobile-first; npm run verify green

### D1-05 · Voice input (mic button, en-IE)
- Status: In Progress
- Depends on: —
- Paths: apps/web/src/features/advisor/**
- Accept: Mic button next to the input uses the browser's SpeechRecognition (en-IE, interim results fill the box live, auto-submits on a pause); hidden when unsupported; clear error if the mic is blocked; tested on the stage laptop in Chrome

### D1-06 · Editable profile chips and raw-data drawer
- Status: Not Started
- Depends on: D3-01
- Paths: apps/web/src/features/advisor/**, apps/web/src/mocks/handlers.ts
- Accept: Editing a chip re-runs the rules via C-04 (no LLM) and the € figures update; 'Show the raw data' drawer lists the scheme criteria and sources from C-05; mocks for C-04/C-05 built from shared fixtures

### D1-07 · Send to a registered forester + forester inbox
- Status: Not Started
- Depends on: D3-01
- Paths: apps/web/src/features/advisor/**, apps/web/src/features/forester/**, apps/web/src/mocks/handlers.ts
- Accept: Button on the results saves a lead via C-06 with a confirmation; /forester inbox lists leads (newest first) with profile, matched schemes and € estimate; loading, empty and error states

### D1-08 · Polish pass and pitch slides
- Status: Not Started
- Depends on: —
- Paths: apps/web/**, docs/DEMO.md
- Accept: Mobile and projector check at 125% zoom, focus states, copy pass; slides: problem, Declan, demo, architecture (code decides, AI talks), honest limits, business (forester leads)

## Requests to others

<!-- - REQ dev1→dev3 (open): <what> — needed by <task> -->
- REQ dev1→dev3 (open): contract v1 — C-03 `POST /api/advice`, C-04 `POST /api/advice/evaluate`, C-05 `GET /api/schemes`, C-06 `POST /api/leads`, C-07 `GET /api/leads`, with fixtures for Declan, Aoife and Mary; proposed shapes in docs/ARCHITECTURE.md § Contract v1 draft — needed by D1-02, D1-06, D1-07

## Log

<!-- - 10:42 D1-02 → In Progress -->
- 11:48 D1-01 → In Progress
- 11:48 D1-04 → In Progress
- 12:14 D1-04 → Review
- 12:38 D1-05 → In Progress
