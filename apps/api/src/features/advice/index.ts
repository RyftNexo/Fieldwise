import { endpoints } from '@app/shared';
import { Hono } from 'hono';
import { env } from '../../env';
import { parseBody, reply } from '../../lib/http';
import { adviseFromText } from './pipeline';
import { replayRecording } from './recordings';
import { buildRulesAdvice } from './rulesAdvice';

export const router = new Hono();

// C-03: the farmer's words → advice. Live: LLM extract → rules → LLM explain.
// DEMO_MODE=fixtures: replay the recorded examples instead (offline demo safety net).
router.post(endpoints.advice.path, async (c) => {
  const { text } = await parseBody(c, endpoints.advice);
  const advice = env.DEMO_MODE === 'fixtures' ? replayRecording(text) : await adviseFromText(text);
  return reply(c, endpoints.advice, advice);
});

// C-04: corrected profile → rules-only advice, computed by the rules engine (no AI).
router.post(endpoints.evaluateAdvice.path, async (c) => {
  const { profile } = await parseBody(c, endpoints.evaluateAdvice);
  return reply(c, endpoints.evaluateAdvice, buildRulesAdvice(profile));
});
