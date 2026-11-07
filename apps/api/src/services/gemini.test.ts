import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '../env';
import { AppError } from '../lib/http';
import { callGemini } from './gemini';

const request = { systemInstruction: 'Be brief.', userText: 'hello' };
const originalKey = env.GEMINI_API_KEY;

beforeEach(() => {
  env.GEMINI_API_KEY = 'test-key-not-real';
});

afterEach(() => {
  env.GEMINI_API_KEY = originalKey;
  vi.restoreAllMocks();
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function codeOf(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(AppError);
  return (error as AppError).code;
}

describe('callGemini', () => {
  it('returns the text of the first candidate', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        candidates: [{ content: { parts: [{ text: 'Hello ' }, { text: 'there' }] } }],
      }),
    );
    expect(await callGemini(request, { fetchImpl })).toBe('Hello there');
  });

  it('sends the key in a header, never in the URL, and the schema when given', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      jsonResponse({ candidates: [{ content: { parts: [{ text: '{}' }] } }] }),
    );
    await callGemini({ ...request, responseSchema: { type: 'OBJECT' } }, { fetchImpl });

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(String(url)).not.toContain('test-key-not-real');
    expect(headers['x-goog-api-key']).toBe('test-key-not-real');
    const body = JSON.parse(String(init?.body));
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.systemInstruction.parts[0].text).toBe('Be brief.');
  });

  it('asks for minimal thinking by default, and leaves it out when set to off', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      jsonResponse({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }),
    );
    const sentConfig = () =>
      JSON.parse(String(fetchImpl.mock.calls.at(-1)?.[1]?.body)).generationConfig;

    await callGemini(request, { fetchImpl });
    expect(sentConfig().thinkingConfig).toEqual({ thinkingLevel: 'minimal' });

    env.GEMINI_THINKING_LEVEL = 'off';
    await callGemini(request, { fetchImpl });
    expect(sentConfig().thinkingConfig).toBeUndefined();
    env.GEMINI_THINKING_LEVEL = 'minimal';
  });

  it('ignores reasoning parts and returns only the answer', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        candidates: [
          { content: { parts: [{ text: 'thinking…', thought: true }, { text: 'The answer.' }] } },
        ],
      }),
    );
    expect(await callGemini(request, { fetchImpl })).toBe('The answer.');
  });

  it('fails clearly when no key is configured', async () => {
    delete env.GEMINI_API_KEY;
    const fetchImpl = vi.fn();
    expect(await codeOf(callGemini(request, { fetchImpl }))).toBe('UPSTREAM_ERROR');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  const failures: Array<[string, () => Promise<Response>, string]> = [
    ['an HTTP 500', async () => jsonResponse({}, 500), 'UPSTREAM_ERROR'],
    ['an HTTP 429', async () => jsonResponse({}, 429), 'RATE_LIMITED'],
    [
      'a blocked prompt',
      async () => jsonResponse({ promptFeedback: { blockReason: 'SAFETY' } }),
      'UPSTREAM_ERROR',
    ],
    ['no candidates', async () => jsonResponse({ candidates: [] }), 'UPSTREAM_ERROR'],
    [
      'an empty reply',
      async () => jsonResponse({ candidates: [{ content: { parts: [{ text: '  ' }] } }] }),
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
    expect(await codeOf(callGemini(request, { fetchImpl }))).toBe(expectedCode);
  });

  it('turns a timeout into a friendly UPSTREAM_ERROR', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    });
    const error = await callGemini(request, { fetchImpl }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('UPSTREAM_ERROR');
    expect((error as AppError).message).toContain('too long');
  });
});
