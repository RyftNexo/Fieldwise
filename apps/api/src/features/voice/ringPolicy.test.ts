import { afterEach, describe, expect, it } from 'vitest';
import {
  checkRing,
  clearRingAttempts,
  recordRing,
  ringAllowlist,
  ringMaxPerWindow,
  ringMinGapMs,
} from './ringPolicy';

const allowed = ['+353871234567'];

afterEach(() => {
  clearRingAttempts();
});

describe('ring allowlist', () => {
  it('keeps only dialable numbers from the configured list', () => {
    expect(ringAllowlist('087 123 4567, +353861234567, nope')).toEqual([
      '+353871234567',
      '+353861234567',
    ]);
    expect(ringAllowlist(undefined)).toEqual([]);
  });

  it('refuses a destination that is not on the list', () => {
    expect(checkRing('+353831111111', allowed, 1_000)).toBe('not-listed');
    expect(checkRing('+353871234567', [], 1_000)).toBe('not-listed');
  });

  it('refuses another ring inside the gap and after the minute cap', () => {
    expect(checkRing('+353871234567', allowed, 0)).toBe('allowed');
    recordRing(0);
    expect(checkRing('+353871234567', allowed, ringMinGapMs - 1)).toBe('too-soon');
    expect(checkRing('+353871234567', allowed, ringMinGapMs)).toBe('allowed');

    clearRingAttempts();
    for (let index = 0; index < ringMaxPerWindow; index += 1) {
      recordRing(index * ringMinGapMs);
    }
    expect(checkRing('+353871234567', allowed, ringMaxPerWindow * ringMinGapMs)).toBe('too-soon');
  });
});
