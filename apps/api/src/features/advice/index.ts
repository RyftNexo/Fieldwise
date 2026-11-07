// STUB — returns the recorded Declan fixture. Real behaviour (Gemini extract → rules engine → Gemini
// explain) replaces `buildAdviceStub` later; the routes, validation and replies stay as they are.
import { type AdviceResponse, adviceFixtures, endpoints, type FarmProfile } from '@app/shared';
import { Hono } from 'hono';
import { parseBody, reply } from '../../lib/http';

export const router = new Hono();

/** Fixture advice for the given profile. `steps.extract` is rewritten so the stepper shows the profile used. */
function buildAdviceStub(profile: FarmProfile): AdviceResponse {
  const fixture = adviceFixtures.declan;
  return {
    ...fixture,
    profile,
    steps: { ...fixture.steps, extract: { profile, fixture: true } },
  };
}

// C-03: free text → full advice. The text is validated but not read yet (no Gemini call in the stub).
router.post(endpoints.advice.path, async (c) => {
  await parseBody(c, endpoints.advice);
  return reply(c, endpoints.advice, buildAdviceStub(adviceFixtures.declan.profile));
});

// C-04: corrected profile → rules-only advice.
router.post(endpoints.evaluateAdvice.path, async (c) => {
  const { profile } = await parseBody(c, endpoints.evaluateAdvice);
  return reply(c, endpoints.evaluateAdvice, buildAdviceStub(profile));
});
