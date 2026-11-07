import { type EndpointDef, endpoints, type ResponseOf } from '@app/shared';
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

export const mockHandlers: Record<string, AnyMockHandler> = Object.fromEntries([
  mock(endpoints.health)(() => ({
    status: 'ok',
    time: new Date().toISOString(),
    db: 'mock',
    demoMode: 'off',
  })),
]);
