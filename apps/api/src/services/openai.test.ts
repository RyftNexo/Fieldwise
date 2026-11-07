import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '../env';
import { AppError } from '../lib/http';
import { callLlm } from './openai';

const request = { systemInstruction: 'Be brief.', userText: 'hello' };
const originalKey = env.OPENAI_API_KEY;

beforeEach(() => {
  env.OPENAI_API_KEY = 'test-key-not-real';
});

afterEach(() => {
  env.OPENAI_API_KEY = originalKey;
  vi.restoreAllMocks();
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const completion = (content: string | null, extra: Record<string, unknown> = {}) =>
  jsonResponse({ choices: [{ message: { content, ...extra }, finish_reason: 'stop' }] });

async function codeOf(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(AppError);
  return (error as AppError).code;
}

describe('callLlm', () => {
  it('returns the text of the first choice', async () => {
    const fetchImpl = vi.fn(async () => completion('Hello there'));
    expect(await callLlm(request, { fetchImpl })).toBe('Hello there');
  });

  it('sends the key as a bearer header, never in the URL, and the messages and model', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      completion('{}'),
    );
    await callLlm(
      { ...request, responseSchema: { name: 'thing', schema: { type: 'object' } } },
      { fetchImpl },
    );

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(String(url)).toBe('https://api.openai.com/v1/chat/completions');
    expect(String(url)).not.toContain('test-key-not-real');
    expect(headers.authorization).toBe('Bearer test-key-not-real');

    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe(env.OPENAI_MODEL);
    expect(body.messages).toEqual([
      { role: 'system', content: 'Be brief.' },
      { role: 'user', content: 'hello' },
    ]);
    expect(body.response_format).toEqual({
      type: 'json_schema',
      json_schema: { name: 'thing', strict: true, schema: { type: 'object' } },
    });
  });

  it('asks for plain text when no schema is given', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      completion('ok'),
    );
    await callLlm(request, { fetchImpl });
    expect(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)).response_format).toBeUndefined();
  });

  it('fails clearly when no key is configured', async () => {
    delete env.OPENAI_API_KEY;
    const fetchImpl = vi.fn();
    expect(await codeOf(callLlm(request, { fetchImpl }))).toBe('UPSTREAM_ERROR');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  const failures: Array<[string, () => Promise<Response>, string]> = [
    ['an HTTP 500', async () => jsonResponse({}, 500), 'UPSTREAM_ERROR'],
    [
      'an HTTP 401 (bad key)',
      async () => jsonResponse({ error: { code: 'invalid_api_key' } }, 401),
      'UPSTREAM_ERROR',
    ],
    [
      'an HTTP 429 rate limit',
      async () => jsonResponse({ error: { code: 'rate_limit_exceeded' } }, 429),
      'RATE_LIMITED',
    ],
    [
      'an HTTP 429 out of credit',
      async () => jsonResponse({ error: { code: 'insufficient_quota' } }, 429),
      'UPSTREAM_ERROR',
    ],
    [
      'a refusal',
      async () => completion(null, { refusal: 'I cannot help with that.' }),
      'UPSTREAM_ERROR',
    ],
    ['no choices', async () => jsonResponse({ choices: [] }), 'UPSTREAM_ERROR'],
    ['an empty reply', async () => completion('  '), 'UPSTREAM_ERROR'],
    [
      'a reply cut off at the length limit',
      async () =>
        jsonResponse({ choices: [{ message: { content: '{"hect' }, finish_reason: 'length' }] }),
      'UPSTREAM_ERROR',
    ],
    [
      'a body that is not JSON',
      async () => new Response('<html>', { status: 200 }),
      'UPSTREAM_ERROR',
    ],
    [
      'a network failure',
      async () => {
        throw new TypeError('fetch failed');
      },
      'UPSTREAM_ERROR',
    ],
  ];

  it.each(failures)('turns %s into %s', async (_name, respond, expectedCode) => {
    const fetchImpl = vi.fn(respond);
    expect(await codeOf(callLlm(request, { fetchImpl }))).toBe(expectedCode);
  });

  it('turns a timeout into a friendly UPSTREAM_ERROR', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    });
    const error = await callLlm(request, { fetchImpl }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('UPSTREAM_ERROR');
    expect((error as AppError).message).toContain('too long');
  });
});
