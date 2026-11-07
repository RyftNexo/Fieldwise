---
paths:
  - "packages/shared/**"
---

# Shared contracts (owner: dev3)

- One file per resource in `src/contracts/`; export each Zod schema and its inferred type under the same name.
- Register every endpoint in `src/contracts/endpoints.ts` with `defineEndpoint({ id: 'C-NN', … })`. IDs are stable
  and never reused. Update the endpoint table and change log in `docs/API_CONTRACTS.md` in the same PR.
- `response` describes the `data` payload; the `{ data }` / `{ error }` envelope is added by the API helpers.
- Fixtures in `src/fixtures/` are typed with the contract types and double as web mock data and API seed data —
  keep them realistic for the demo.
- Additive changes are fine on request; breaking changes need all three developers. Merge contract PRs before the
  PRs that use them.
- No runtime dependencies besides zod; never import from `apps/`.
