# Task board

Owner: **dev1**. Tasks themselves live in each developer's file (`docs/tasks/dev1.md`, `dev2.md`, `dev3.md`), so
three people never edit the same lines. Print everything with `npm run board`. This page holds the shared picture.

## Kickoff checklist (first 30–60 minutes, humans, no code)

- [x] Read the brief; judging criteria: scattered, complex data → something actionable · non-technical users ·
      plain-language interface · no static dashboards · honest about the prototype's limits · presentation quality
- [x] Pick the idea: **Fieldwise**, a plain-language farm grant advisor (D-009)
- [x] Write the **one demo path** in DEMO.md
- [x] Decide the division: layer-based (default, OWNERSHIP.md unchanged)
- [x] Decide the stack profile: A, TypeScript (D-011)
- [x] Data: local SQLite · Auth: none
- [x] External APIs or LLMs: OpenAI; `OPENAI_API_KEY` lives in `apps/api/.env` on Keith's laptop; fixture fallback
      (D-020)
- [x] Demo: local laptop (D-017)
- [x] Contract v1: draft in ARCHITECTURE.md § Contract v1 draft → dev3 writes it (D3-01)
- [x] Each developer adds their first tasks to their own task file (dev1 ✓ · dev2 ✓ · dev3 ✓)
- [x] Set checkpoint, feature-freeze and code-freeze times below; app name set to Fieldwise
- [x] Record the decisions in DECISIONS.md

## Milestones

Start 11:25 · hard deadline 19:00.

| Milestone                                                            | Time  | Status |
| -------------------------------------------------------------------- | ----- | ------ |
| Kickoff done                                                         | 12:00 | ☑      |
| Contract v1 merged (`contract-v1`)                                   | 12:20 | ☑      |
| Checkpoint 1: hard-coded profile end to end on main (`cp-1`)         | 13:30 | ☑      |
| Checkpoint 2: full path with real OpenAI and voice (`cp-2`)          | 15:30 | ☐      |
| Feature freeze, tag `demo-v1`                                        | 16:30 | ☐      |
| Backup video recorded (fixtures mode), slides done                   | 17:15 | ☐      |
| Video on YouTube, link sent to the dev post                          | 18:00 | ☐      |
| Rehearsals ×3 done; room confirmed (Dora Allman, 4th floor, the Hub) | 19:00 | ☐      |

## Backlog (agreed but unassigned)

To take one, the owner of its paths adds it to their own task file and it's removed here.

- dev3: fresh-clone `npm run demo` rehearsal ×2 and the backup video

## Cut list (dropped first if time runs short)

1. Hosted URL
2. Third persona
3. TAMS schemes
4. Chip editing
5. Raw-data drawer

**Never cut:** extract → rules → explain, the € calculation, the fixture fallback, the stepper.

## Cross-team dependencies

| Needed by | From  | What                                          | Status |
| --------- | ----- | --------------------------------------------- | ------ |
| D1-02     | D3-01 | Contract v1 merged (C-03 + fixtures)          | done   |
| D1-06     | D3-01 | C-04 and C-05 in the registry, with fixtures  | done   |
| D1-07     | D3-01 | C-06 and C-07 in the registry, with fixtures  | done   |
| D2-01     | D3-01 | Contract v1 merged                            | done   |
