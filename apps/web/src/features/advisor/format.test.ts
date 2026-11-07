import { describe, expect, it } from 'vitest';
import { formatDate, formatEuro, formatHectares } from './format';

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
