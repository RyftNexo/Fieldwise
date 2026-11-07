# Team policy — the detailed procedures behind AGENTS.md

Owner: **dev3**. Changes need all three developers. `AGENTS.md` is the short binding version; this file explains how.

## 1. Principles

1. **One owner per path.** The owner (or their agent) is the only one who edits it. Map: `docs/OWNERSHIP.md`.
2. **Contracts first.** Web and API agree on shapes in `packages/shared` before either side builds.
3. **Main is always demoable.** It only changes through green, reviewed PRs merged by the merge captain.
4. **Integrate early and often.** An end-to-end slice on main by checkpoint 1; then every 60–90 minutes.
5. **Humans decide, agents execute.** Scope, priorities, contract changes and merges are human decisions.

## 2. Roles

| Role                               | Who                 | Responsibilities                                                                          |
| ---------------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| dev1 · experience & product lead   | Keith (Claude Code) | Web app, UX, demo flow; kickoff, task board, decisions, demo script; deputy merge captain |
| dev2 · server lead                 | Claude Code         | API, business logic, auth, validation, DB schema + seeds, external/LLM integrations       |
| dev3 · platform & integration lead | Codex               | Contracts + fixtures, tooling, CI, tests, deployment; **merge captain**                   |

## 3. Task protocol

- **Where tasks live:** each developer's own file, `docs/tasks/<role>.md` (single writer, no merge conflicts).
  `docs/TASK_BOARD.md` (dev1) holds milestones, the unassigned backlog, the cut list and cross-team dependencies.
  `npm run board` prints every open task in one table.
- **IDs:** `D1-NN`, `D2-NN`, `D3-NN` — owner encoded in the ID, so there are never collisions.
- **Fields:** Status · Depends on · Paths · Accept · Notes (`npm run task -- new` writes the template).
- **Statuses:** Not Started → In Progress → (Blocked) → Review → Done. _Review_ = PR open; _Done_ = merged to main.
- **Who creates tasks:** you add tasks for yourself, inside your own paths. Work that spans owners is agreed by the
  humans first; each owner then adds their part to their own file. Unowned ideas go to the backlog in TASK_BOARD.md.
- **Starting:** `/task-start <ID>` (Codex: `$task-start`) → preflight (`npm run task:start`) → search for existing
  code → plan → status In Progress.
- **Finishing:** `/task-finish <ID>` → verify → run the feature → self-review → handoff → status Review → commit → push → PR.

## 4. Change requests (anything outside your paths)

1. Add a line under "Requests to others" in **your** task file and tell the owner in person:
   `- REQ dev1→dev3 (open): add optional avatarUrl to User (C-04) — needed by D1-05`
2. The owner answers within ~15 minutes: accept (adds a task in their file), push back, or propose an alternative.
3. Keep going with a mock or stub in your own paths. Mark the REQ `(done)` when merged.

**Contract changes** (dev3 owns `packages/shared`):

- _Additive_ (new endpoint, new optional field): dev3 implements, small PR, merged at once, announced.
- _Breaking_ (rename, removal, new required field, changed meaning): all three agree first; consumers and provider
  update in the same checkpoint. Prefer adding a new field over changing an old one.
- Merge order: the contract PR first, then the API, then the web PRs that use it.

## 5. Git workflow

- One GitHub repo · `main` protected · each developer works on `<role>/work` in their own clone.
- Optional parallel sessions on one laptop: `npm run worktree -- <topic>` → sibling folder on `<role>/<topic>`.
- Commits: small, coherent and passing. Message `<TASK-ID>: <what changed>`.
- **Sync** (`npm run sync`): before starting a task, after every checkpoint, whenever the banner says you're behind.
- **PRs**: one per developer per checkpoint (or sooner for contract changes and blockers). Title `<role>: <summary>`;
  description = the handoff. Merged with **"Create a merge commit"** (not squash, so `<role>/work` stays mergeable).
- Never: commit or push to main, force-push, `reset --hard`, `clean`, `rebase`, `branch -D`, `--no-verify`, `git -c`,
  merging anything but `origin/main`. Claude Code deny rules and the git hooks enforce most of this.

## 6. Conflicts

Conflicts can only appear in your own files, generated files, or after an ownership exception.

- `npm run sync -- --check` previews them without touching anything.
- **package-lock.json** — never hand-merge:
  `git checkout --theirs package-lock.json && npm install && git add package-lock.json && git commit --no-edit`
- **Files you own:** resolve, `git add`, `git commit --no-edit`, then `npm run verify`.
- **Anyone else's file:** `git merge --abort`, tell the owner. They fix it on their branch, or the captain decides.

## 7. Quality

- `npm run verify` = format + lint (Biome) · typecheck (tsc) · tests (Vitest + guard tests) · build · ownership.
  CI runs the same plus the smoke test. A red check never merges.
- Each owner tests their own area: web — mock handlers and logic; API — every endpoint has a test that parses
  its response with the contract schema; shared — schema and fixture tests; dev3 — smoke and the demo-path check.
- Run what you built. A passing build is not a working feature.
- Never present placeholder work as complete: list it under "Stubs/mocks remaining".

## 8. Security

- Secrets live only in gitignored `apps/*/.env`. Templates (`.env.example`) document every variable, without values.
- Share real keys in person or via a password manager — never in the repo, chat logs, issues or PRs.
- LLM and other API keys are used server-side only. `VITE_*` variables are public, so never put secrets there.
- The pre-commit hook blocks `.env` files, key files and common key formats. If it fires, move the value to `.env`.
- Never disable validation, auth or CORS to "make it work". Validate all input at the API with the contract schemas.
- `DEMO_MODE=fixtures` makes external calls return recorded responses, so the demo survives bad Wi-Fi or rate limits.

## 9. Handoff format (PR description)

Generate with `npm run handoff -- <ID>` and complete it honestly:

```text
**Task:** D1-03 · Login screen
**Owner:** dev1
**Branch:** dev1/work
**Files changed:** 4 file(s) (+120/−8) — …
**Contracts affected:** none | files + IDs (announced?)
**Tests performed:** npm run verify ✓, manual: login with demo user
**Dependencies:** C-03 (merged), D2-01 (in review)
**Integration notes:** run npm run db:reset; merge after dev2's PR
**Stubs/mocks remaining:** "forgot password" link is a placeholder
**Status:** Review
```

## 10. Communication

- **In person first.** Interface or contract changes are announced out loud before anyone builds on them.
- Five-minute stand-up at every checkpoint: merged · next · blocked · contract changes.
- Agents communicate only through files (task files, REQ lines, contracts, PR handoffs), never by editing each
  other's code.
- Stuck for more than 15 minutes, or blocked by someone else? Say so at once and mark the task Blocked.

## 11. Exceptions (humans only)

- **Ownership exception:** the owner reviews the change and adds the `ownership-approved` label to the PR; CI then
  lets it through. Use it rarely — normally the owner just makes the change.
- `git commit --no-verify` and `HACKATHON_GUARD=off claude` (disables the edit guard for that session) exist for
  emergencies only, are used by humans, never agents, and CI still checks ownership.

## 12. Lite mode (if the PR flow feels too slow)

The merge captain may merge `origin/<role>/work` branches into main locally at a checkpoint, after running
`npm run verify` and `npm run smoke` on the result. Hooks, ownership and the "main must stay green" rule still apply.
