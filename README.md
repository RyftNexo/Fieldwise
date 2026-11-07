# Fieldwise

**Your farm. Your options**

Fieldwise helps Irish farmers explore grants and support schemes by describing their farm in their own words. Answer a phone call or type a description, then see which schemes may be relevant, why they match, and what to check next.

## From a farm description to practical options

Finding support should not mean knowing every scheme name or reading every policy document first. Fieldwise starts with the farmer's situation:

> “I have a 40-hectare suckler beef farm in West Cork. About 3 hectares beside the river are too wet for the cattle. What options do I have?”

It turns that description into an understandable starting point for a conversation with an adviser or the Department of Agriculture.

## What you can do

- **Talk over the phone.** Enter an approved demo mobile number, answer the call and describe your farm. Hear a spoken summary and see the results on screen.
- **Type or use your microphone.** Switch to the text journey, speak through a supported browser, or try the Declan, Aoife and Mary examples.
- **Check what was understood.** Review your farm's size, location, activities and land characteristics. Correct a detail to re-run the checks without another AI request.
- **Explore relevant schemes.** See the reasons behind each match, payment estimates where supported, and conditions that still need checking.
- **See the evidence.** Follow official source links, inspect the scheme data and view the Understand → Rules → Explain pipeline.
- **Plan your next steps.** Read a plain-English summary and work through a checklist of suggested actions.

No farmer account or login is required for the prototype.

## How the advice works

**AI understands and explains; code checks the rules and calculates estimates.**

Fieldwise first extracts a structured farm profile from the description. Its rules engine checks that profile against the scheme criteria and performs supported calculations. AI then explains those results in plain English.

The current prototype includes checks for NTAS, ANC, BISS, ACRES, SCIS and AWNSS. Coverage and verification vary by scheme; an included scheme is not a guarantee of eligibility, availability or payment.

## What to keep in mind

Fieldwise is a Corkathon 2026 prototype, not an official eligibility decision or an application submission service.

- Scheme information is a manually maintained snapshot, not a live government feed. Confirm current rates, deadlines and conditions through the linked official sources.
- The app cannot verify herd numbers, land parcels, entitlements, soil tests or every scheme condition. Results may say “likely” or “check first”, and estimates are not payment guarantees.
- Speech recognition and AI can misunderstand a description. Review and correct the farm profile before relying on a result.
- Phone calls require configured Twilio services and an allowlisted destination. Browser microphone support varies.

## Try it locally

Requires **Node.js 22.12+** and npm.

For a quick interface preview without external service credentials:

```bash
npm ci
npm run dev:mock
```

Open [localhost:5173](http://localhost:5173), switch to **Enter your farm details instead**, and choose an example farmer. This mode uses illustrative mock responses, not verified grant advice, and does not place real phone calls.

To run the full local app, copy `apps/api/.env.example` to `apps/api/.env`, configure the required services there, and run:

```bash
npm run dev
```

The web app runs at [localhost:5173](http://localhost:5173) and the API at [localhost:8787](http://localhost:8787). Live descriptions need an `OPENAI_API_KEY`; phone calls also need the Twilio settings documented in the template. For the recorded example descriptions without a live AI request, set `DEMO_MODE=fixtures` and use the typed journey.

## Further reading

- [Demo walkthrough](docs/DEMO.md)
- [Architecture and data flow](docs/ARCHITECTURE.md)
- [API contracts and configuration](docs/API_CONTRACTS.md)
- [Contributor rules](AGENTS.md) and [team workflow](docs/TEAM_POLICY.md)
