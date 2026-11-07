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

### D2-06 · Gemini extract and explain behind C-03, with recorded fixtures
- Status: Not Started
- Depends on: —
- Paths: apps/api/src/features/advice/**, apps/api/src/services/**
- Accept: C-03 extracts a FarmProfile via Gemini, runs rules, explains in at most 120 words; DEMO_MODE=fixtures replays recordings for Declan, Aoife and Mary; timeout and UPSTREAM_ERROR handled; key stays server-side

## Requests to others

<!-- - REQ dev2→dev3 (open): <what> — needed by <task> -->

## Log
- 13:23 D2-01 → In Progress
- 13:27 D2-04 → In Progress
- 13:28 D2-04 → Review
- 13:29 D2-05 → In Progress
- 13:32 D2-05 → Review
