import type { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * One API endpoint, as agreed between web (dev1) and API (dev2).
 * `response` describes the `data` payload (the envelope is added by the API helpers).
 */
export interface EndpointDef<Res extends z.ZodType = z.ZodType, Req extends z.ZodType = z.ZodType> {
  /** Stable contract ID, e.g. "C-03". Matches the table in docs/API_CONTRACTS.md. */
  id: string;
  method: HttpMethod;
  /** Full path starting with /api. Path params use `:name`, e.g. /api/items/:id */
  path: `/api${string}`;
  /** Does the endpoint require `Authorization: Bearer <token>`? */
  auth: boolean;
  summary: string;
  /** Request body schema (POST/PUT/PATCH) — omit for endpoints without a body. */
  request?: Req;
  /** Schema of the `data` payload in a successful response. */
  response: Res;
}

/** Identity helper that keeps literal types; use it for every endpoint. */
export function defineEndpoint<Res extends z.ZodType, Req extends z.ZodType = z.ZodNever>(
  def: EndpointDef<Res, Req>,
): EndpointDef<Res, Req> {
  return def;
}

/** Type of the response `data` payload for an endpoint. */
export type ResponseOf<E> = E extends EndpointDef<infer Res, z.ZodType> ? z.output<Res> : never;

/** Type of the request body an endpoint accepts (never if it takes no body). */
export type RequestOf<E> = E extends EndpointDef<z.ZodType, infer Req> ? z.input<Req> : never;

/** Replace `:param` segments: buildPath('/api/items/:id', { id: '7' }) → '/api/items/7'. */
export function buildPath(path: string, params: Record<string, string | number> = {}): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing path param "${name}" for ${path}`);
    return encodeURIComponent(String(value));
  });
}
