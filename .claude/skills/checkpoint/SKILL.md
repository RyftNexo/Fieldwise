---
name: checkpoint
description: Integration checkpoint for the merge captain (dev3; Keith as deputy) — merge green PRs in order, verify main, tag cp-N. Use only when the human merge captain asks for it.
disable-model-invocation: true
---

Follow `docs/INTEGRATION.md` § Checkpoint. In short:

1. List the open PRs. Each needs a green `verify` check and a complete handoff; otherwise it waits for the next checkpoint.
2. Merge in dependency order — shared (dev3) → API (dev2) → web (dev1) — using "Create a merge commit".
   Never merge red, never auto-merge.
3. Verify main in the captain's main worktree (`npm run worktree -- --main`, then in that folder):
   `npm ci && npm run verify && npm run build && npm run smoke`, and click through the demo path.
4. Green → `git tag cp-<N> origin/main && git push origin cp-<N>`, then tell everyone to `/sync`.
   Red → revert the offending merge immediately (GitHub "Revert" on that PR) and tell its owner.
5. Five-minute stand-up: what merged, what's next, any contract changes.
