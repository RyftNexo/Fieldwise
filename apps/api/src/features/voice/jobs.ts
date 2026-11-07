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
  /** The latest utterance, so a Twilio retry does not start a second advice run. */
  lastSpeech: string;
  state: 'pending' | 'question' | 'done' | 'failed';
  /** How many answers we have already taken after a spoken question. */
  followUps: number;
  question?: string;
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
    state: job.state === 'question' ? 'pending' : job.state,
    transcript: job.text,
    ...(job.to !== undefined ? { to: job.to } : {}),
    ...(job.state === 'pending' && job.followUps > 0 ? { checking: true } : {}),
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

/** Asked after the first description, on every call. */
export const followUpQuestion = 'Anything else about the land, the animals, or where you farm?';

/**
 * The first description only stores the words and asks the follow-up.
 * The next thing the caller says is added on, and then the advice runs once.
 * A Twilio retry of the same transcript reuses the job.
 */
export function beginVoiceAdvice(callSid: string, text: string): VoiceJob {
  const current = jobs.get(callSid);
  const prior = current && current.state !== 'ringing' ? current : undefined;
  const to = prior?.to ?? (current?.state === 'ringing' ? current.to : undefined);

  if (prior && text.length >= 3 && text === prior.lastSpeech) return prior;

  if (prior?.state === 'question') {
    const textForJob = text.length >= 3 ? `${prior.text}\n${text}` : prior.text;
    return startAdvice(callSid, to, textForJob, text.length >= 3 ? text : prior.lastSpeech);
  }

  if (!prior) return askFollowUp(callSid, to, text);

  if (prior.state === 'pending') prior.controller.abort();
  return startAdvice(callSid, to, text, text);
}

function askFollowUp(callSid: string, to: string | undefined, text: string): VoiceJob {
  const job: VoiceJob = {
    to,
    text,
    lastSpeech: text,
    state: 'question',
    followUps: 0,
    question: followUpQuestion,
    controller: new AbortController(),
  };
  jobs.set(callSid, job);
  return job;
}

function startAdvice(
  callSid: string,
  to: string | undefined,
  text: string,
  lastSpeech: string,
): VoiceJob {
  const job: VoiceJob = {
    to,
    text,
    lastSpeech,
    state: 'pending',
    followUps: 1,
    controller: new AbortController(),
  };
  jobs.set(callSid, job);
  void settle(job, text);
  return job;
}

/** Pause after the last answer so the page can show the check before anyone hears the result. */
export const voiceRevealMs = 12_000;

async function settle(job: VoiceJob, text: string): Promise<void> {
  const startedAt = Date.now();
  try {
    if (env.DEMO_MODE === 'fixtures') {
      const advice = replayRecording(text);
      // Tests read the result on the same turn. A real call waits so the page can show the check.
      if (process.env.VITEST) {
        finish(job, advice);
        return;
      }
      await waitForReveal(startedAt, job.controller.signal);
      finish(job, advice);
      return;
    }
    const advice = await adviseFromText(text, {
      extract: (farmerText) => extractProfile(farmerText, job.controller.signal),
      explain: (profile, matches) => explainMatches(profile, matches, job.controller.signal),
    });
    await waitForReveal(startedAt, job.controller.signal);
    finish(job, advice);
  } catch (error) {
    if (job.state !== 'pending') return;
    console.error('voice advice failed');
    job.failure = spokenFailure(error);
    job.state = 'failed';
  }
}

function finish(job: VoiceJob, advice: AdviceResponse): void {
  if (job.state !== 'pending') return;
  job.advice = advice;
  job.script = scriptFromAdvice(advice);
  job.state = 'done';
}

function waitForReveal(startedAt: number, signal: AbortSignal): Promise<void> {
  if (process.env.VITEST) return Promise.resolve();
  const remaining = voiceRevealMs - (Date.now() - startedAt);
  if (remaining <= 0 || signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, remaining);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
