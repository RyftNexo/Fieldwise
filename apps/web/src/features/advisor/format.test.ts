import { describe, expect, it } from 'vitest';
import { formatDate, formatEuro, formatHectares, formatTimeAgo } from './format';

describe('formatTimeAgo', () => {
  const now = Date.parse('2026-11-07T13:00:00Z');

  it('says how long ago, in words a farmer or forester would use', () => {
    expect(formatTimeAgo('2026-11-07T12:59:30Z', now)).toBe('just now');
    expect(formatTimeAgo('2026-11-07T12:35:00Z', now)).toBe('25 minutes ago');
    expect(formatTimeAgo('2026-11-07T11:00:00Z', now)).toBe('2 hours ago');
  });

  it('falls back to the date after a day', () => {
    expect(formatTimeAgo('2026-11-04T13:00:00Z', now)).toBe('4 November 2026');
  });
});

describe('formatEuro', () => {
  it('formats whole euros the Irish way', () => {
    expect(formatEuro(44_900)).toBe('€44,900');
  });

  it('rounds to the nearest euro', () => {
    expect(formatEuro(22_059.6)).toBe('€22,060');
  });
});

describe('formatDate', () => {
  it('formats an ISO date without shifting the day', () => {
    expect(formatDate('2027-05-15')).toBe('15 May 2027');
  });
});

describe('formatHectares', () => {
  it('drops the decimals for whole hectares and keeps one otherwise', () => {
    expect(formatHectares(40)).toBe('40 ha');
    expect(formatHectares(2.5)).toBe('2.5 ha');
  });
});
