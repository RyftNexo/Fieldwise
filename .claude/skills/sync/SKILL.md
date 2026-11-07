---
name: sync
description: Bring the latest main into your branch safely in this repo. Use before starting a task, after a checkpoint merge, or when the session banner says you are behind origin/main.
---

Final-stage policy: AGENTS.md overrides older exclusive-owner wording below. All project paths are shared. Keep your own task IDs/branch; check and coordinate overlaps before editing. Cross-area fixes and conflict resolution are allowed after understanding affected work, with relevant tests and review; never discard others’ edits or bypass guards.


1. Commit your own work first — sync refuses a dirty working tree. Never stash or discard to get around it.
2. `npm run sync -- --check` to preview conflicts, then `npm run sync`.
3. Conflicts: resolve only files you own. `package-lock.json` → follow the regenerate steps the script prints.
   Anyone else's file → `git merge --abort`, then tell the owner and your human.
4. If it says the DB schema changed → `npm run db:reset`. Finish with `npm run verify`.
