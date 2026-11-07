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

- Status: Not Started
- Depends on: D1-01
- Paths: docs/OWNERSHIP.md
- Accept: map matches the kickoff decision (layer or feature slices); all three approved the PR

### D3-03 · Checkpoint 1 — walking skeleton on main

- Status: Not Started
- Depends on: D1-02, D2-01
- Paths: docs/INTEGRATION.md
- Accept: one screen ↔ one endpoint ↔ DB works on main; `npm run verify` and `npm run smoke` green on main; tagged `cp-1`

### D3-04 · Remove the example notes contract after web and API dropped it

- Status: Not Started
- Depends on: D2-03
- Paths: packages/shared/src/contracts/notes.ts, packages/shared/src/fixtures/notes.ts, packages/shared/src/contracts/endpoints.ts, packages/shared/src/index.ts
- Accept: C-01/C-02 removed and marked removed in the API_CONTRACTS.md change log; everything builds

## Requests to others

<!-- - REQ dev3→dev2 (open): <what> — needed by <task> -->
- REQ dev3→dev2 (open): implement C-03–C-07 after D3-01 merges; validate scheme IDs and recompute lead totals server-side. Fixtures deliberately contain no verified eligibility or payment amounts — needed by D3-03.
- REQ dev3→dev1 (open): switch preview models/mocks to the D3-01 shared schemas and fixtures after merge; confirm kickoff D1-01 completion. C-06 requires contact details and consent; Scheme.checkedAt is nullable until verified — needed by D1-02, D1-06, D1-07.

## Log
- 13:11 D3-01 → In Progress
- 13:15 D3-01 → Review
- 13:24 D3-01 → Done
