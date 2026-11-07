import { describe, expect, it } from 'vitest';
import { irishLocalDigits, isCompleteIrishMobile, toIrishE164 } from './contact';

describe('Irish mobile number helpers', () => {
  it('extracts the nine local digits from common formats', () => {
    expect(irishLocalDigits('087 123 4567')).toBe('871234567');
    expect(irishLocalDigits('+353 87 123 4567')).toBe('871234567');
    expect(irishLocalDigits('871234567')).toBe('871234567');
    expect(irishLocalDigits('0')).toBe('0');
    expect(irishLocalDigits('00')).toBe('00');
    expect(irishLocalDigits('871230456')).toBe('871230456');
  });

  it('accepts only complete Irish mobile numbers', () => {
    expect(isCompleteIrishMobile('087 123 4567')).toBe(true);
    expect(isCompleteIrishMobile('+353 87 123 4567')).toBe(true);
    expect(isCompleteIrishMobile('87123')).toBe(false);
    expect(isCompleteIrishMobile('021 456 7890')).toBe(false);
  });

  it('normalises a local number for the call API', () => {
    expect(toIrishE164('087 123 4567')).toBe('+353871234567');
    expect(toIrishE164('')).toBe('');
  });
});
