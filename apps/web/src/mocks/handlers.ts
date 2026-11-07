import {
  type AdviceResponse,
  adviceFixtures,
  type EndpointDef,
  endpoints,
  type FarmProfile,
  type ResponseOf,
  ringVoiceResponseFixture,
  schemeFixtures,
  type VoiceCallState,
  voiceCallFixtures,
} from '@app/shared';
import type { z } from 'zod';
// client.ts imports this file too. ApiError is only used inside handlers, at call time, so the cycle is safe.
import { ApiError } from '@/api/client';

/**
 * Mock API for `npm run dev:mock`: one handler per contract ID, built from the shared fixtures.
 * Every endpoint the web app calls needs a mock here, so the UI never waits for the real API.
 *
 *   mock(endpoints.listThings)(() => thingFixtures)
 *   mock(endpoints.createThing)(({ body }) => ({ id: crypto.randomUUID(), ...body }))
 */
type BodyOf<E> =
  E extends EndpointDef<z.ZodType, infer Req>
    ? Req extends z.ZodNever
      ? undefined
      : z.output<Req>
    : undefined;

export interface MockRequest<E extends EndpointDef> {
  params: Record<string, string | number>;
  query: Record<string, unknown>;
  /** Already validated with the endpoint's request schema (defaults applied). */
  body: BodyOf<E>;
}

export type AnyMockHandler = (req: {
  params: Record<string, string | number>;
  query: Record<string, unknown>;
  body: unknown;
}) => unknown;

/** Curried so the handler is type-checked against the endpoint's contract. */
function mock<E extends EndpointDef>(endpoint: E) {
  return (
    handler: (req: MockRequest<E>) => ResponseOf<E> | Promise<ResponseOf<E>>,
  ): [string, AnyMockHandler] => [endpoint.id, handler as unknown as AnyMockHandler];
}

/** Picks the persona fixture that fits the question, so each example prompt shows its own result. */
function fixtureForText(text: string): AdviceResponse {
  const lower = text.toLowerCase();
  if (/solar|dairy/.test(lower)) return adviceFixtures.aoife;
  if (/shed|sheep/.test(lower)) return adviceFixtures.mary;
  return adviceFixtures.declan;
}

function fixtureForProfile(profile: FarmProfile): AdviceResponse {
  if (profile.plannedInvestment === 'solar' || profile.enterprise === 'dairy')
    return adviceFixtures.aoife;
  if (profile.plannedInvestment === 'shed' || profile.enterprise === 'sheep')
    return adviceFixtures.mary;
  return adviceFixtures.declan;
}

// Each mock phone call moves one step per poll, like a real call: ringing, the farmer talks, then the advice.
// The other screens show in mock mode too: a number ending in 9 rings and then fails, a number that isn't an Irish
// mobile is refused (the real API refuses numbers missing from its demo allowlist), and an unknown call is a 404.
const VOICE_STEPS: VoiceCallState[] = [
  'ringing',
  'ringing',
  'pending',
  'pending',
  'pending',
  'pending',
  'pending',
  'pending',
  'done',
];
/** Polls before this index are still the conversation. From here, the page shows the check. */
const checkingStartsAt = 3;
const FAILED_STEPS: VoiceCallState[] = ['ringing', 'ringing', 'failed'];
const voiceCalls = new Map<string, { to: string; steps: VoiceCallState[]; polls: number }>();

/** 087 123 4567, +353 87 123 4567 or 00353 (0)87 123 4567: what the mock agrees to ring. */
function isIrishMobile(to: string): boolean {
  let digits = to.replace(/\D/g, '').replace(/^00/, '');
  if (digits.startsWith('353')) digits = digits.slice(3);
  return /^0?8\d{8}$/.test(digits);
}

export const mockHandlers: Record<string, AnyMockHandler> = Object.fromEntries([
  mock(endpoints.health)(() => ({
    status: 'ok',
    time: new Date().toISOString(),
    db: 'mock',
    demoMode: 'off',
  })),

  mock(endpoints.advice)(({ body }) => fixtureForText(body.text)),

  // The real C-04 re-runs the rules on the edited profile; the mock keeps the fixture's matches.
  mock(endpoints.evaluateAdvice)(({ body }) => ({
    ...fixtureForProfile(body.profile),
    profile: body.profile,
  })),

  mock(endpoints.listSchemes)(() => schemeFixtures),

  // No phone rings in mock mode: every call gets a fresh id and replays the shared voice fixtures.
  mock(endpoints.ringVoiceCall)(({ body }) => {
    if (!isIrishMobile(body.to)) {
      throw new ApiError(
        'FORBIDDEN',
        'We can only ring Irish mobile numbers on the demo list.',
        403,
      );
    }
    const callSid = `CA${crypto.randomUUID().replaceAll('-', '')}`;
    const steps = body.to.replace(/\D/g, '').endsWith('9') ? FAILED_STEPS : VOICE_STEPS;
    voiceCalls.set(callSid, { to: body.to, steps, polls: 0 });
    return { ...ringVoiceResponseFixture, callSid, to: body.to };
  }),

  mock(endpoints.getVoiceCall)(({ params }) => {
    const callSid = String(params.callSid);
    const voiceCall = voiceCalls.get(callSid);
    if (!voiceCall) {
      throw new ApiError(
        'NOT_FOUND',
        "We can't find that call any more. Start again to place a new one.",
        404,
      );
    }
    const index = Math.min(voiceCall.polls, voiceCall.steps.length - 1);
    const state = voiceCall.steps[index] ?? 'done';
    const checking = state === 'pending' && index >= checkingStartsAt;
    voiceCall.polls += 1;
    return {
      ...voiceCallFixtures[state],
      callSid,
      to: voiceCall.to,
      ...(checking ? { checking: true } : {}),
    };
  }),
]);
