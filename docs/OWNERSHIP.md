# Final-stage shared ownership

The project lead authorized all three developers to work across the project on 2026-11-07. This supersedes the earlier layer-exclusive map. The guard already supports the shared owner any; its code and secret/branch protections are unchanged.

## Enforced map

```ownership
** any
```

This applies to web, API, shared contracts, tests, scripts, configuration and documentation. It takes effect for all developers after this PR merges and they sync main. Push/CI checks use main's map, so synchronize before submitting cross-area work.

## Coordination leads

- Keith / dev1: web, UX and product context.
- Toby / dev2: API, rules, data and voice context.
- Ilarion / dev3: contracts, platform and integration; merge captain.

These are review contacts, not exclusive editors. Keep your own branch, role and task IDs. Avoid concurrent edits to the same files; record scope in your own task file and coordinate overlaps before writing. Existing uncommitted changes always belong to their author.

Follow AGENTS.md and docs/TEAM_POLICY.md for contract compatibility, verification and review. Do not disable hooks, secret checks or CI. Permission to edit governance files is not permission to remove their safeguards.
