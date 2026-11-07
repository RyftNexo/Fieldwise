// Minimal Gemini client over the REST API (no SDK, so no new dependency). Server-side only: the key never
// leaves this process. Every failure becomes an AppError with a message that is safe to show a farmer.
import { env } from '../env';
import { AppError } from '../lib/http';

export interface GeminiRequest {
  /** Rules for the model. Never put user text here. */
  systemInstruction: string;
  /** The farmer's words or the data to work from. Treated as data, not instructions. */
  userText: string;
  /** Gemini response schema; when set the reply is JSON that matches it. */
  responseSchema?: Record<string, unknown>;
  temperature?: number;
}

interface GeminiDeps {
  fetchImpl?: typeof fetch;
}

interface GeminiReply {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

const unavailable = 'The advice service did not respond. Please try again in a moment.';

/** Calls Gemini and returns the model's text. Throws AppError('UPSTREAM_ERROR' | 'RATE_LIMITED'). */
export async function callGemini(request: GeminiRequest, deps: GeminiDeps = {}): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new AppError('UPSTREAM_ERROR', 'The advice service is not set up on this server.');
  }
  const fetchImpl = deps.fetchImpl ?? fetch;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      signal: AbortSignal.timeout(env.GEMINI_TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: request.systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: request.userText }] }],
        generationConfig: {
          temperature: request.temperature ?? 0,
          ...(env.GEMINI_THINKING_LEVEL !== 'off' && {
            thinkingConfig: { thinkingLevel: env.GEMINI_THINKING_LEVEL },
          }),
          ...(request.responseSchema && {
            responseMimeType: 'application/json',
            responseSchema: request.responseSchema,
          }),
        },
      }),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw new AppError(
      'UPSTREAM_ERROR',
      timedOut ? 'The advice service took too long to answer. Please try again.' : unavailable,
    );
  }

  if (response.status === 429) {
    throw new AppError(
      'RATE_LIMITED',
      'Lots of people are asking at once. Please try again shortly.',
    );
  }
  if (!response.ok) {
    console.error(`Gemini returned HTTP ${response.status}`);
    throw new AppError('UPSTREAM_ERROR', unavailable);
  }

  const body = (await response.json().catch(() => null)) as GeminiReply | null;
  if (body?.promptFeedback?.blockReason) {
    throw new AppError(
      'UPSTREAM_ERROR',
      'The advice service could not answer that. Try rewording it.',
    );
  }
  // Thinking models may return their reasoning as parts flagged `thought`; only the answer is wanted.
  const parts = body?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((part) => !part.thought)
    .map((part) => part.text ?? '')
    .join('');
  if (!text.trim()) throw new AppError('UPSTREAM_ERROR', unavailable);
  return text;
}
