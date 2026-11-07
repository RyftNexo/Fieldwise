import type { VoiceCall, VoiceCallState } from '@app/shared';
import { ApiError } from '@/api/client';

/** How often the page asks the API how the call is going (C-09). */
export const POLL_MS = 2000;

/** What the page shows: nothing placed yet, one of the API's four call states, or "lost" when we can't check it. */
export type CallView = 'idle' | VoiceCallState | 'lost';

function isFinished(state?: VoiceCallState): boolean {
  return state === 'done' || state === 'failed';
}

/** Ask again every two seconds until the call is done or failed, or the check itself has failed. */
export function nextPoll(state: VoiceCallState | undefined, checkFailed: boolean): number | false {
  return checkFailed || isFinished(state) ? false : POLL_MS;
}

/** An unknown call (404) or any other 4xx won't change by asking again; a dropped connection might. */
export function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/**
 * One view per moment of the call. A call that was just placed counts as ringing until the first poll answers,
 * and "done" without advice counts as failed, so the farmer always ends up with either results or a reason.
 */
export function callView(
  callSid: string | null,
  call: VoiceCall | undefined,
  checkError: unknown,
): CallView {
  if (!callSid) return 'idle';
  if (checkError) return 'lost';
  if (!call) return 'ringing';
  if (call.state === 'done' && !call.advice) return 'failed';
  return call.state;
}

/** Why a call failed: the API's own words when it sent some. */
export function failureText(call?: VoiceCall): string {
  if (call?.state === 'done' && !call.advice) {
    return 'The call ended before we had your results. Please try again.';
  }
  return call?.failure?.trim() || 'The call did not go through. Please try again.';
}
