# Task board

Owner: **dev1**. Tasks themselves live in each developer's file (`docs/tasks/dev1.md`, `dev2.md`, `dev3.md`), so
three people never edit the same lines. Print everything with `npm run board`. This page holds the shared picture.

## Kickoff checklist (first 30–60 minutes, humans, no code)

- [ ] Read the brief together; list the judging criteria
- [ ] Pick the idea (optional: pressure-test it with the `llm-council` skill in Claude/Cowork, ~10 min)
- [ ] Write the **one demo path** (3–6 steps) in DEMO.md — everything else is optional
- [ ] Decide the division: layer-based (default) or feature slices → dev3 updates OWNERSHIP.md if it changes
- [ ] Decide the stack profile: A (TypeScript, default) or B (Python API)
- [ ] Data: local SQLite (default) or hosted · Auth: none / demo user / real
- [ ] External APIs or LLMs: which, who holds the keys, fixture fallback
- [ ] Demo: local laptop (default) or hosted URL
- [ ] Contract v1: endpoints and data shapes for the demo path → dev3 writes them (D3-01)
- [ ] Each developer adds their first tasks to their own task file
- [ ] Set checkpoint, feature-freeze and code-freeze times below; set the app name in `apps/web/src/app/config.ts`
- [ ] Record the decisions in DECISIONS.md

## Milestones

| Milestone                                       | Time             | Status |
| ----------------------------------------------- | ---------------- | ------ |
| Kickoff done                                    | _(start + 0:30)_ | ☐      |
| Contract v1 merged (`contract-v1`)              | _(start + 1:00)_ | ☐      |
| Checkpoint 1: walking skeleton on main (`cp-1`) | _(start + 2:30)_ | ☐      |
| Checkpoint 2 (`cp-2`)                           |                  | ☐      |
| Checkpoint 3 (`cp-3`)                           |                  | ☐      |
| Feature freeze                                  | _(~70% of time)_ | ☐      |
| Code freeze + `demo-v1` + backup video          | _(end − 1:30)_   | ☐      |
| Rehearsals done, slides final                   | _(end − 1:00)_   | ☐      |

## Backlog (agreed but unassigned)

To take one, the owner of its paths adds it to their own task file and it's removed here.

- _(empty)_

## Cut list (dropped first if time runs short)

- _(stretch goals go here, lowest value first)_

## Cross-team dependencies

| Needed by | From  | What               | Status |
| --------- | ----- | ------------------ | ------ |
| D1-02     | D3-01 | Contract v1 merged | open   |
| D2-01     | D3-01 | Contract v1 merged | open   |
