import {
  type AdviceResponse,
  adviceFixtures,
  type EndpointDef,
  endpoints,
  type FarmProfile,
  type GrantMatch,
  type Lead,
  leadFixtures,
  type ResponseOf,
  schemeFixtures,
} from '@app/shared';
import type { z } from 'zod';

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

const fixtureMatches: GrantMatch[] = Object.values(adviceFixtures).flatMap(
  (advice) => advice.matches,
);

// In-memory state so new leads show up in the forester inbox until the page reloads.
let leads: Lead[] = [...leadFixtures];

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

  mock(endpoints.createLead)(({ body }) => {
    const matches = fixtureMatches.filter((match) => body.schemeIds.includes(match.schemeId));
    const lead: Lead = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name: body.name,
      phone: body.phone,
      email: body.email,
      profile: body.profile,
      matches,
      estimatedTotalEur: matches.reduce(
        (sum, match) => sum + (match.eligible === 'check' ? 0 : (match.value?.totalEur ?? 0)),
        0,
      ),
    };
    leads = [lead, ...leads];
    return lead;
  }),

  mock(endpoints.listLeads)(() =>
    [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  ),
]);
