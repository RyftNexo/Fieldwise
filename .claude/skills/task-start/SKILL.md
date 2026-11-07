---
name: task-start
description: Start work on a task from this repo's task board (IDs like D1-03). Use before writing any code for a task — runs the ownership, dependency and duplicate preflight, then plans the work.
argument-hint: <task-id>
---

Final-stage policy: AGENTS.md overrides older exclusive-owner wording below. All project paths are shared. Keep your own task IDs/branch; check and coordinate overlaps before editing. Cross-area fixes and conflict resolution are allowed after understanding affected work, with relevant tests and review; never discard others’ edits or bypass guards.


Start task **$ARGUMENTS** (procedure: `docs/TEAM_POLICY.md` § Task protocol).

1. Run `npm run task:start -- $ARGUMENTS`. If it prints any ✗ (not your task, not on the board, path not yours,
   wrong branch), stop and tell your human — don't work around it. Take ! warnings seriously
   (behind `main` → run `/sync` first; unmet dependency → build against mocks or coordinate).
2. Read the contracts it references (`packages/shared/src/contracts/`) and your area's conventions
   (`.claude/rules/`).
3. Confirm the feature doesn't already exist: Explore subagent or `rg` across the code and all task files.
4. Write a short plan: files to change (all inside your paths), contracts used, mocks needed, tests, and how you'll
   verify. Anything nontrivial → present it in plan mode and wait for approval.
5. Mark it started: `npm run task -- status $ARGUMENTS "In Progress"`.
