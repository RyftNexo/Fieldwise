# Demo plan

Owner: **dev1**. The demo path is the product: build it first, protect it always.

## The demo path (under 2 minutes)

1. The homepage opens on the phone call ("Your mobile number" → Call me, D-022). Until the phone line is live, click
   "Type your farm details instead" (or open `/?mode=type`): the judge sees one big input, the tagline, a mic button
   and three example prompts (Declan, Aoife, Mary).
2. We speak (or type) Declan's situation; the words fill the box live.
3. The **pipeline stepper** lights up Extract → Rules → Explain. Click a step to see its JSON.
4. **"What we understood"** chips: 40 ha · suckler beef · West Cork · 3 ha too wet · next to a river. Editing one
   re-runs the rules without the AI (this also fixes speech-recognition mistakes).
5. **Grant cards** (NTAS, ANC, BISS, ACRES): the rule that fired, the € figure, the status, a link, and a
   "likely / check first" badge where we can't verify something.
6. Plain-English summary and a **next-steps checklist**.
7. **The wow:** "Send to a registered forester" saves a lead, and it appears in the forester inbox.
8. "Show the raw data": the scheme criteria table the decision came from.

## Story (3 minutes)

| Part         | Time | Content                                                                                          |
| ------------ | ---- | ------------------------------------------------------------------------------------------------ |
| Problem      | 0:20 | Declan, 55, West Cork: 3 ha too wet for cattle. The answer is buried in DAFM PDFs, so he pays a consultant or gives up. |
| Solution     | 0:20 | GrantGuide: describe your farm in plain English and see the grants you qualify for, with the maths and the reason. |
| Live demo    | 1:40 | The demo path above, narrated                                                                    |
| How it works | 0:30 | Extract → Rules → Explain. "Code does the matching and the maths; the LLM only listens and talks." |
| What's next  | 0:10 | Free for farmers, foresters pay per pre-qualified lead. Next: map-based field selection and alerts when a scheme opens. |

## Honest limits (read this when asked, or at the end)

"This is a top-of-funnel advisor, not a compliance engine. Eligibility comes from a hand-coded snapshot of a few DAFM
schemes, so rates and deadlines change and would need a maintained feed. We can't check herd numbers, land parcels,
nitrates or soil tests, so some answers are 'likely' and point you to Teagasc or a registered forester to confirm. The
AI only extracts your details and phrases the result. If it mishears you, fix the chips and the rules re-run without
it. Next: map-based field selection and alerts when a new scheme opens."

## Data and accounts

- Demo data: the shared fixtures (Declan, Aoife, Mary) plus the seeded schemes (`npm run db:reset`, dev2).
- Demo login: none. The forester inbox is open in the demo.
- External APIs: `OPENAI_API_KEY` lives in `apps/api/.env` on the demo laptop only. `DEMO_MODE=fixtures` is the fallback.
- Voice input uses Chrome's speech recognition, which needs internet. Offline, use the example prompts.

## Run it

```bash
git checkout demo-v1     # or the last good cp-N tag
npm ci
npm run demo             # reset DB → build web → serve everything on http://localhost:8787
```

## Fallback ladder

1. **Live, local:** `demo-v1` on Keith's laptop, seeded data, real OpenAI responses.
2. **The phone call fails:** "Type it instead" on the call card (or open `/?mode=type`), then click Declan's example.
3. **Voice fails or the Wi-Fi drops:** click Declan's example prompt instead of speaking.
4. **Degraded:** OpenAI fails or is slow → restart with `DEMO_MODE=fixtures` in `apps/api/.env`.
5. **Last good build:** `git checkout cp-N && npm run demo`.
6. **Video:** the backup recording from code freeze (on the laptop, a phone and YouTube).
7. **Slides:** screenshots of every demo-path step.

## Pre-demo checklist

- [ ] Feature freeze → `demo-v1` tagged; backup video recorded in fixtures mode
- [ ] Video uploaded to YouTube and the link sent to the dev post (by 18:00)
- [ ] Fresh-clone rehearsal ×2 (time it), full rehearsal ×3
- [x] Mic tested on the demo laptop in Chrome
- [ ] Laptop: charged, notifications off, browser zoom ~125%, tabs closed, works with Wi-Fi off
- [ ] Slides final (one real forester quote); screenshots included; presenter and backup presenter agreed
- [ ] Room confirmed: Dora Allman, 4th floor, the Hub
