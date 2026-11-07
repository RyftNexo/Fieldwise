import { z } from 'zod';

/**
 * Cross-cutting API conventions. Every endpoint follows these — see docs/API_CONTRACTS.md.
 * Owner: dev3. Changes here affect everyone: request them, don't edit them.
 */

export const ErrorCode = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'UPSTREAM_ERROR',
  'INTERNAL',
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

/** HTTP status used for each error code. */
export const ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  UPSTREAM_ERROR: 502,
  INTERNAL: 500,
} as const satisfies Record<ErrorCode, number>;

/** Body of every non-2xx response: `{ "error": { code, message, details? } }`. */
export const ApiErrorBody = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBody>;

/** Every 2xx response body is `{ "data": <payload> }`; this wraps a payload schema. */
export const successBody = <T extends z.ZodType>(data: T) => z.object({ data });

/** IDs are opaque strings (UUIDs). Timestamps are ISO-8601 UTC strings. */
export const Id = z.string().min(1);
export const Timestamp = z.iso.datetime();
