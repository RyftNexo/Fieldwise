---
paths:
  - "apps/web/**"
---

# Web conventions (owner: dev1)

- Stack: Vite + React 19 + TypeScript + Tailwind v4, React Router, TanStack Query. Alias `@/` → `apps/web/src/`.
- **Features** live in `src/features/<name>/index.tsx` and export `routes` (children of the layout, paths relative
  to `/`) plus optional `nav`. They are auto-registered — never edit a central router or menu to add one.
- **Data** only through `src/api/client.ts`: `call(endpoints.x, { params, query, body })`. Never call
  `fetch('/api/…')` directly. Types come from `@app/shared`; never redefine API types locally.
- **Mocks**: every endpoint you call needs a handler in `src/mocks/handlers.ts` — `mock(endpoints.x)(() => …)`,
  built from shared fixtures. `npm run dev:mock` must always work.
- Server state via TanStack Query (`queryKey: [endpoints.x.id, …]`); invalidate after mutations.
- Every data view handles loading, empty and error states (show `ApiError.message` or validation `details`).
- Shared UI in `src/components/`; feature-only UI stays in its feature folder. Merge classes with `cn()` from `@/lib/utils`.
- Styling: Tailwind utilities and the tokens in `src/index.css` (`@theme`). No other CSS frameworks; global CSS only
  in `index.css`. shadcn/ui is compatible (`npx shadcn@latest init` when online).
- Accessible by default: labelled inputs, real buttons for actions, visible focus, alt text.
- Tests: Vitest, colocated `*.test.ts(x)`.
