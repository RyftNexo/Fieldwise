import { describe, expect, it } from 'vitest';
import { toE164 } from './phone';

describe('toE164', () => {
  it('drops the Irish trunk 0 when the country code is added', () => {
    expect(toE164('087 123 4567')).toBe('+353871234567');
    expect(toE164('+353871234567')).toBe('+353871234567');
    expect(toE164('+353 087 123 4567')).toBe('+353871234567');
  });

  it('rejects a number that is too short to dial', () => {
    expect(toE164('123')).toBeUndefined();
    expect(toE164('not a phone')).toBeUndefined();
  });
});
