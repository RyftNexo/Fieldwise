import { describe, expect, it } from 'vitest';
import {
  buildPath,
  endpoints,
  RingVoiceInput,
  ringVoiceInputFixture,
  ringVoiceResponseFixture,
  VoiceCall,
  voiceCallFixtures,
} from './index';

describe('voice JSON contracts', () => {
  it('registers the agreed routes and validates ring fixtures', () => {
    expect(endpoints.ringVoiceCall.id).toBe('C-08');
    expect(endpoints.ringVoiceCall.method).toBe('POST');
    expect(endpoints.ringVoiceCall.path).toBe('/api/voice/ring');
    expect(endpoints.ringVoiceCall.request?.parse(ringVoiceInputFixture)).toEqual(
      ringVoiceInputFixture,
    );
    expect(endpoints.ringVoiceCall.response.parse(ringVoiceResponseFixture)).toEqual(
      ringVoiceResponseFixture,
    );
    expect(endpoints.getVoiceCall.id).toBe('C-09');
    expect(endpoints.getVoiceCall.method).toBe('GET');
    expect(buildPath(endpoints.getVoiceCall.path, { callSid: 'CA/test' })).toBe(
      '/api/voice/calls/CA%2Ftest',
    );
  });
  it('accepts all four call states and optional fields without inventing advice', () => {
    for (const fixture of Object.values(voiceCallFixtures)) {
      expect(endpoints.getVoiceCall.response.parse(fixture)).toEqual(fixture);
    }
    expect(VoiceCall.parse({ callSid: 'CA-test', state: 'ringing' })).not.toHaveProperty('advice');
    expect(VoiceCall.parse({ callSid: 'CA-test', state: 'pending', checking: true }).checking).toBe(
      true,
    );
    expect(RingVoiceInput.parse({ to: ' 087 000 0000 ' }).to).toBe('087 000 0000');
  });
  it('rejects blank destinations, invalid states and malformed nested advice', () => {
    expect(RingVoiceInput.safeParse({ to: '  ' }).success).toBe(false);
    expect(VoiceCall.safeParse({ callSid: '', state: 'ringing' }).success).toBe(false);
    expect(VoiceCall.safeParse({ callSid: 'CA-test', state: 'completed' }).success).toBe(false);
    expect(
      VoiceCall.safeParse({ ...voiceCallFixtures.done, advice: { summary: 'invalid' } }).success,
    ).toBe(false);
    expect(VoiceCall.safeParse({ ...voiceCallFixtures.ringing, advice: null }).success).toBe(false);
  });
});
