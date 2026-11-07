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
- Accept: Mobile and projector check at 125% zoom, focus states, copy pass; slides: problem, Declan, phone-call demo, architecture (code decides, AI talks), transparent sources and honest limits

### D1-09 · Forester lead flow on local preview data (pre-contract)
- Status: Done
- Depends on: —
- Paths: apps/web/src/features/advisor/**, apps/web/src/features/forester/**, apps/web/src/components/**
- Accept: When the results include a forestry scheme, a 'Send to a registered forester' form (name, phone, consent) saves a lead and confirms it; /forester inbox lists leads newest first with place, farm chips, matched schemes with badges, € estimate and contact; validation, loading, empty and error states; preview banner; npm run verify green

### D1-10 · Design overhaul (Organic field)
- Status: Review
- Depends on: —
- Paths: apps/web/**
- Accept: New design system (Lexend + Source Sans 3 bundled, field green / harvest amber / cream tokens, shared UI primitives) applied to header, footer and advisor (hero, landing sections, stepper, results and cards); behaviour otherwise unchanged; 375/768/1280 checked; AA contrast; reduced motion; npm run verify green

### D1-12 · Phone call on the homepage via C-08/C-09
- Status: Done
- Depends on: —
- Paths: apps/web/src/features/advisor/**, apps/web/src/mocks/handlers.ts, apps/web/src/api/client.test.ts, docs/DECISIONS.md, docs/DEMO.md
- Accept: The phone call is the homepage's main action (D-022): a labelled mobile field and a Call button ring via call(endpoints.ringVoiceCall) and show the API's error.message on failure; call(endpoints.getVoiceCall) is polled every 2 s until done or failed (a 404 or repeated network error stops it); a status card shows ringing, checking the schemes with the transcript, the API's failure reason or a lost call, always with Start again; the advice renders with Results on the same screen; the Call button is disabled while a call is in progress; the old text box (typing, mic, example farmers) is one click away and at /?mode=type, unchanged; mocks for C-08/C-09 from the shared voice fixtures, including a refused number, a failed call and an unknown call; npm run verify green
- Notes: live calls need dev2's API routes (PR #17). Until they merge, the API answers "No route for POST /api/voice/ring" and the page shows that under the field. There is no hang-up endpoint, so Start again only stops following the call.

### D1-13 · Remove the forester experience from the website
- Status: Done
- Depends on: —
- Paths: apps/web/src/features/advisor/**, apps/web/src/features/forester/**, apps/web/src/mocks/handlers.ts, apps/web/src/api/client.test.ts, docs/ARCHITECTURE.md, docs/DECISIONS.md, docs/DEMO.md, docs/TASK_BOARD.md
- Accept: No forester CTA, landing pitch, navigation item or inbox route remains in the website; dead web lead code and mocks are removed; farmer-facing copy and demo docs no longer promote the forester flow; API and shared contracts remain unchanged; npm run verify passes

### D1-14 · Animated React Flow advice pipeline
- Status: Done
- Depends on: —
- Paths: apps/web/**, package-lock.json
- Accept: Replace the three-card pipeline stepper with an accessible @xyflow/react graph showing farmer words, Understand AI, farm profile, every scheme dataset checked by the rules engine, Explain AI and the final report; active work pulses and edges illuminate, rule datasets light sequentially, visited nodes stay solid, done opens the existing Results report, raw JSON inspection remains available, mobile fallback is usable, npm run verify passes

## Requests to others

<!-- - REQ dev1→dev3 (open): <what> — needed by <task> -->
- REQ dev1→dev3 (closed): contract v1 — C-03 `POST /api/advice`, C-04 `POST /api/advice/evaluate`, C-05 `GET /api/schemes`, C-06 `POST /api/leads`, C-07 `GET /api/leads`, with fixtures for Declan, Aoife and Mary; proposed shapes in docs/ARCHITECTURE.md § Contract v1 draft — delivered in D3-01
- REQ dev1→dev3 (open): remove the resolved Gemini reconciliation note from `docs/INTEGRATION.md`; the web UI and dev1 product docs now use OpenAI or neutral AI wording — needed before cp-2
- REQ dev1→dev2 (open): extraction (C-03) must accept acres as well as hectares and convert them (1 acre ≈ 0.405 ha), since Irish farmers usually talk in acres; and tolerate speech-recognition slips (Chrome heard "40-hectare" as "40 acre", "three" as "tree", "too" as "two"). When a number or unit is unclear, put it in `missing` rather than guessing — needed by D1-05, D1-06

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
- 16:15 D1-12 → In Progress
- 16:22 D1-12 → Review
- 16:26 D1-12 → In Progress
- 16:42 D1-12 → Review
- 16:52 D1-13 → In Progress
- 16:56 D1-13 → Review
- 17:00 D1-14 → In Progress
- 17:07 D1-14 → Review
- 17:17 D1-12 → Done
- 17:17 D1-13 → Done
- 17:17 D1-14 → Done
