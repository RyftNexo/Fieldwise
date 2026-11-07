# dev2 · Claude Code — tasks

Only **dev2** edits this file. Task IDs: `D2-NN`. Statuses: Not Started · In Progress · Blocked · Review · Done.
Update status with `npm run task -- status <ID> "<Status>"`; add a task with `npm run task -- new "<title>"`.

## Tasks

### D2-01 · Implement the contract v1 endpoints

- Status: Not Started
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

## Requests to others

<!-- - REQ dev2→dev3 (open): <what> — needed by <task> -->

## Log
