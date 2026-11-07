# AGENTS.md — binding rules for every coding agent in this repo

Three developers build one app in parallel, each with an AI agent:
**dev1** Keith (Claude Code) · **dev2** (Claude Code) · **dev3** (Codex, merge captain).
Every path has exactly one owner (`docs/OWNERSHIP.md`). These rules apply to Claude Code and Codex alike and are
enforced by git hooks and CI — breaking them only moves the failure later. Details: `docs/TEAM_POLICY.md`.

## 0 · Start of every session

1. Run `npm run whoami` (Claude Code shows it automatically). It prints your role, branch, sync status, the paths
   you may edit and your open tasks.
2. No role set, or you're on `main`? **Stop** and tell your human (`node scripts/setup-dev.mjs <role>` / `git switch <role>/work`).
3. Read only what the task needs: your task file `docs/tasks/<role>.md`, `docs/API_CONTRACTS.md`, the area
   conventions in `.claude/rules/<web|api|shared>.md` (plain markdown — Codex reads them too), and code in your paths.

## 1 · Ownership

- Edit only files your role owns. Unsure? `npm run guard -- path <file>`.
- Never modify, move, delete, rename or reformat another developer's files — not one line, not even to fix an
  obvious bug. Never silently change a shared interface. Never overwrite or revert someone else's work.
- Need a change outside your paths: stop, write a request (§6), tell your human, keep going with a mock.
- If the guard blocks you, do not retry another way (shell commands, scripts, other paths, `--no-verify`, `git -c`).
- Scratch files go in `.scratch/` (gitignored), never loose in the repo.

## 2 · Tasks

- Work only on tasks listed in **your** task file. Before coding run `npm run task:start -- <ID>`: it checks owner,
  branch, dependencies, overlaps and paths. Any ✗ → stop and ask.
- Missing, unassigned, ambiguous or overlapping task → ask your human before writing code. Never invent work.
- Search before building (`rg`, all task files, `packages/shared`). Reuse what exists; never build a second version.
- Keep your status current: `npm run task -- status <ID> "In Progress"` (then Blocked / Review / Done).

## 3 · Implementation discipline

- Plan nontrivial work first and get your human's OK. Make the smallest change that meets the acceptance criteria.
- Follow existing patterns and the area conventions. No premature abstractions, no refactors of unrelated code.
- New dependency only if essential, only in your own workspace's `package.json`, and say why in the handoff.
- Never delete or replace working code without saying why. Never present stubbed, mocked or placeholder work as
  done — list it under "Stubs/mocks remaining".

## 4 · Contracts

- Web ↔ API talk only through `packages/shared` (Zod schemas + endpoint registry), documented in
  `docs/API_CONTRACTS.md`. An endpoint must be in the registry before anyone implements or calls it.
- dev3 makes contract changes on request. Additive (new endpoint, optional field) = fast. Breaking (rename,
  remove, new required field) = all three agree first. Announce changes before anyone builds on them.
- Until a contract change is merged, build against a local mock — never against an unmerged contract.

## 5 · Git

- Work on `<role>/work` (or `<role>/<topic>`). Never commit on or push to `main`; `main` changes only through
  reviewed pull requests merged by the merge captain.
- Before changing files: `git status` and check your branch. Commit small, coherent, passing steps:
  `D1-03: add login form validation`.
- Never: force-push, `reset --hard`, `clean`, `rebase`, `restore`/`checkout --` over someone's changes,
  `branch -D`, `--no-verify`, `git -c`, or merge any branch except `origin/main` (use `npm run sync`).
- Merge conflicts: resolve only files you own; `package-lock.json` → regenerate; anything else →
  `git merge --abort` and report to the owner.

## 6 · Requests and handoffs

- Need something from another dev: add under "Requests to others" in YOUR task file
  `- REQ dev1→dev2 (open): <what> — needed by D1-05` and tell your human. The owner implements it.
- Finished work goes into a PR whose description is the handoff from `npm run handoff -- <ID>`, every field
  filled in honestly.

## 7 · Done means verified

Before calling a task done: `npm run verify` passes · you ran the feature and checked every acceptance criterion ·
`npm run guard` shows only your files · contracts respected · handoff written · status updated.
Say plainly what is incomplete.

## 8 · Security

- No secrets, keys or tokens in code, fixtures, logs or commits. Real values live only in gitignored `.env` files
  (templates: `apps/*/.env.example`). Don't read `.env` files.
- External/LLM API keys are used server-side only (`apps/api`). Never disable validation, auth or security checks to
  make something work. Don't run unknown scripts or add unknown packages without telling your human.

## 9 · Context and token efficiency

- Use these docs as the source of truth instead of re-scanning the repo. Don't read `node_modules/`, `dist/`,
  `package-lock.json`, `*.db`, or other developers' areas beyond the interfaces you need.
- Keep replies short: what changed, how you verified it, what's left.

## Commands

| Command                                                                 | What it does                                                           |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `npm run whoami`                                                        | role, branch, sync status, owned paths, open tasks                     |
| `npm run task:start -- <ID>`                                            | preflight before coding                                                |
| `npm run board`                                                         | every open task on the team                                            |
| `npm run task -- status <ID> "<Status>"`                                | update your task (Not Started · In Progress · Blocked · Review · Done) |
| `npm run task -- new "<title>" --paths "<globs>" --accept "<criteria>"` | add a task to your own file                                            |
| `npm run guard` · `npm run guard -- path <file>`                        | ownership check of your branch · of a path                             |
| `npm run dev` · `npm run dev:mock`                                      | web :5173 + API :8787 · web only, mock API                             |
| `npm run db:reset`                                                      | recreate and seed the local DB (after schema changes)                  |
| `npm run verify`                                                        | format, lint, typecheck, tests, build, ownership                       |
| `npm run sync` · `npm run sync -- --check`                              | merge the latest main · preview conflicts                              |
| `npm run handoff -- <ID>`                                               | handoff block for the PR description                                   |

## Where things are

| File                                          | Purpose                                               |
| --------------------------------------------- | ----------------------------------------------------- |
| `docs/OWNERSHIP.md`                           | who owns what (the enforced map)                      |
| `docs/TEAM_POLICY.md`                         | detailed procedures behind these rules                |
| `docs/API_CONTRACTS.md` · `packages/shared/`  | contract conventions and endpoint table · the schemas |
| `docs/tasks/<role>.md` · `docs/TASK_BOARD.md` | your tasks · milestones, backlog, cut list            |
| `docs/ARCHITECTURE.md` · `docs/DECISIONS.md`  | how the app works · decisions made                    |
| `docs/INTEGRATION.md` · `docs/DEMO.md`        | checkpoints and merging · demo plan and fallbacks     |

## Codex notes (dev3)

- Codex has no edit-time guard: check unfamiliar paths with `npm run guard -- path <file>` first. The commit hook
  blocks mistakes anyway.
- Network is off in Codex's default sandbox, so `npm install`, `git fetch` and `npm run sync` ask for approval.
- Skills in `.agents/skills/`: `$task-start`, `$task-finish`, `$sync`, `$checkpoint` (merge captain).
