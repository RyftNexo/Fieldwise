# AGENTS.md — final-stage collaboration rules

Effective 2026-11-07 at the project lead's explicit request. These rules replace earlier exclusive path ownership and owner-only implementation rules in repository Markdown, skills and area conventions. All three developers may work in every project area. docs/OWNERSHIP.md supplies the enforced map; docs/TEAM_POLICY.md supplies the procedure.

## Start and coordinate

1. Run npm run whoami and check git status and the current branch. Keep your configured role and use your own role/topic branch. Never work directly on main.
2. Read the task board, all active task files and the contracts relevant to the change. Search before building.
3. Before editing a shared area, check other In Progress/Review tasks and open PRs for overlapping files or interfaces. Record the intended files, acceptance criteria and checks in your own task file. Keep your own task IDs and task-status commands; do not impersonate another role.
4. If another developer has active overlapping work, coordinate a handoff or split the files before editing. Do not overwrite, revert or duplicate their changes. A shared map grants access, not ownership of uncommitted work.
5. A developer may implement fixes in web, API, shared contracts, tooling or docs. Previous area leads remain useful reviewers, not edit gatekeepers. Keep changes small and scoped to the agreed final-stage work.

## Preserve the working app

- Use the existing shared registry and Zod contracts. Browser requests go through call(endpoints...), API JSON routes through parseBody/reply. Do not invent parallel schemas or direct browser fetch calls.
- Announce interface changes before implementation. Prefer additive changes. For breaking changes, obtain affected developers' agreement and update all consumers and tests in the same coordinated change; merge in dependency order.
- Preserve the working typed, voice and fixture paths. Never present mocks as real functionality. Document all remaining limitations.
- No unrelated refactors or broad formatting. Add dependencies only when essential, in the relevant workspace, and explain them in the handoff.
- Do not weaken authentication, validation, secret checks, test coverage or CI to make a change pass. Shared ownership does not authorize disabling guards or changing this policy casually.

## Verify and integrate

- Before commit: run npm run guard and review the diff. The map permits every role on every project path; role/branch/secret protections remain active.
- Run npm run verify and the relevant feature checks. For changes spanning web/API/shared, run production smoke plus affected user flows. Check fixture mode where relevant. List exactly what was tested and what was not.
- Task status: Not Started → In Progress → Review → Done. Done means verified and merged. Keep other developers' task histories intact; record cross-area work in your own task file.
- Complete npm run handoff -- ID for each PR. Name changed interfaces, dependencies, tests and unfinished work. Request review from affected area leads for cross-area changes.
- Main changes through reviewed green PRs merged by the merge captain (dev3; Keith deputy). No force-push, reset --hard, clean, rebase, branch -D, --no-verify, git -c or guard-disable workarounds.
- Sync using npm run sync. Resolve conflicts only after understanding both changes; if intent is unclear, abort the merge and coordinate. Never discard another person's work. Regenerate package-lock.json rather than hand-merging it.

## Security and housekeeping

Secrets stay server-side in gitignored .env files. Do not read or print real .env contents, keys or tokens. Templates document names and safe examples only. Scratch files go in .scratch/. Stop servers you started when finished. Keep progress and handoffs concise and accurate.

## Commands

npm run whoami · npm run board · npm run task:start -- ID · npm run task -- status ID STATUS · npm run guard · npm run sync · npm run verify · npm run smoke · npm run handoff -- ID
