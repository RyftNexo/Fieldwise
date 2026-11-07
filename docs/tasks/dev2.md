# dev2 · Claude Code — tasks

Only **dev2** edits this file. Task IDs: `D2-NN`. Statuses: Not Started · In Progress · Blocked · Review · Done.
Update status with `npm run task -- status <ID> "<Status>"`; add a task with `npm run task -- new "<title>"`.

## Tasks

### D2-01 · Implement the contract v1 endpoints

- Status: Done
- Depends on: D3-01
- Paths: apps/api/src/features/**
- Accept: every v1 endpoint validates input with its contract schema, replies via `reply()`, has a test that parses the response; `npm run verify` green
- Notes: start with stubs returning fixtures so dev1 can switch to live mode early

### D2-02 · Data model and demo seed data for the demo path

- Status: Done
- Depends on: D2-01
- Paths: apps/api/src/features/*/schema.ts, apps/api/src/features/*/seed.ts
- Accept: `npm run db:reset` creates and seeds everything; seed data tells the demo story (realistic names/numbers)

### D2-03 · Remove the example notes API once real features exist

- Status: In Progress
- Depends on: D1-03
- Paths: apps/api/src/features/notes/**
- Accept: folder deleted after dev1 removed the UI; API tests and smoke test still pass

### D2-04 · Verified scheme facts for NTAS, ANC, BISS, ACRES
- Status: Done
- Depends on: —
- Paths: apps/api/src/features/schemes/**
- Accept: each scheme has rates, caps, deadline, official gov.ie url and source verified from gov.ie, checkedAt set; anything unverified stays null and says so

### D2-05 · Rules engine: one pure function per scheme, plus C-04 wired to it
- Status: Done
- Depends on: —
- Paths: apps/api/src/features/advice/**
- Accept: NTAS, ANC, BISS, ACRES checked against a FarmProfile with euro maths and plain-English reasons; table tests per scheme; C-04 returns computed matches; unverifiable conditions return likely/check

### D2-06 · LLM (OpenAI) extract and explain behind C-03, with recorded fixtures
- Status: Done
- Depends on: —
- Paths: apps/api/src/features/advice/**, apps/api/src/services/**
- Accept: C-03 extracts a FarmProfile via OpenAI, runs rules, explains in at most 120 words; DEMO_MODE=fixtures replays recordings for Declan, Aoife and Mary; timeout and UPSTREAM_ERROR handled; key stays server-side

### D2-07 · Inbound Twilio voice line for the advice pipeline
- Status: In Progress
- Depends on: D2-06
- Paths: apps/api/**
- Accept: A signed Twilio call to POST /api/voice/incoming returns Gather TwiML; POST /api/voice/advice speaks the advice summary; unsigned requests are rejected; the auth token stays in .env
- Notes: Plan for the other devs. One inbound Twilio number, one spoken turn. Twilio is only the phone, the speech-to-text and the Irish voice (Polly Niamh, en-IE). A voice model does not decide grants.
  - `POST /api/voice/incoming` asks the caller to describe the farm. `POST /api/voice/advice` runs the same pipeline as C-03, speaks the summary, one next step and the Department disclaimer, then hangs up.
  - These routes return TwiML, not the shared JSON contract. Nothing in `packages/shared` changes, and dev1 does not need a web change for this slice.
  - Unsigned requests are rejected (`X-Twilio-Signature`). Names only, never values: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PUBLIC_BASE` once a tunnel exists. They live in `apps/api/.env`.
  - Still to do before anyone can dial in: buy a Voice number (UK or US; an Irish number needs address checks), tunnel localhost:8787, set `TWILIO_PUBLIC_BASE` to that https origin with no path, point the number's webhook at `https://<tunnel>/api/voice/incoming` (HTTP POST), restart the API.
  - `DEMO_MODE=fixtures` only knows Declan, Aoife and Mary. Live mode uses the OpenAI key already on the API.

## Requests to others

<!-- - REQ dev2→dev3 (open): <what> — needed by <task> -->

- REQ dev2→dev3 (closed): `OPENAI_API_KEY`, `OPENAI_MODEL` and `OPENAI_TIMEOUT_MS` are in the env table in `docs/API_CONTRACTS.md` (D3-03, PR #12) — needed by D2-06
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
- 14:05 D2-07 → In Progress
- 14:29 D2-07: plan shared for the other devs (one Twilio turn, then the advice pipeline; a number and a tunnel are still required)
- 14:09 D2-02 → In Progress
- 14:10 D2-02 → Review
- 14:40 D2-01 → Done
- 14:40 D2-02 → Done
- 14:40 D2-04 → Done
- 14:40 D2-05 → Done
- 14:40 D2-06 → Done
- 14:40 D2-03 → In Progress
- 14:40 D2-01, D2-02, D2-04, D2-05 and D2-06 → Done because PRs #9 and #10 are on main. D2-03 verified locally (notes API removed, smoke passes with C-01 still pending for D3-04); not merged yet, so it stays In Progress.
