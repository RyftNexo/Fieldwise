// Re-record the offline demo fixtures from real model replies. Needs OPENAI_API_KEY in apps/api/.env.
// Run from apps/api:  npx tsx src/services/recordLlmFixtures.ts
// It rewrites src/features/advice/llmRecordings.json. Review the diff before committing.
import { writeFileSync } from 'node:fs';
import type { AdviceResponse } from '@app/shared';
import { env } from '../env';
import { adviseFromText } from '../features/advice/pipeline';
import { loadRecordings, type Recording, recordingsFile } from '../features/advice/recordings';

// Keep retries low: a rejected summary is usually a prompt problem, and more attempts only spend credit.
const attemptsPerExample = 2;
const waitBetweenAttemptsMs = 20_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The API can rate-limit a burst of requests, so wait and try again before giving up on an example. */
async function adviseWithLlm(recording: Recording): Promise<AdviceResponse> {
  for (let attempt = 1; ; attempt++) {
    try {
      const advice = await adviseFromText(recording.text);
      const explain = advice.steps.explain as { method?: string };
      // Never store a template summary as if the model wrote it.
      if (explain.method !== 'llm') throw new Error(`summary rejected: ${JSON.stringify(explain)}`);
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
  const advice = await adviseWithLlm(recording);
  recorded.push({
    ...recording,
    source: 'llm',
    model: env.OPENAI_MODEL,
    profile: advice.profile,
    summary: advice.summary,
  });
}

writeFileSync(recordingsFile, `${JSON.stringify(recorded, null, 2)}\n`);
console.log(`Wrote ${recorded.length} recordings.`);
