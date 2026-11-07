import type {
  RingVoiceInput,
  RingVoiceResponse,
  VoiceCall,
  VoiceCallState,
} from '../contracts/voice';
import { adviceFixtures } from './advice';

/** Synthetic examples only; importing these fixtures never places a phone call. */
export const ringVoiceInputFixture: RingVoiceInput = { to: '+353870000000' };
export const ringVoiceResponseFixture: RingVoiceResponse = {
  callSid: 'CA00000000000000000000000000000001',
  to: ringVoiceInputFixture.to,
};
export const voiceCallFixtures: Record<VoiceCallState, VoiceCall> = {
  ringing: { ...ringVoiceResponseFixture, state: 'ringing' },
  pending: {
    ...ringVoiceResponseFixture,
    state: 'pending',
    transcript: 'A suckler farm in West Cork with wet land by a river.',
  },
  done: {
    ...ringVoiceResponseFixture,
    state: 'done',
    transcript: 'A suckler farm in West Cork with wet land by a river.',
    script: adviceFixtures.declan.summary,
    advice: adviceFixtures.declan,
  },
  failed: {
    ...ringVoiceResponseFixture,
    state: 'failed',
    failure: 'This is taking too long. Please call again in a moment.',
  },
};
