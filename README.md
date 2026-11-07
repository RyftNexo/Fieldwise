# UCC Hackathon — team repo

Three developers, three AI agents, one app. This repo ships with a **coordination layer** (ownership map, guard
hooks, CI, task board, contracts) and a **working full-stack skeleton** (React + Hono + SQLite), so the team can
start building the moment the brief is announced.

| ID   | Who      | Agent       | Owns                                                                  |
| ---- | -------- | ----------- | --------------------------------------------------------------------- |
| dev1 | Keith    | Claude Code | Web app (`apps/web`), product docs · deputy merge captain             |
| dev2 | Toby     | Claude Code | API + database (`apps/api`)                                           |
| dev3 | Ilarion  | Codex       | Contracts (`packages/shared`), tooling, CI, tests · **merge captain** |

Rules for every agent: **[AGENTS.md](AGENTS.md)** · Claude Code extras: [.claude/CLAUDE.md](.claude/CLAUDE.md) ·
ownership: [docs/OWNERSHIP.md](docs/OWNERSHIP.md) · procedures: [docs/TEAM_POLICY.md](docs/TEAM_POLICY.md).

## Prerequisites

- **Node 22.12+** (22 or 24 LTS) and npm 10+ · **git 2.38+** recommended · a GitHub account with access to the repo
- dev1/dev2: **Claude Code 2.1.295+** (`claude update`) · dev3: Codex CLI or the Codex app

## First-time setup

**Keith — creates the repo (once):**

```bash
cd ~/HackatonUCC
unzip -o ~/Downloads/agent-config.zip     # first machine only: adds .claude/ and .github/ (agent config + CI)
node scripts/setup-dev.mjs dev1 --init    # git init → npm install → first commit → role, hooks, branch dev1/work
```
It then prints the commands to push to a new **empty** GitHub repo. Do the one-time GitHub settings in
[docs/INTEGRATION.md](docs/INTEGRATION.md): merge commits only, a ruleset on `main`, the `ownership-approved`
label, and collaborators.

**Teammates:**

```bash
git clone https://github.com/<keith>/<repo>.git && cd <repo>
node scripts/setup-dev.mjs dev2           # or dev3: role, hooks, branch, .env files, npm install, health check
```
Check your machine at any time with `npm run doctor`.

**Verify your agent sees the rules (2 minutes):**

- Claude Code: start `claude` in the repo → `/context` lists `CLAUDE.md`, `.claude/CLAUDE.md` and `AGENTS.md`, and
  the session starts with the "Team guard" banner. Ask it to edit a file you don't own — it must be blocked.
- Codex: ask "List the instruction sources you loaded" → `AGENTS.md`; `/skills` shows `task-start`.

## Daily loop

```bash
npm run whoami                  # role, branch, owned paths, open tasks, behind main?
npm run task:start -- D1-02     # Claude Code: /task-start D1-02 · Codex: $task-start
npm run dev                     # web http://localhost:5173 → API http://localhost:8787   (dev:mock = no API)
npm run verify                  # format, lint, typecheck, tests, build, ownership
npm run handoff -- D1-02        # PR description
npm run sync                    # bring in main after every checkpoint
```

## Commands

| Command                                                                                        | What it does                                                                          |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev` / `dev:mock`                                                                     | Web + API with hot reload / web only with the mock API                                |
| `npm run demo`                                                                                 | Reset DB → build web → serve everything on one port (http://localhost:8787)           |
| `npm run db:reset`                                                                             | Recreate and seed the local SQLite DB (after any schema change)                       |
| `npm run verify`                                                                               | The definition of "passes": Biome, tsc, tests, build, ownership                       |
| `npm run smoke`                                                                                | Boot the production build and check every simple GET contract (after `npm run build`) |
| `npm run whoami` · `doctor`                                                                    | Who am I / is my machine set up correctly                                             |
| `npm run task:start -- <ID>` · `board` · `task -- status <ID> "<S>"` · `task -- new "<title>"` | Task board                                                                            |
| `npm run guard` · `guard -- path <f>` · `guard -- map`                                         | Ownership checks                                                                      |
| `npm run sync` · `sync -- --check`                                                             | Merge the latest main safely · preview conflicts                                      |
| `npm run handoff -- <ID>`                                                                      | Generate the PR handoff block                                                         |
| `npm run worktree -- <topic>` · `-- --main`                                                    | Extra checkout for a parallel agent · captain's main checkout                         |
| `npm run format`                                                                               | Auto-fix formatting and lint                                                          |

## How the guardrails work

- **Ownership map** — `docs/OWNERSHIP.md` assigns every path to one developer; the last matching rule wins.
- **Edit time** — Claude Code's `PreToolUse` hook blocks edits outside your paths and tells the agent what to do instead.
- **Commit and push** — git hooks block unowned files, commits on `main`, wrong branch names, `.env` files and secrets.
- **Pull request** — CI re-checks ownership by branch prefix, plus format, types, tests, build and a smoke test.
- **Coordination** — per-developer task files (no shared-table conflicts), a contract registry, change requests, checkpoints.

## Troubleshooting

| Problem                                                     | Fix                                                                                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `node: not found` from a git hook (GUI git client, VS Code) | Launch the client from a terminal, or install Node system-wide rather than via a shell-only version manager             |
| Hooks don't run at all                                      | `npm run doctor`; re-run `node scripts/setup-dev.mjs <role>` (sets `core.hooksPath`, executable bits)                   |
| Claude says "No developer role is configured"               | `node scripts/setup-dev.mjs <role>`                                                                                     |
| "Commit blocked by the team guard"                          | Read it: someone else's file → request it; wrong branch → `git switch <role>/work`; secret → move it to `.env`          |
| Install fails on a native package | Use Node 22 or 24 LTS and re-run `npm install` (the DB driver, libsql, ships prebuilt binaries for macOS, Windows and Linux) |
| Port already in use                                         | Set `PORT` in `apps/api/.env`, and start the web app with `API_URL=http://localhost:<port>`                             |
| Odd data after a schema change                              | `npm run db:reset`                                                                                                      |
| `verify` fails on formatting                                | `npm run format`, then verify again                                                                                     |
