import {
  type EndpointDef,
  ERROR_STATUS,
  type ErrorCode,
  type RequestOf,
  type ResponseOf,
} from '@app/shared';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { z } from 'zod';
import { isProd } from '../env';

/** Throw this from any handler; the global error handler renders the standard error envelope. */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  get status(): ContentfulStatusCode {
    return ERROR_STATUS[this.code];
  }
}

type BodySchema<E extends EndpointDef> = NonNullable<E['request']>;

/** Summarise Zod issues as `[{ path, message }]` for the `details` field. */
export function issuesOf(error: z.ZodError) {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}

/**
 * Successful response for `endpoint`: `{ data }`. The payload is type-checked against the contract
 * and, outside production, validated at runtime so contract drift fails loudly in dev and tests.
 */
export function reply<E extends EndpointDef>(
  c: Context,
  endpoint: E,
  data: ResponseOf<E>,
  status: ContentfulStatusCode = 200,
) {
  if (isProd) return c.json({ data }, status);
  const checked = endpoint.response.safeParse(data);
  if (!checked.success) {
    throw new AppError(
      'INTERNAL',
      `Response for ${endpoint.id} does not match its contract`,
      issuesOf(checked.error),
    );
  }
  return c.json({ data: checked.data }, status);
}

/** Parse and validate the JSON body with the endpoint's request schema (400 VALIDATION_ERROR if invalid). */
export async function parseBody<E extends EndpointDef>(
  c: Context,
  endpoint: E,
): Promise<z.output<BodySchema<E>>> {
  const schema = endpoint.request;
  if (!schema) throw new AppError('INTERNAL', `${endpoint.id} has no request schema`);
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Request body must be valid JSON');
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid request body', issuesOf(result.error));
  }
  return result.data as z.output<BodySchema<E>>;
}

/** Validate query-string parameters with any Zod object schema. */
export function parseQuery<S extends z.ZodType>(c: Context, schema: S): z.output<S> {
  const result = schema.safeParse(c.req.query());
  if (!result.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', issuesOf(result.error));
  }
  return result.data;
}

export type { RequestOf, ResponseOf };
