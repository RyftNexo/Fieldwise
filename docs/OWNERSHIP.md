# Ownership

Every path in this repo has exactly one owner. Only the owner (or their agent) edits it.
Owner of this file: **dev3**. Changing ownership needs all three developers to agree (see below).

## Team

| ID       | Who      | Tool        | Role                                             | Owns                                                                                                                                                                                                                              |
| -------- | -------- | ----------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **dev1** | Keith    | Claude Code | Experience & product lead · deputy merge captain | `apps/web/**`, `.claude/rules/web.md`, `docs/{ARCHITECTURE,TASK_BOARD,DECISIONS,DEMO}.md`, `docs/tasks/dev1.md`                                                                                                                   |
| **dev2** | Toby     | Claude Code | Server lead                                      | `apps/api/**` — routes, business logic, auth, validation, DB schema, seeds, external/LLM calls — `.claude/rules/api.md`, `docs/tasks/dev2.md`                                                                                     |
| **dev3** | Ilarion  | Codex       | Platform & integration lead · **merge captain**  | **Default owner of everything else**: `packages/shared/**` (contracts), root config, `scripts/`, `.github/`, `.githooks/`, `.claude/` + `.agents/` config, `tests/`, `AGENTS.md`, `CLAUDE.md`, process docs, `docs/tasks/dev3.md` |
| any      | —        | —           | —                                                | `package-lock.json` (generated), `.scratch/**` (gitignored scratch space)                                                                                                                                                         |

## The map (enforced)

Kickoff confirmed **layer-based ownership**, as recorded in `docs/TASK_BOARD.md` and decision D-001.
The existing map below already implements that decision: Keith owns web, Toby owns API/database, and
Ilarion owns platform, contracts and integration. D3-02 confirms this map; it does not reassign any paths.
The confirmation PR still needs all three developers' approval before D3-02 is Done.

The guard (`scripts/guard.mjs`) reads the block below. One rule per line: `<pattern> <owner>`.
Patterns start at the repo root; `**` = anything, `*` = anything except `/`. **The last matching rule wins.**

```ownership
# pattern                         owner
**                                dev3    # default owner: platform & integration
apps/web/**                       dev1
apps/api/**                       dev2
.claude/rules/web.md              dev1
.claude/rules/api.md              dev2
docs/ARCHITECTURE.md              dev1
docs/TASK_BOARD.md                dev1
docs/DECISIONS.md                 dev1
docs/DEMO.md                      dev1
docs/tasks/dev1.md                dev1
docs/tasks/dev2.md                dev2
docs/tasks/dev3.md                dev3
package-lock.json                 any     # generated: regenerate on conflict, never hand-merge
.scratch/**                       any     # gitignored scratch space for agents
```

Check a path: `npm run guard -- path <file>` · print the map: `npm run guard -- map`.

## How it is enforced

| When   | Check                                                                                                                      | Covers                          |
| ------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Edit   | Claude Code `PreToolUse` hook blocks Edit/Write outside your paths                                                         | Claude Code (dev1, dev2)        |
| Commit | `.githooks/pre-commit`: staged files vs your role, branch must be `<role>/*`, no commits on `main`, no `.env`/keys/secrets | everyone, any tool              |
| Push   | `.githooks/pre-push`: whole branch vs `origin/main`, no pushes to `main` or other people's branches                        | everyone                        |
| PR     | CI `verify` job: same ownership check by branch prefix (+ format, lint, typecheck, tests, build, smoke)                    | everything, incl. `--no-verify` |

Your role comes from `git config hackathon.role` (set once by `node scripts/setup-dev.mjs <role>`; shared by all
worktrees of that clone). CI derives it from the PR branch prefix. Push and CI checks use **`origin/main`'s copy
of this map**, so nobody can grant themselves paths inside their own PR.

## When you need a change in someone else's files

1. **The owner makes the change.** Add a request under "Requests to others" in _your_ task file and tell them:
   `- REQ dev1→dev2 (open): add GET /api/stats (C-07) — needed by D1-05`
2. Keep going with a mock or stub inside your own paths.
3. Exception (rare, urgent, tiny): the owner reviews the PR and adds the GitHub label **`ownership-approved`**.
   Agents never use `--no-verify`, never edit hook/guard files, and never set `HACKATHON_GUARD=off`.

## Changing ownership (e.g. switching to feature slices at kickoff)

dev3 edits the block above in a small PR that all three approve; it takes effect for everyone after merge
(`npm run sync`). Feature-slice example — each developer owns a module end-to-end:

```text
apps/web/src/features/booking/**   dev1      apps/api/src/features/booking/**   dev1
apps/web/src/features/admin/**     dev2      apps/api/src/features/admin/**     dev2
apps/web/src/features/insights/**  dev3      apps/api/src/features/insights/**  dev3
(app shells stay with dev1 / dev2; contracts stay with dev3)
```

Features auto-register in both apps, so a new module never requires editing a shared router or schema file.
