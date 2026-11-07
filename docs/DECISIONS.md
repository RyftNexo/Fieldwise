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
| D-009 | Product: **GrantGuide**, a plain-language grant advisor for Irish farmers (persona Declan, West Cork) | Fits the brief: scattered DAFM data → one actionable answer for non-technical users, no dashboard | kickoff |
| D-010 | The LLM never decides. Gemini extracts a `FarmProfile` and phrases the result; deterministic TypeScript rules decide eligibility and compute the € | No invented grants, testable, and it's the pitch | kickoff |
| D-011 | Stack stays Profile A (TypeScript). Scheme rules are pure functions in `apps/api` with a table of tests per scheme | The skeleton is ready; no re-tooling in a 9-hour build | kickoff |
| D-012 | LLM: Gemini via `@google/genai`, key in `apps/api/.env` only; `DEMO_MODE=fixtures` replays recorded replies | Team choice; the demo still works offline | kickoff |
| D-013 | Scheme figures go into the rules only after checking gov.ie. Conditions we can't verify (peat, SAC/SPA) return `likely` or `check` with the reason | Wrong numbers on stage cost more than fewer schemes | kickoff |
| D-014 | Voice input uses the browser's Web Speech API (en-IE). Editable chips are the correction path; the offline demo uses typed or example input | Big wow for little code; Chrome's recognition needs internet | kickoff |
| D-015 | Business angle: free for farmers; registered foresters pay per pre-qualified lead (lead button + inbox in the demo) | Gives the judges a revenue model | kickoff |
| D-016 | The GitHub repo is private `RyftNexo/corkathon2026` (replaces D-006) | Created at kickoff on Keith's account. The `main` ruleset needs GitHub Pro on a private repo, still to confirm | kickoff |
| D-017 | The demo runs locally on Keith's laptop (`npm run demo`); a hosted URL is the first thing cut | Offline-capable, no deploy risk | kickoff |
| D-018 | Until contract v1 merges, the advisor page runs on bannered local preview data inside its feature folder, then switches to `call()` and shared fixtures (D1-02) | Web work starts before the contract without inventing endpoints | kickoff |
| D-019 | The repo stays private with no GitHub ruleset on `main`. Protection comes from the git hooks in every set-up clone, CI on every PR, and the merge captain only merging green PRs. Revisit at submission if the dev post needs a public link | GitHub refused the ruleset (needs Pro on a private repo); we chose privacy over server-side protection | 12:35 |
