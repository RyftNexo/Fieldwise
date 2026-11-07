// Minimal OpenAI client over the REST API (no SDK, so no new dependency). Server-side only: the key never
// leaves this process. Every failure becomes an AppError with a message that is safe to show a farmer.
import { env } from '../env';
import { AppError } from '../lib/http';

export interface LlmRequest {
  /** Rules for the model. Never put user text here. */
  systemInstruction: string;
  /** The farmer's words or the data to work from. Treated as data, not instructions. */
  userText: string;
  /** JSON Schema (OpenAI strict mode); when set the reply is JSON that matches it. */
  responseSchema?: { name: string; schema: Record<string, unknown> };
  temperature?: number;
  /** Cancels this call. The per-request timeout still applies. */
  signal?: AbortSignal;
}

interface LlmDeps {
  fetchImpl?: typeof fetch;
}

interface ChatCompletion {
  choices?: Array<{
    message?: { content?: string | null; refusal?: string | null };
    finish_reason?: string;
  }>;
  error?: { code?: string | null; type?: string };
}

const unavailable = 'The advice service did not respond. Please try again in a moment.';

/** The caller's cancel signal, plus the usual timeout, whichever fires first. */
function llmSignal(caller?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(env.OPENAI_TIMEOUT_MS);
  return caller ? AbortSignal.any([caller, timeout]) : timeout;
}

/** Calls OpenAI and returns the model's text. Throws AppError('UPSTREAM_ERROR' | 'RATE_LIMITED'). */
export async function callLlm(request: LlmRequest, deps: LlmDeps = {}): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    throw new AppError('UPSTREAM_ERROR', 'The advice service is not set up on this server.');
  }
  const fetchImpl = deps.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      signal: llmSignal(request.signal),
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: request.temperature ?? 0,
        messages: [
          { role: 'system', content: request.systemInstruction },
          { role: 'user', content: request.userText },
        ],
        ...(request.responseSchema && {
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: request.responseSchema.name,
              strict: true,
              schema: request.responseSchema.schema,
            },
          },
        }),
      }),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw new AppError(
      'UPSTREAM_ERROR',
      timedOut ? 'The advice service took too long to answer. Please try again.' : unavailable,
    );
  }

  const body = (await response.json().catch(() => null)) as ChatCompletion | null;

  if (response.status === 429) {
    // "insufficient_quota" means the account is out of credit, which is ours to fix, not the farmer's to wait out.
    if (body?.error?.code === 'insufficient_quota') {
      console.error('OpenAI: out of credit (insufficient_quota)');
      throw new AppError('UPSTREAM_ERROR', unavailable);
    }
    throw new AppError(
      'RATE_LIMITED',
      'Lots of people are asking at once. Please try again shortly.',
    );
  }
  if (!response.ok) {
    console.error(
      `OpenAI returned HTTP ${response.status}${body?.error?.code ? ` (${body.error.code})` : ''}`,
    );
    throw new AppError('UPSTREAM_ERROR', unavailable);
  }

  const choice = body?.choices?.[0];
  if (choice?.message?.refusal || choice?.finish_reason === 'content_filter') {
    throw new AppError(
      'UPSTREAM_ERROR',
      'The advice service could not answer that. Try rewording it.',
    );
  }
  const text = choice?.message?.content ?? '';
  // A reply cut off at the length limit is incomplete, so treat it as a failure instead of using half an answer.
  if (!text.trim() || choice?.finish_reason === 'length')
    throw new AppError('UPSTREAM_ERROR', unavailable);
  return text;
}
