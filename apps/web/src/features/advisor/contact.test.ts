import { describe, expect, it } from 'vitest';
import { isPlausiblePhone } from './contact';

describe('isPlausiblePhone', () => {
  it('accepts Irish numbers written the usual ways', () => {
    expect(isPlausiblePhone('087 123 4567')).toBe(true);
    expect(isPlausiblePhone('+353 87 123 4567')).toBe(true);
    expect(isPlausiblePhone('(021) 456-7890')).toBe(true);
  });

  it('rejects too few digits or words', () => {
    expect(isPlausiblePhone('')).toBe(false);
    expect(isPlausiblePhone('123')).toBe(false);
    expect(isPlausiblePhone('ring me')).toBe(false);
  });
});
