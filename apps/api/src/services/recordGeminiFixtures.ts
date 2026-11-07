// Re-record the offline demo fixtures from real Gemini replies. Needs GEMINI_API_KEY in apps/api/.env.
// Run from apps/api:  npx tsx src/services/recordGeminiFixtures.ts
// It rewrites src/features/advice/geminiRecordings.json. Review the diff before committing.
import { writeFileSync } from 'node:fs';
import type { AdviceResponse } from '@app/shared';
import { adviseFromText } from '../features/advice/pipeline';
import { loadRecordings, type Recording, recordingsFile } from '../features/advice/recordings';

// The free tier allows few requests a day, so do not retry many times.
const attemptsPerExample = 2;
const waitBetweenAttemptsMs = 20_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Gemini's free tier rate-limits quickly, so wait and try again before giving up on an example. */
async function adviseWithGemini(recording: Recording): Promise<AdviceResponse> {
  for (let attempt = 1; ; attempt++) {
    try {
      const advice = await adviseFromText(recording.text);
      const explain = advice.steps.explain as { method?: string };
      // Never store a template summary as if Gemini wrote it.
      if (explain.method !== 'gemini')
        throw new Error(`summary rejected: ${JSON.stringify(explain)}`);
      return advice;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (attempt >= attemptsPerExample)
        throw new Error(`${recording.id}: gave up after ${attempt} tries (${reason})`);
      console.log(
        `  ${recording.id}: attempt ${attempt} failed (${reason}). Waiting ${waitBetweenAttemptsMs / 1000}s…`,
      );
      await sleep(waitBetweenAttemptsMs);
    }
  }
}

const recorded: Recording[] = [];

for (const recording of loadRecordings()) {
  console.log(`Recording ${recording.id}…`);
  const advice = await adviseWithGemini(recording);
  recorded.push({
    ...recording,
    source: 'gemini',
    profile: advice.profile,
    summary: advice.summary,
  });
}

writeFileSync(recordingsFile, `${JSON.stringify(recorded, null, 2)}\n`);
console.log(`Wrote ${recorded.length} recordings.`);
