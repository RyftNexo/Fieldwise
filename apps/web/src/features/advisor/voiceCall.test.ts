import { voiceCallFixtures } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { callView, failureText, isNotFound, nextPoll, POLL_MS, shouldRetry } from './voiceCall';

const SID = voiceCallFixtures.ringing.callSid;

describe('callView', () => {
  it('is idle before a call and ringing until the first poll answers', () => {
    expect(callView(null, undefined, null)).toBe('idle');
    expect(callView(SID, undefined, null)).toBe('ringing');
  });

  it('follows the state the API reports', () => {
    expect(callView(SID, voiceCallFixtures.ringing, null)).toBe('ringing');
    expect(callView(SID, voiceCallFixtures.pending, null)).toBe('pending');
    expect(callView(SID, voiceCallFixtures.done, null)).toBe('done');
    expect(callView(SID, voiceCallFixtures.failed, null)).toBe('failed');
  });

  it('treats a finished call without advice as failed', () => {
    const { advice: _advice, ...noAdvice } = voiceCallFixtures.done;
    expect(callView(SID, noAdvice, null)).toBe('failed');
  });

  it('is lost when the check fails, even after an earlier answer', () => {
    const notFound = new ApiError('NOT_FOUND', 'Unknown call', 404);
    expect(callView(SID, undefined, notFound)).toBe('lost');
    expect(callView(SID, voiceCallFixtures.pending, notFound)).toBe('lost');
  });
});

describe('nextPoll', () => {
  it('polls every two seconds while the call is ringing or being checked', () => {
    expect(nextPoll(undefined, false)).toBe(POLL_MS);
    expect(nextPoll('ringing', false)).toBe(POLL_MS);
    expect(nextPoll('pending', false)).toBe(POLL_MS);
    expect(POLL_MS).toBe(2000);
  });

  it('stops once the call is done or failed, or the check failed', () => {
    expect(nextPoll('done', false)).toBe(false);
    expect(nextPoll('failed', false)).toBe(false);
    expect(nextPoll('pending', true)).toBe(false);
  });
});

describe('shouldRetry', () => {
  it('never retries a 4xx, so an unknown call stops at once', () => {
    expect(shouldRetry(0, new ApiError('NOT_FOUND', 'Unknown call', 404))).toBe(false);
    expect(shouldRetry(0, new ApiError('VALIDATION_ERROR', 'Bad input', 400))).toBe(false);
  });

  it('retries a dropped connection or a server error twice', () => {
    const offline = new ApiError('NETWORK_ERROR', 'Cannot reach the API', 0);
    expect(shouldRetry(0, offline)).toBe(true);
    expect(shouldRetry(1, offline)).toBe(true);
    expect(shouldRetry(2, offline)).toBe(false);
    expect(shouldRetry(0, new ApiError('UPSTREAM_ERROR', 'Twilio failed', 502))).toBe(true);
  });
});

describe('isNotFound', () => {
  it('is true only for a 404 from the API', () => {
    expect(isNotFound(new ApiError('NOT_FOUND', 'Unknown call', 404))).toBe(true);
    expect(isNotFound(new ApiError('NETWORK_ERROR', 'Offline', 0))).toBe(false);
    expect(isNotFound(new Error('boom'))).toBe(false);
  });
});

describe('failureText', () => {
  it("uses the API's own words", () => {
    expect(failureText(voiceCallFixtures.failed)).toBe(voiceCallFixtures.failed.failure);
  });

  it('falls back to a plain reason', () => {
    const { failure: _failure, ...silent } = voiceCallFixtures.failed;
    expect(failureText(silent)).toBe('The call did not go through. Please try again.');
    expect(failureText({ ...silent, failure: '  ' })).toBe(
      'The call did not go through. Please try again.',
    );
    const { advice: _advice, ...noAdvice } = voiceCallFixtures.done;
    expect(failureText(noAdvice)).toBe(
      'The call ended before we had your results. Please try again.',
    );
  });
});
