import { env } from '../../env';
import { explainMatches } from '../advice/explain';
import { extractProfile } from '../advice/extract';
import { adviseFromText } from '../advice/pipeline';
import { replayRecording } from '../advice/recordings';
import { scriptFromAdvice, spokenFailure } from './script';

interface VoiceJob {
  text: string;
  state: 'pending' | 'done' | 'failed';
  script?: string;
  failure?: string;
  controller: AbortController;
}

const jobs = new Map<string, VoiceJob>();

export function clearVoiceJobs(): void {
  for (const job of jobs.values()) job.controller.abort();
  jobs.clear();
}

export function voiceJob(callSid: string): VoiceJob | undefined {
  return jobs.get(callSid);
}

/** Stop a call that has waited long enough, and keep the fetch from running on. */
export function cancelVoiceJob(callSid: string, failure: string): void {
  const job = jobs.get(callSid);
  if (job?.state !== 'pending') return;
  job.controller.abort();
  job.state = 'failed';
  job.failure = failure;
}

/**
 * One advice run per call. A Twilio retry of the same transcript reuses the job
 * instead of starting a second model call.
 */
export function beginVoiceAdvice(callSid: string, text: string): VoiceJob {
  const current = jobs.get(callSid);
  if (current && current.text === text) return current;
  current?.controller.abort();

  const job: VoiceJob = { text, state: 'pending', controller: new AbortController() };
  jobs.set(callSid, job);
  void settle(job, text);
  return job;
}

async function settle(job: VoiceJob, text: string): Promise<void> {
  try {
    const advice =
      env.DEMO_MODE === 'fixtures'
        ? replayRecording(text)
        : await adviseFromText(text, {
            extract: (farmerText) => extractProfile(farmerText, job.controller.signal),
            explain: (profile, matches) => explainMatches(profile, matches, job.controller.signal),
          });
    if (job.state !== 'pending') return;
    job.script = scriptFromAdvice(advice);
    job.state = 'done';
  } catch (error) {
    if (job.state !== 'pending') return;
    console.error('voice advice failed');
    job.failure = spokenFailure(error);
    job.state = 'failed';
  }
}
