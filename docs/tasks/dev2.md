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

- Status: Done
- Depends on: D1-03
- Paths: apps/api/src/features/notes/**
- Accept: folder deleted after dev1 removed the UI; API tests and smoke test still pass
- Notes: removed in PR #13. D3-04 then retired the notes contracts. Nothing under `apps/api` still serves notes.

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
  - `POST /api/voice/incoming` asks the caller to describe the farm. Gather uses `language="en-GB"` and `speechTimeout="3"` on the default recogniser. `speechTimeout="auto"` is Twilio error 13335 on that model, and a trial account rejects Polly voices, so Say is a plain en-GB voice. `actionOnEmptyResult="true"` sends silence to the retry. Action and redirect URLs are absolute when `TWILIO_PUBLIC_BASE` is set.
  - `POST /api/voice/advice` runs the same pipeline as C-03. A finished result is spoken immediately. A slow model gets `<Pause>` and a redirect to `POST /api/voice/result`, so the webhook itself stays inside Twilio's 15 second limit. The caller hears the summary, one next step and the Department disclaimer, then the call hangs up. The fetch is cancelled if the wait budget runs out.
  - `POST /api/voice/ring` with `{ to }` asks Twilio to dial that mobile from `TWILIO_FROM_NUMBER`, but only when `to` is on `TWILIO_RING_TO`. Repeats inside 15 seconds, or more than 3 in a minute, never reach Twilio. When they answer, Twilio loads `/api/voice/incoming`.
  - C-08 and C-09 are in the shared contract and the API validates them with `parseBody`/`reply`. The homepage rings through that client (D1-12, PR #19). The temporary `GET /api/voice/call` page is removed. The Ring button in `apps/web/src/features/forester/LeadCard.tsx` is still a `tel:` link, which dev1 owns.
  - A bad `X-Twilio-Signature` is rejected. The live ngrok tunnel delivers Twilio's webhook with that header missing, and Twilio then says it cannot reach the TwiML server if the API returns 403. A missing signature is accepted only when `x-forwarded-host` matches `TWILIO_PUBLIC_BASE`. Names only, never values: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `TWILIO_RING_TO`, and `TWILIO_PUBLIC_BASE`. They live in `apps/api/.env`.
  - Still to do before this task is Done: place one real allowlisted call that shows advice on the homepage. The tunnel and number are already in use.
  - `DEMO_MODE=fixtures` only knows Declan, Aoife and Mary. Live mode uses the OpenAI key already on the API.

## Requests to others

<!-- - REQ dev2→dev3 (open): <what> — needed by <task> -->

- REQ dev2→dev3 (closed): `OPENAI_API_KEY`, `OPENAI_MODEL` and `OPENAI_TIMEOUT_MS` are in the env table in `docs/API_CONTRACTS.md` (D3-03, PR #12) — needed by D2-06
- REQ dev2→dev3 (closed): Twilio env vars, including `TWILIO_RING_TO`, are in the env table in `docs/API_CONTRACTS.md` — needed by D2-07
- REQ dev2→dev1 (open): the Ring button in `apps/web/src/features/forester/LeadCard.tsx` is a `tel:` link and the ownership guard blocks dev2 from editing it. Please POST `{ to: lead.phone }` to `/api/voice/ring` and show `error.message`. The homepage call card is the working screen — needed by D2-07
- REQ dev2→dev1 (closed): the homepage (`apps/web/src/features/advisor/AdvisorPage.tsx`) rings through C-08/C-09 and shows the results (D1-12, PR #19) — needed by D2-07
- REQ dev2→dev3 (closed): C-08 and C-09 are registered (D3-05) and the API now uses `parseBody`/`reply` for them — needed by D2-07
- REQ dev2→dev3 (closed): C-08 and C-09 are marked implemented in `docs/API_CONTRACTS.md` (PR #20) — needed by D2-07
- REQ dev2→dev3 (open): `GET /api/voice/call` is removed. The unsigned-host bypass stays: this ngrok tunnel delivers Twilio with no `X-Twilio-Signature`, and rejecting it makes Twilio say it cannot reach the TwiML server. Please say that in `docs/INTEGRATION.md` and `docs/API_CONTRACTS.md` — needed by D2-07
- REQ dev2→dev1 (closed): we now use OpenAI instead of Gemini (Gemini's free tier allows only 20 requests a day per model, too few to rehearse). Please (1) add a decision after D-019 that replaces D-012 and fixes the Gemini wording in D-010: "LLM: OpenAI chat completions called with plain `fetch` (no SDK), key `OPENAI_API_KEY` in `apps/api/.env` only, default model `gpt-4.1-mini`; `DEMO_MODE=fixtures` still replays recorded replies"; (2) change "Gemini" to OpenAI, or better a neutral "AI", in `docs/ARCHITECTURE.md`, `docs/DEMO.md`, `docs/TASK_BOARD.md`, and the web copy in `apps/web/src/features/advisor/Results.tsx` ("Written by Gemini…"), `PipelineStepper.tsx` (two lines) and the `'gemini (preview)'` labels in `preview.ts`; (3) tell whoever runs the demo laptop to put `OPENAI_API_KEY` in that laptop's `apps/api/.env` — needed by D1 copy and the demo checklist
- REQ dev2→dev1 (open): replace the three-card `PipelineStepper` on the advisor page with a React Flow graph (`@xyflow/react`) that lights up while advice is generated. Nodes, left to right: the farmer's words → Understand (AI) → a Farm profile card → one box per scheme dataset the rules engine actually checks (NTAS, ANC, BISS, ACRES, plus the investment schemes already in the rules) → Explain (AI) → the executive report (the existing `Results` summary). While `useAdvisor` walks `extract` → `rules` → `explain`, pulse the active node and draw the edge into it; during `rules`, light the scheme boxes one after another. On `done`, every visited node stays solid and the report node opens into the existing results. Keep the raw JSON "see the data" behaviour. New dependency `@xyflow/react` in `apps/web` only. The guard blocks dev2 from `apps/web` — needed so the demo shows the agent calling the datasets as it writes the report.

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
- 14:50 D2-07: PR #13 review — Gather uses the documented en-GB/phone_call/speechTimeout 3 settings and actionOnEmptyResult; slow advice polls under the 15s webhook limit; env names requested from dev3
- 14:09 D2-02 → In Progress
- 14:10 D2-02 → Review
- 14:40 D2-01 → Done
- 14:40 D2-02 → Done
- 14:40 D2-04 → Done
- 14:40 D2-05 → Done
- 14:40 D2-06 → Done
- 14:40 D2-03 → In Progress
- 14:40 D2-01, D2-02, D2-04, D2-05 and D2-06 → Done because PRs #9 and #10 are on main. D2-03 verified locally (notes API removed, smoke passes with C-01 still pending for D3-04); not merged yet, so it stays In Progress.
- 16:05 Asked dev1 for a React Flow pipeline on the advisor page (scheme dataset boxes lighting up while the report is written). Not started here: `apps/web` is dev1's.
- 16:10 D2-07: C-08 and C-09 now go through parseBody and reply. The notes-contract and design work from main is merged in.
- 16:55 D2-07: removed `GET /api/voice/call`. A missing `X-Twilio-Signature` is now 403 even when `x-forwarded-host` matches `TWILIO_PUBLIC_BASE`. A real allowlisted call is still unverified, so this stays In Progress.
- 17:02 D2-07: the live ngrok webhook arrived with no signature and Twilio reported it could not reach the TwiML server. A missing signature is accepted again only for the configured public host. A wrong signature is still rejected.
- 17:14 D2-07: a missing farm size no longer fails the call. If the spoken advice asks a question, the line listens for the answer and runs again, up to two follow-ups.
- 17:16 D2-07: every call asks one fixed follow-up, "Anything else about the land, the animals, or where you farm?", then checks the schemes and hangs up.
- 16:55 D2-03 → Done
