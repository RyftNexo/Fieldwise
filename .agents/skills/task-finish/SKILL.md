---
name: task-finish
description: Finish a task in this repo (IDs like D3-01) — verify, self-review, write the handoff, update status and commit. Use when you believe the implementation is complete.
---

Finish the task ID the user gave you (definition of done: `AGENTS.md` §7).

1. `npm run verify`. Fix failures in your own files only; a failure in someone else's area → stop and report it.
2. Run what you built (`npm run dev`, `npm run smoke` after `npm run build`, or the relevant tests) and check every
   acceptance criterion yourself.
3. `npm run guard` — only your files may appear. Review your own diff (`git diff origin/main...HEAD`) for bugs,
   leftovers and contract mismatches; fix what you find in your files only.
4. `npm run handoff -- <ID>` and complete every `<fill in>` honestly — especially "Stubs/mocks remaining".
5. `npm run task -- status <ID> Review`, then commit (`<ID>: <summary>`). Ask the user before `git push`.
6. Give the user the handoff block for the PR description. Never claim done if anything is mocked or failing.
