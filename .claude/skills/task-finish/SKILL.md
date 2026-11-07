---
name: task-finish
description: Finish a task in this repo (IDs like D1-03) — verify, self-review, write the handoff, update status and commit. Use when you believe the implementation is complete.
argument-hint: <task-id>
---

Final-stage policy: AGENTS.md overrides older exclusive-owner wording below. All project paths are shared. Keep your own task IDs/branch; check and coordinate overlaps before editing. Cross-area fixes and conflict resolution are allowed after understanding affected work, with relevant tests and review; never discard others’ edits or bypass guards.


Finish task **$ARGUMENTS** (definition of done: `AGENTS.md` §7).

1. `npm run verify`. Fix failures in your own files only; a failure in someone else's area → stop and report it.
2. Run the feature (`npm run dev`, or `npm run dev:mock` for web-only work) and check every acceptance criterion yourself.
3. `npm run guard` — only your files may appear. Then run `/code-review` on your changes and fix what it finds
   (your files only).
4. `npm run handoff -- $ARGUMENTS` and complete every `<fill in>` honestly — especially "Stubs/mocks remaining".
5. `npm run task -- status $ARGUMENTS Review`, then commit (`$ARGUMENTS: <summary>`). Ask your human before `git push`.
6. Give your human the handoff block for the PR description. Never claim done if anything is mocked or failing.
