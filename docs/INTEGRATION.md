# Integration — checkpoints, merging, freezes, demo release

Owner: **dev3** (merge captain). Deputy: **dev1** (Keith). Nobody else merges into `main`.

## Current integration state (2026-11-07)

- Contract v1 merged in PR #4; `contract-v1` points to `fa7aabb`. D3-01's completion record merged in PR #6.
- Web contract integration merged in PR #5 (`cdf6f42`): advice and forester leads use C-03/C-06/C-07;
  mock mode uses shared fixtures. D1-02 and D1-07 still await their owner's final status update.
- API v1, rules, scheme catalogue and database seeds merged in PRs #9/#10. The walking-skeleton checkpoint
  is verified at main commit `38acc12`; `cp-1` identifies that application version.
- **D3-03 / cp-1 verification:** full `npm run verify` passes (222 tests, typecheck, production build and
  ownership). `npm run smoke` passes all 7 checks, including C-05 and C-07, with no pending-endpoint skips.
  Clean-checkout verification uses the captain's detached main worktree and dependencies from `npm ci`.
- Production HTTP integration used a separate scratch SQLite database: reset/seeding produced six schemes;
  C-03 returned contract-valid responses for Declan, Aoife and Mary; C-04 reproduced the rules and changed
  matches for an edited profile. Invalid input, missing contact/consent and unknown scheme IDs returned 400.
  C-06 ignored client-supplied totals and computed its matches; C-07 listed the new lead newest first.
  The lead survived a server restart against the same database.
- Browser verification used the production web app with the real HTTP API and `DEMO_MODE=fixtures`:
  Declan's example → advice results → forester form → saved lead in the forester inbox. The SPA route also
  loads directly. Recorded OpenAI replies were used; rules and database operations ran normally.
- **Still unverified:** fresh OpenAI calls, microphone input on the presentation laptop, and a final
  independent review of scheme facts. Provider wording was reconciled in PR #14. This is the walking-skeleton checkpoint, not the full live-AI/voice checkpoint or demo release.
- API environment variables are documented in `docs/API_CONTRACTS.md`. For offline operation, set
  `DEMO_MODE=fixtures` in the API environment before startup; this is separate from `npm run dev:mock`, which
  uses browser-side illustrative fixtures and does not exercise API/database persistence.
- Notes API removed in PR #13; shared notes contracts are now retired (D3-04).
- PR #14 adds profile editing and source data, fixes provider wording and records microphone testing.
- Twilio implementation merged in PR #13; real dial-in still needs number/tunnel testing.
- D3-02's layer-based map matches the kickoff decision and was confirmed in PR #7: Ilarion authored it,
  Keith approved it, and Toby merged it. Ownership confirmation is complete.

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
