import { AdviceResponse } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { summaryProblem, wordCount } from './explain';
import { findRecording, loadRecordings, replayRecording } from './recordings';
import { evaluateProfile } from './rules';

const recordings = loadRecordings();

describe('recordings', () => {
  it('has Declan, Aoife and Mary', () => {
    expect(recordings.map((recording) => recording.id)).toEqual(['declan', 'aoife', 'mary']);
  });

  it.each(recordings.map((recording) => [recording.id, recording] as const))(
    '%s: the recorded summary still agrees with today’s rules and is under 120 words',
    (_id, recording) => {
      // Fails when rates or rules change after recording: re-record with recordGeminiFixtures.ts.
      expect(summaryProblem(recording.summary, evaluateProfile(recording.profile))).toBeNull();
      expect(wordCount(recording.summary)).toBeLessThanOrEqual(120);
    },
  );
});

describe('findRecording', () => {
  it.each(recordings.map((recording) => [recording.id, recording.text] as const))(
    'finds %s by its exact example prompt',
    (id, text) => {
      expect(findRecording(text)?.id).toBe(id);
    },
  );

  it('ignores case and extra spaces', () => {
    expect(findRecording('  I HAVE a 40-hectare   suckler beef farm in West Cork.  ')?.id).toBe(
      'declan',
    );
  });

  it('finds the farmer by keyword when the words were spoken a little differently', () => {
    expect(findRecording('Hi, I am farming sheep down in Kerry and want a shed')?.id).toBe('mary');
  });

  it('returns null for a farm we have no recording for', () => {
    expect(findRecording('I grow potatoes in Wexford')).toBeNull();
  });
});

describe('replayRecording', () => {
  it('returns contract-valid advice in fixtures mode, with the rules run live', () => {
    const advice = replayRecording(recordings[0]?.text ?? '');
    expect(() => AdviceResponse.parse(advice)).not.toThrow();
    expect(advice.mode).toBe('fixtures');
    expect(advice.matches[0]?.value?.totalEur).toBe(58_388);
  });

  it('says plainly that only the examples work offline', () => {
    expect(() => replayRecording('I grow potatoes in Wexford')).toThrowError(/three example farms/);
  });
});
