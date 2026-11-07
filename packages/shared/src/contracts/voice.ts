import { z } from 'zod';
import { AdviceResponse } from './advice';
import { Id } from './common';

/** The API normalizes national/international input, then checks its demo allowlist. */
export const RingVoiceInput = z.object({ to: z.string().trim().min(1) });
export type RingVoiceInput = z.infer<typeof RingVoiceInput>;

export const RingVoiceResponse = z.object({ callSid: Id, to: z.string().min(1) });
export type RingVoiceResponse = z.infer<typeof RingVoiceResponse>;

export const VoiceCallState = z.enum(['ringing', 'pending', 'done', 'failed']);
export type VoiceCallState = z.infer<typeof VoiceCallState>;

/** Optional fields are absent until available; unknown calls return NOT_FOUND. */
export const VoiceCall = z.object({
  callSid: Id,
  to: z.string().min(1).optional(),
  state: VoiceCallState,
  transcript: z.string().optional(),
  script: z.string().optional(),
  failure: z.string().optional(),
  advice: AdviceResponse.optional(),
});
export type VoiceCall = z.infer<typeof VoiceCall>;
