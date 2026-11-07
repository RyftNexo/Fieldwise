# Integration — checkpoints, merging, freezes, demo release

Owner: **dev3** (merge captain). Deputy: **dev1** (Keith). Nobody else merges into `main`.

## Current integration state (2026-11-07)

- Contract v1 merged in PR #4; `contract-v1` points to `fa7aabb`. D3-01's completion record merged in PR #6.
- Web contract integration merged in PR #5 (`cdf6f42`): advice and forester leads use C-03/C-06/C-07;
  mock mode uses shared fixtures. D1-02 and D1-07 still await their owner's final status update.
- To preview the integrated web flow before the API exists, use `npm run dev:mock`. The default live mode
  needs dev2's implementation; shared fixtures contain no verified eligibility or payment estimates.
- **D3-03 / cp-1 is blocked on D2-01.** Neither mock-mode success nor a smoke test that reports pending
  endpoints establishes the required screen → real API → database flow. Do not tag `cp-1` yet.
- Dev2 must merge the v1 endpoints and seed data. Start the checkpoint with a fixed farm description through
  the advisor's C-03 request (recorded extraction/explanation allowed), then C-06/C-07 to prove database persistence.
  C-04 also needs a direct contract check until profile editing is built. For the complete demo, validate
  scheme facts, deterministic calculations, extraction/explanation, persistence and fixture fallback.
- Once the API merges: sync main, install from the lockfile, run `npm run verify` and `npm run smoke`, then
  exercise the demo in live mode. Confirm new leads survive a restart and every response matches its contract.
  Only then record the checkpoint and publish `cp-1`.
- **D3-04 is blocked on D2-03.** The notes UI is removed, but the API still uses C-01/C-02. Keep the shared
  notes schemas and fixtures until dev2 removes its notes feature and tests. Remove the contracts afterward,
  update the API contract change log, and verify all workspaces.
- D3-02's layer-based map matches the kickoff decision; its confirmation PR needs all three developers'
  approval. This review does not block API or web implementation under the existing map.

## One-time GitHub setup (repo owner)

1. Create the repo (public recommended: branch rules are free on public repos; private needs GitHub Pro/Team).
2. Settings → General → Pull Requests: allow **merge commits** only (untick squash and rebase).
3. Settings → Rules → Rulesets → New branch ruleset for `main`: require a pull request · require status check
   **`verify`** · block force pushes · restrict deletions.
4. Issues → Labels → create **`ownership-approved`**.
5. Settings → Collaborators: add dev2 and dev3 (write access).

## Cadence (scale to the event's length)

| When            | Milestone                       | Done when                                                        |
| --------------- | ------------------------------- | ---------------------------------------------------------------- |
| 0:00–0:30       | Kickoff (no code)               | Idea, one demo path, decisions in TASK_BOARD.md / DECISIONS.md   |
| 0:30–1:00       | Contract v1                     | dev3's contract PR merged, tagged `contract-v1`, everyone synced |
| 1:00–2:30       | Checkpoint 1 — walking skeleton | One screen ↔ one endpoint ↔ DB working on main, tagged `cp-1`    |
| every 60–90 min | Checkpoint N                    | Green PRs merged, main verified + smoke-tested, tagged `cp-N`    |
| ~70% of time    | **Feature freeze**              | No new features — fixes, polish, demo data, slides only          |
| end −1:30       | **Code freeze**                 | Only demo-breaking fixes; tag `demo-v1`; record the backup video |
| end −1:00       | Rehearse                        | Two full run-throughs from a clean clone of `demo-v1`            |

## Checkpoint procedure (captain)

1. Announce "checkpoint in 10 minutes". Each developer: `npm run verify` → commit → push → open or refresh the PR
   with the handoff block.
2. Review each PR: green `verify` check, complete handoff, only the owner's files (CI checks), contracts respected.
   Incomplete → it waits for the next checkpoint. **Never merge red. Never enable auto-merge.**
3. Merge in dependency order: **shared (dev3) → API (dev2) → web (dev1)**, each with "Create a merge commit".
   If a later PR goes out of date or conflicts, its owner runs `npm run sync`, pushes, and CI re-runs.
4. Verify main in the captain's main worktree (created once with `npm run worktree -- --main`):

   ```bash
   cd ../<repo>-main && git fetch && git checkout --detach origin/main
   npm ci && npm run verify && npm run build && npm run smoke
   npm run demo        # click through the demo path at http://localhost:8787
   ```
5. Green → `git tag cp-N origin/main && git push origin cp-N` and say "sync now" (everyone runs `npm run sync`).
6. Five-minute stand-up: merged · next · blocked · contract changes.

## When something fails

- **Red PR:** the author fixes it on their branch. The captain never fixes other people's code on main.
- **Red main after a merge:** revert first, fix later. On GitHub open the merged PR → **Revert** → merge the revert
  PR (CI must pass). CLI alternative, from the captain's branch:
  `git switch -c dev3/revert-cp-N origin/main && git revert -m 1 <merge-sha> && git push` → PR → merge.
  The author then fixes forward on their branch.
- **Conflicting PRs:** the later PR's owner syncs and resolves their own files. Conflicts in another owner's files →
  that owner fixes it on their branch (see TEAM_POLICY.md § Conflicts).
- **Flaky test:** the test's owner fixes or skips it with a note in their task file. Nobody deletes someone else's test.

## Freezes

- **Feature freeze:** no new features or endpoints. The demo path, fixes, polish, seed data and copy only.
- **Code freeze:** only fixes for something that breaks the demo, agreed by the captain and dev1. Everything else waits.

## Demo release

1. At code freeze: `git tag demo-v1 origin/main && git push origin demo-v1`.
2. Fresh clone on the demo laptop:
   `git clone … demo && cd demo && git checkout demo-v1 && npm ci && cp apps/api/.env.example apps/api/.env`
   (then add any real keys), followed by `npm run demo`. Rehearse twice.
3. Record the backup video of the full demo path from this build.
4. During the demo, if something breaks: `git checkout cp-N` (last good tag) → `npm run demo`. Fallback ladder: `docs/DEMO.md`.
