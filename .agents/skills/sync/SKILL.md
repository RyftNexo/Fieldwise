---
name: sync
description: Bring the latest main into your branch safely in this repo. Use before starting a task, after a checkpoint merge, or when `npm run whoami` says you are behind origin/main.
---

1. Commit your own work first — sync refuses a dirty working tree. Never stash or discard to get around it.
2. `npm run sync -- --check` to preview conflicts, then `npm run sync` (both need network approval in the sandbox).
3. Conflicts: resolve only files you own. `package-lock.json` → follow the regenerate steps the script prints.
   Anyone else's file → `git merge --abort`, then tell the owner and the user.
4. If it says the DB schema changed → `npm run db:reset`. Finish with `npm run verify`.
