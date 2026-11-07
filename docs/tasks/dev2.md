# dev2 · Claude Code — tasks

Only **dev2** edits this file. Task IDs: `D2-NN`. Statuses: Not Started · In Progress · Blocked · Review · Done.
Update status with `npm run task -- status <ID> "<Status>"`; add a task with `npm run task -- new "<title>"`.

## Tasks

### D2-01 · Implement the contract v1 endpoints

- Status: In Progress
- Depends on: D3-01
- Paths: apps/api/src/features/**
- Accept: every v1 endpoint validates input with its contract schema, replies via `reply()`, has a test that parses the response; `npm run verify` green
- Notes: start with stubs returning fixtures so dev1 can switch to live mode early

### D2-02 · Data model and demo seed data for the demo path

- Status: Not Started
- Depends on: D2-01
- Paths: apps/api/src/features/*/schema.ts, apps/api/src/features/*/seed.ts
- Accept: `npm run db:reset` creates and seeds everything; seed data tells the demo story (realistic names/numbers)

### D2-03 · Remove the example notes API once real features exist

- Status: Not Started
- Depends on: D1-03
- Paths: apps/api/src/features/notes/**
- Accept: folder deleted after dev1 removed the UI; API tests and smoke test still pass

### D2-04 · Verified scheme facts for NTAS, ANC, BISS, ACRES
- Status: Review
- Depends on: —
- Paths: apps/api/src/features/schemes/**
- Accept: each scheme has rates, caps, deadline, official gov.ie url and source verified from gov.ie, checkedAt set; anything unverified stays null and says so

### D2-05 · Rules engine: one pure function per scheme, plus C-04 wired to it
- Status: Review
- Depends on: —
- Paths: apps/api/src/features/advice/**
- Accept: NTAS, ANC, BISS, ACRES checked against a FarmProfile with euro maths and plain-English reasons; table tests per scheme; C-04 returns computed matches; unverifiable conditions return likely/check

### D2-06 · LLM (OpenAI) extract and explain behind C-03, with recorded fixtures
- Status: Review
- Depends on: —
- Paths: apps/api/src/features/advice/**, apps/api/src/services/**
- Accept: C-03 extracts a FarmProfile via OpenAI, runs rules, explains in at most 120 words; DEMO_MODE=fixtures replays recordings for Declan, Aoife and Mary; timeout and UPSTREAM_ERROR handled; key stays server-side

### D2-07 · Inbound Twilio voice line for the advice pipeline
- Status: Not Started
- Depends on: D2-06
- Paths: apps/api/**
- Accept: A signed Twilio call to POST /api/voice/incoming returns Gather TwiML; POST /api/voice/advice speaks the advice summary; unsigned requests are rejected; the auth token stays in .env

## Requests to others

<!-- - REQ dev2→dev3 (open): <what> — needed by <task> -->

- REQ dev2→dev3 (open): add `OPENAI_API_KEY` (secret, optional), `OPENAI_MODEL` (default `gpt-4.1-mini`) and `OPENAI_TIMEOUT_MS` (default `20000`) to the env table in `docs/API_CONTRACTS.md` — needed by D2-06 (already in `apps/api/src/env.ts` and `.env.example`; replaces the earlier GEMINI_* request, which is withdrawn)
- REQ dev2→dev1 (open): we now use OpenAI instead of Gemini (Gemini's free tier allows only 20 requests a day per model, too few to rehearse). Please (1) add a decision after D-019 that replaces D-012 and fixes the Gemini wording in D-010: "LLM: OpenAI chat completions called with plain `fetch` (no SDK), key `OPENAI_API_KEY` in `apps/api/.env` only, default model `gpt-4.1-mini`; `DEMO_MODE=fixtures` still replays recorded replies"; (2) change "Gemini" to OpenAI, or better a neutral "AI", in `docs/ARCHITECTURE.md`, `docs/DEMO.md`, `docs/TASK_BOARD.md`, and the web copy in `apps/web/src/features/advisor/Results.tsx` ("Written by Gemini…"), `PipelineStepper.tsx` (two lines) and the `'gemini (preview)'` labels in `preview.ts`; (3) tell whoever runs the demo laptop to put `OPENAI_API_KEY` in that laptop's `apps/api/.env` — needed by D1 copy and the demo checklist

## Log
- 13:23 D2-01 → In Progress
- 13:27 D2-04 → In Progress
- 13:28 D2-04 → Review
- 13:29 D2-05 → In Progress
- 13:32 D2-05 → Review
- 13:33 D2-06 → In Progress
- 13:54 D2-06 → Review
- 14:10 D2-06: switched the LLM from Gemini to OpenAI (gpt-4.1-mini); fixtures re-recorded; requests sent to dev1 and dev3
