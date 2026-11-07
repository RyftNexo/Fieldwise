# Final-stage team policy

Effective 2026-11-07, authorized by the project lead. All developers may edit any project path. This replaces earlier exclusive ownership, owner-only requests and ownership-exception approval procedures. AGENTS.md is the binding short form.

## Claim work before editing

Read current main, active tasks and open PRs. Add or update a task in your own task file with affected paths, acceptance criteria, dependencies and checks. Keep your own role, branch prefix and IDs. Review existing work before implementing anything new.

If a task or PR overlaps the same files or interface, coordinate which developer takes the change or split the work first. Do not silently take over an active task, overwrite changes, or mark another developer's work complete without evidence. Requests remain useful coordination records, but work outside your former layer no longer needs an ownership exception.

## Keep interfaces compatible

Use packages/shared schemas and the endpoint registry as the source of truth. Any developer may update them. Announce changes, prefer additive changes, and obtain affected developers' agreement for breaking changes. Update and test affected consumers together. Merge contracts before dependent API and web changes.

Use the existing client/helpers and feature discovery patterns. Preserve input validation, authentication, fixture fallback and the working demo path. No unrelated refactors, duplicate implementations or speculative features.

## Verification and merge

Every author checks their whole change, including areas outside their original specialty. Run npm run verify, applicable tests and the actual feature. Cross-area changes need affected flows checked, including production smoke and fixture mode where relevant. Never remove or weaken failing checks to get green.

Complete the PR handoff: task/author/branch, files and contracts changed, tests and results, dependencies, integration notes, remaining mocks and limitations. Request affected area leads' review for cross-area changes. Main changes only through reviewed green PRs merged by the merge captain or deputy. Shared ownership does not change branch or secret protections.

Keep task statuses current: In Progress while implementing, Review when submitted, Done only after verification and merge. Each developer continues to maintain their own task file so task commands remain compatible.

## Conflicts and data

Sync before new work. Never discard someone else's edits. Understand both sides before resolving conflicts; abort and coordinate when intent is unclear. Regenerate a conflicted lockfile. Database reset deletes local data: use a temporary database for checks unless resetting the local demo data is intended.

Keys stay server-side in gitignored .env files. Do not read, log or publish secrets. Do not disable hooks, signature/authentication checks, validation or CI. Stop temporary servers after verification. Do not buy services, place calls, or publish a release merely because an area is now editable; those actions still need task authorization.
