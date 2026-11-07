# Demo plan

Owner: **dev1**. The demo path is the product: build it first, protect it always.

## The demo path (fill in at kickoff)

1. _(the judge sees …)_
2. _(they click / type …)_
3. _(the app shows …)_
4. _(the "wow" moment …)_

## Story (3 minutes)

| Part         | Time | Content                                       |
| ------------ | ---- | --------------------------------------------- |
| Problem      | 0:20 | Who hurts and how (one real example)          |
| Solution     | 0:20 | One sentence: what our app does               |
| Live demo    | 1:40 | The demo path above, narrated                 |
| How it works | 0:30 | Architecture in one picture; AI or data parts |
| What's next  | 0:10 | One or two concrete next steps                |

## Data and accounts

- Seed data: `npm run db:reset` (realistic names and numbers that tell the story — dev2, D2-02)
- Demo login (if any): _(user / password — not a real person's credentials)_
- External APIs: keys in `apps/api/.env` on the demo laptop only; `DEMO_MODE=fixtures` as the fallback

## Run it

```bash
git checkout demo-v1     # or the last good cp-N tag
npm ci
npm run demo             # reset DB → build web → serve everything on http://localhost:8787
```

## Fallback ladder

1. **Live, local:** `demo-v1` on Keith's laptop, offline, seeded data.
2. **Degraded:** an external API fails or is slow → restart with `DEMO_MODE=fixtures` in `apps/api/.env`.
3. **Last good build:** `git checkout cp-N && npm run demo`.
4. **Video:** the backup recording from code freeze (on the laptop and a phone).
5. **Slides:** screenshots of every demo-path step.

## Pre-demo checklist

- [ ] Code freeze → `demo-v1` tagged; backup video recorded
- [ ] Fresh-clone rehearsal ×2 (time it)
- [ ] Laptop: charged, notifications off, browser zoom ~125%, tabs closed, Wi-Fi not required
- [ ] Slides final; screenshots included; presenter and backup presenter agreed
