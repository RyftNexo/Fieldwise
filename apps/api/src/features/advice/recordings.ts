// DEMO_MODE=fixtures: replay recorded model replies so the demo works offline. Only the three example
// farmers are recorded. The rules still run live on the recorded profile, so figures are always current.
import { readFileSync } from 'node:fs';
import { type AdviceResponse, FarmProfile } from '@app/shared';
import { z } from 'zod';
import { AppError } from '../../lib/http';
import { buildRulesAdvice } from './rulesAdvice';

export const recordingsFile = new URL('./llmRecordings.json', import.meta.url);

const Recording = z.object({
  id: z.string().min(1),
  /** The exact example prompt that was recorded. */
  text: z.string().min(1),
  /** Lower-case words that identify this farmer when the text was edited or spoken slightly differently. */
  keywords: z.array(z.string().min(1)).min(1),
  /** 'handWritten' until `recordLlmFixtures.ts` replaces it with a real model reply. */
  source: z.enum(['handWritten', 'llm']),
  /** Which model wrote the recording (absent for handWritten ones). */
  model: z.string().min(1).optional(),
  profile: FarmProfile,
  summary: z.string().min(1),
});
export type Recording = z.infer<typeof Recording>;

export function loadRecordings(): Recording[] {
  return z.array(Recording).parse(JSON.parse(readFileSync(recordingsFile, 'utf8')));
}

const normalise = (text: string) => text.toLowerCase().replace(/\s+/gu, ' ').trim();

/** The recording that best fits the text: an exact match, otherwise the most keyword hits (at least one). */
export function findRecording(
  text: string,
  recordings: Recording[] = loadRecordings(),
): Recording | null {
  const wanted = normalise(text);
  const exact = recordings.find((recording) => normalise(recording.text) === wanted);
  if (exact) return exact;

  const scored = recordings
    .map((recording) => ({
      recording,
      hits: recording.keywords.filter((keyword) => wanted.includes(keyword)).length,
    }))
    .filter(({ hits }) => hits > 0)
    .sort((a, b) => b.hits - a.hits);
  return scored[0]?.recording ?? null;
}

export function replayRecording(text: string): AdviceResponse {
  const recording = findRecording(text);
  if (!recording) {
    throw new AppError(
      'UPSTREAM_ERROR',
      'The offline demo only knows the three example farms. Please pick one of the examples.',
    );
  }
  const advice = buildRulesAdvice(recording.profile);
  return {
    ...advice,
    summary: recording.summary,
    steps: {
      extract: {
        method: 'recording',
        recording: recording.id,
        source: recording.source,
        profile: recording.profile,
      },
      rules: advice.steps.rules,
      explain: { method: 'recording', recording: recording.id, source: recording.source },
    },
    mode: 'fixtures',
  };
}
