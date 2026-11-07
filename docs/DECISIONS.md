# Decisions

Owner: **dev1**. One line per decision, newest last. Agents read this instead of re-debating settled questions.

| ID    | Decision                                                                                                                                              | Why                                                          | When  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----- |
| D-001 | Layer-based ownership by default (web dev1, API dev2, platform + contracts dev3); feature slices only if the brief splits into 3+ independent modules | Cleanest boundaries for three AI agents                      | setup |
| D-002 | Default stack Profile A: TypeScript end to end (Vite/React, Hono, SQLite/Drizzle, Zod contracts)                                                      | One language, shared types, agents fluent, offline demo      | setup |
| D-003 | DB schema belongs to the API owner (dev2); contracts belong to dev3                                                                                   | Schema changes constantly; contracts are the neutral seam    | setup |
| D-004 | No migration files: `npm run db:reset` recreates the local DB from schema + seed                                                                      | Numbered migrations conflict between parallel developers     | setup |
| D-005 | dev3 is merge captain, Keith deputy; PRs merged with merge commits at checkpoints                                                                     | One accountable integrator; personal branches stay mergeable | setup |
| D-006 | Public GitHub repo with a `main` ruleset (PR + `verify` check)                                                                                        | Branch rules are free on public repos                        | setup |
| D-007 | Ownership enforced by hooks + CI, not just instructions                                                                                               | AI instructions alone aren't a guarantee                     | setup |
| D-008 | Example `notes` feature kept as the reference pattern until real features replace it                                                                  | Shows contract → API → DB → UI end to end                    | setup |
