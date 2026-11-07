---
name: task-start
description: Start work on a task from this repo's task board (IDs like D3-01). Use before writing any code for a task — runs the ownership, dependency and duplicate preflight, then plans the work.
---

Start the task ID the user gave you (procedure: `docs/TEAM_POLICY.md` § Task protocol).

1. Run `npm run task:start -- <ID>`. If it prints any ✗ (not your task, not on the board, path not yours, wrong
   branch), stop and tell the user — don't work around it. Take ! warnings seriously
   (behind `main` → run the sync skill first; unmet dependency → build against mocks or coordinate).
2. Read the contracts it references (`packages/shared/src/contracts/`) and the area conventions in
   `.claude/rules/<web|api|shared>.md` (plain markdown).
3. Confirm the feature doesn't already exist: `rg` across the code and all task files in `docs/tasks/`.
4. Write a short plan: files to change (all inside your paths — check with `npm run guard -- path <file>`), contracts
   used, mocks needed, tests, and how you'll verify. For anything nontrivial, wait for the user's approval.
5. Mark it started: `npm run task -- status <ID> "In Progress"`.
