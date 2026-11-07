# dev3 · Codex · merge captain — tasks

Only **dev3** edits this file. Task IDs: `D3-NN`. Statuses: Not Started · In Progress · Blocked · Review · Done.
Update status with `npm run task -- status <ID> "<Status>"`; add a task with `npm run task -- new "<title>"`.

## Tasks

### D3-01 · Contract v1 and fixtures from the kickoff

- Status: Done
- Depends on: D1-01
- Paths: packages/shared/**, docs/API_CONTRACTS.md, tests/smoke/smoke.ts
- Accept: every v1 endpoint in the registry with request/response schemas; typed realistic fixtures; endpoint table + change log updated; merged to main and tagged `contract-v1` within the first hour

### D3-02 · Apply the ownership mode chosen at kickoff

- Status: Done
- Depends on: D1-01
- Paths: docs/OWNERSHIP.md
- Accept: map matches the kickoff decision (layer or feature slices); all three approved the PR
- Notes: the enforced map matches the layer-based kickoff choice. Confirmed in merged PR #7: Ilarion authored the changes, Keith approved them, and Toby merged them. No ownership rules changed.

### D3-03 · Checkpoint 1 — walking skeleton on main

- Status: Done
- Depends on: D1-02, D2-01
- Paths: docs/INTEGRATION.md, docs/API_CONTRACTS.md
- Accept: one screen ↔ one endpoint ↔ DB works on main; `npm run verify` and `npm run smoke` green on main; tagged `cp-1`
- Notes: API work merged in PRs #9/#10. Verified main 38acc12 with 222 tests, 7 smoke checks (no skips), all three personas, rules re-evaluation, invalid-input checks, browser lead submission and restart persistence. Recorded AI replies were used with the real API/rules/database; fresh model calls and microphone input remain separate checks. OpenAI environment documentation requested by dev2 is included.

### D3-04 · Remove the example notes contract after web and API dropped it

- Status: Done
- Depends on: D2-03
- Paths: packages/shared/src/contracts/notes.ts, packages/shared/src/fixtures/notes.ts, packages/shared/src/contracts/endpoints.ts, packages/shared/src/index.ts
- Accept: C-01/C-02 removed and marked removed in the API_CONTRACTS.md change log; everything builds
- Notes: web and API consumers removed in PRs #2/#13; shared contracts now retired.

### D3-05 · Register outbound voice JSON contracts
- Status: Review
- Depends on: —
- Paths: packages/shared/**, docs/API_CONTRACTS.md
- Accept: C-08 ring and C-09 call polling schemas, fixtures and tests match dev2 request; documentation updated; verify passes; contract PR merged before API integration

## Requests to others

<!-- - REQ dev3→dev2 (open): <what> — needed by <task> -->
- REQ dev3→dev2 (closed): C-03–C-07 and server-side scheme/total validation merged in PRs #9/#10 and passed integration checks — needed by D3-03.
- REQ dev3→dev1 (closed): shared model and mock integration merged in PR #5 — needed by D1-02, D1-07.
- REQ dev3→dev1 (open): confirm kickoff completion, reconcile D1-02/D1-03/D1-07 statuses with merged PRs, and update TASK_BOARD's contract-v1 milestone/dependency rows — needed by D3-02, D3-03.
- REQ dev3→dev2 (open): remove the notes API and its tests after the merged web removal; mark D2-03 complete only when verified — needed by D3-04.
- REQ dev3→dev1 (open): replace stale Gemini labels in the UI and reconcile product/demo docs with the merged OpenAI backend; verify microphone input on the presentation laptop — needed before the live-AI/voice checkpoint.
- REQ dev3→dev2 (closed): documented OPENAI_API_KEY, OPENAI_MODEL and OPENAI_TIMEOUT_MS in API_CONTRACTS from the existing API env schema — needed by D2-06.

## Log
- 13:11 D3-01 → In Progress
- 13:15 D3-01 → Review
- 13:24 D3-01 → Done
- 13:55 D3-02 → In Progress
- 13:56 D3-02 → Review
- 13:56 D3-03 → Blocked
- 13:56 D3-04 → Blocked
- 14:08 D3-02 → Done
- 14:26 D3-03 → In Progress
- 14:28 D3-03 → Done
- 15:07 D3-04 → Done
- 15:59 D3-05 → In Progress
- 16:00 D3-05 → Review
