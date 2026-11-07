import type { AdviceResponse, VoiceCall } from '@app/shared';
import { env } from '../../env';
import { explainMatches } from '../advice/explain';
import { extractProfile } from '../advice/extract';
import { adviseFromText } from '../advice/pipeline';
import { replayRecording } from '../advice/recordings';
import { scriptFromAdvice, spokenFailure } from './script';

interface VoiceJob {
  to?: string;
  text: string;
  state: 'pending' | 'done' | 'failed';
  script?: string;
  failure?: string;
  advice?: AdviceResponse;
  controller: AbortController;
}

interface RingingCall {
  to: string;
  state: 'ringing';
}

type TrackedCall = VoiceJob | RingingCall;

const jobs = new Map<string, TrackedCall>();

export function clearVoiceJobs(): void {
  for (const job of jobs.values()) {
    if (job.state !== 'ringing') job.controller.abort();
  }
  jobs.clear();
}

/** Remember a call we placed, so the screen can poll before the caller has spoken. */
export function noteOutboundCall(callSid: string, to: string): void {
  if (jobs.has(callSid)) return;
  jobs.set(callSid, { to, state: 'ringing' });
}

export function voiceJob(callSid: string): VoiceJob | undefined {
  const job = jobs.get(callSid);
  if (!job || job.state === 'ringing') return undefined;
  return job;
}

/** What the web page renders while the phone call is in progress. Absent fields stay off the payload. */
export function voiceCallView(callSid: string): VoiceCall | undefined {
  const job = jobs.get(callSid);
  if (!job) return undefined;
  if (job.state === 'ringing') return { callSid, to: job.to, state: 'ringing' };
  return {
    callSid,
    state: job.state,
    transcript: job.text,
    ...(job.to !== undefined ? { to: job.to } : {}),
    ...(job.script !== undefined ? { script: job.script } : {}),
    ...(job.failure !== undefined ? { failure: job.failure } : {}),
    ...(job.advice !== undefined ? { advice: job.advice } : {}),
  };
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
  if (current && current.state !== 'ringing') {
    if (current.text === text) return current;
    current.controller.abort();
  }

  const job: VoiceJob = {
    to: current?.to,
    text,
    state: 'pending',
    controller: new AbortController(),
  };
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
    job.advice = advice;
    job.script = scriptFromAdvice(advice);
    job.state = 'done';
  } catch (error) {
    if (job.state !== 'pending') return;
    console.error('voice advice failed');
    job.failure = spokenFailure(error);
    job.state = 'failed';
  }
}
