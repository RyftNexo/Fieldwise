# Claude Code — rules for this repo

These extend `AGENTS.md` (binding for every agent, imported by the root `CLAUDE.md`). If AGENTS.md is not in your
context, read it before doing anything else. If anything here seems to conflict with it, AGENTS.md wins — ask your human.

## Enforcement you will meet

- **Session banner** (SessionStart hook): role, branch, owned paths, sync status, open tasks. Re-run `npm run whoami` if unsure.
- **Ownership guard** (PreToolUse hook on Edit/Write): blocks edits outside your paths, edits on `main`, edits with no
  role set, and anything inside `.git/`.
- **When the guard blocks you: stop.** Don't retry through Bash (`sed`, `cat >`, `cp`, `mv`, `tee`, node or python
  scripts), another path, a symlink, `git -c` or `--no-verify`. Tell your human what you need and file a request
  (AGENTS.md §6). Git hooks and CI re-check everything, so a workaround only fails later and costs the team time.
- **Deny rules** block force-push, `reset --hard`, `clean`, `rebase`, `restore`, `branch -D`, `--no-verify`, `git -c`,
  pushes to `main`, changing hook or role config, and reading `.env` files. Don't look for ways around them.
- Never edit `.claude/settings.json`, `.githooks/`, `scripts/` or `docs/OWNERSHIP.md` (dev3's), and never set `HACKATHON_GUARD`.

## How to work

- **Plan mode** for anything beyond a small single-file change, and always before touching contracts or 3+ files.
  Present the plan and wait for approval.
- **Start every task** with `/task-start <ID>`. Use the Explore subagent (or `rg`) to confirm the feature doesn't
  already exist before writing it.
- Make the smallest change that meets the acceptance criteria. No drive-by refactors, speculative features, or new
  dependencies without saying why.
- **Finish every task** with `/task-finish <ID>`; it includes `/code-review` on your diff. Fix findings in your own files only.
- **dev2:** run `/security-review` on the API before feature freeze.
- Bring in `main` with `/sync` only. Never merge any other branch.
- Run long-lived servers (`npm run dev`) in the background and stop them when you're done.

## Context hygiene

- Don't read `node_modules/`, `dist/`, `package-lock.json`, `*.db`, or other developers' areas beyond the
  interfaces you need — read the contracts in `packages/shared/` instead.
- Prefer `rg`/Grep and targeted reads over directory dumps. Don't re-scan the repo every turn.
- Replies: what changed, how you verified it, what's left.

## Skills in this repo

| Skill               | Use                                        |
| ------------------- | ------------------------------------------ |
| `/task-start <ID>`  | preflight and plan before coding           |
| `/task-finish <ID>` | verify, self-review, handoff, status       |
| `/sync`             | merge the latest `main` safely             |
| `/checkpoint`       | merge captain only (dev3; Keith as deputy) |
