import {
  ApiErrorBody,
  buildPath,
  type EndpointDef,
  type RequestOf,
  type ResponseOf,
} from '@app/shared';
import { mockHandlers } from '@/mocks/handlers';

/**
 * The ONLY way the web app talks to the API. Never call fetch('/api/...') directly.
 *   const status = await call(endpoints.health);
 *   const thing  = await call(endpoints.<name>, { body: { … } });
 * Mock mode (`npm run dev:mock` or VITE_API_MODE=mock) answers from src/mocks/handlers.ts.
 */
export const API_MODE: 'mock' | 'live' =
  import.meta.env.MODE === 'mock' || import.meta.env.VITE_API_MODE === 'mock' ? 'mock' : 'live';

export class ApiError extends Error {
  constructor(
    /** A shared ErrorCode, or NETWORK_ERROR / CONTRACT_MISMATCH / NO_MOCK raised by this client. */
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface CallOptions<E extends EndpointDef> {
  params?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: RequestOf<E>;
  signal?: AbortSignal;
}

let authToken: string | null = null;
/** Set once auth exists; sent as `Authorization: Bearer <token>` to endpoints with auth: true. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function call<E extends EndpointDef>(
  endpoint: E,
  options: CallOptions<E> = {},
): Promise<ResponseOf<E>> {
  const data =
    API_MODE === 'mock' ? await callMock(endpoint, options) : await callLive(endpoint, options);
  const parsed = endpoint.response.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      'CONTRACT_MISMATCH',
      `Response for ${endpoint.id} doesn't match its contract`,
      0,
      parsed.error.issues,
    );
  }
  return parsed.data as ResponseOf<E>;
}

function toQueryString(query: CallOptions<EndpointDef>['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

async function callLive<E extends EndpointDef>(endpoint: E, options: CallOptions<E>) {
  const url = buildPath(endpoint.path, options.params) + toQueryString(options.query);
  const headers: Record<string, string> = { accept: 'application/json' };
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (endpoint.auth && authToken) headers.authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: endpoint.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (err) {
    throw new ApiError(
      'NETWORK_ERROR',
      'Cannot reach the API. Is it running? (npm run dev)',
      0,
      err,
    );
  }

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = ApiErrorBody.safeParse(json);
    if (error.success) {
      const { code, message, details } = error.data.error;
      throw new ApiError(code, message, res.status, details);
    }
    throw new ApiError('INTERNAL', `Unexpected HTTP ${res.status} from ${endpoint.id}`, res.status);
  }
  return (json as { data?: unknown } | null)?.data;
}

async function callMock<E extends EndpointDef>(endpoint: E, options: CallOptions<E>) {
  const handler = mockHandlers[endpoint.id];
  if (!handler) {
    throw new ApiError(
      'NO_MOCK',
      `No mock for ${endpoint.id}. Add one in src/mocks/handlers.ts`,
      501,
    );
  }
  let body: unknown = options.body;
  if (endpoint.request) {
    const checked = endpoint.request.safeParse(options.body);
    if (!checked.success) {
      const details = checked.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      throw new ApiError('VALIDATION_ERROR', 'Invalid request body', 400, details);
    }
    body = checked.data;
  }
  await new Promise((resolve) => setTimeout(resolve, import.meta.env.MODE === 'test' ? 0 : 250));
  return handler({ params: options.params ?? {}, query: options.query ?? {}, body });
}
