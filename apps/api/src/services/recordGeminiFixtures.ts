// Re-record the offline demo fixtures from real Gemini replies. Needs GEMINI_API_KEY in apps/api/.env.
// Run from apps/api:  npx tsx src/services/recordGeminiFixtures.ts
// It rewrites src/features/advice/geminiRecordings.json. Review the diff before committing.
import { writeFileSync } from 'node:fs';
import { adviseFromText } from '../features/advice/pipeline';
import { loadRecordings, type Recording, recordingsFile } from '../features/advice/recordings';

const recorded: Recording[] = [];

for (const recording of loadRecordings()) {
  console.log(`Recording ${recording.id}…`);
  const advice = await adviseFromText(recording.text);
  const explainMethod = (advice.steps.explain as { method?: string }).method;
  if (explainMethod !== 'gemini') {
    // Do not store a template summary as if Gemini wrote it.
    throw new Error(
      `${recording.id}: Gemini's summary was rejected (${JSON.stringify(advice.steps.explain)})`,
    );
  }
  recorded.push({
    ...recording,
    source: 'gemini',
    profile: advice.profile,
    summary: advice.summary,
  });
}

writeFileSync(recordingsFile, `${JSON.stringify(recorded, null, 2)}\n`);
console.log(`Wrote ${recorded.length} recordings.`);
