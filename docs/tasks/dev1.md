# dev1 · Keith · Claude Code — tasks

Only **dev1** edits this file. Task IDs: `D1-NN`. Statuses: Not Started · In Progress · Blocked · Review · Done.
Update status with `npm run task -- status <ID> "<Status>"`; add a task with `npm run task -- new "<title>"`.

## Tasks

### D1-01 · Run the kickoff and record the decisions

- Status: Not Started
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

## Requests to others

<!-- - REQ dev1→dev3 (open): <what> — needed by <task> -->

## Log

<!-- - 10:42 D1-02 → In Progress -->
