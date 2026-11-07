import { toE164 } from './phone';

/** How long after a ring before another one may reach Twilio. */
export const ringMinGapMs = 15_000;
/** How many rings one minute may send to Twilio. */
export const ringMaxPerWindow = 3;
export const ringWindowMs = 60_000;

const attempts: number[] = [];

export function clearRingAttempts(): void {
  attempts.length = 0;
}

/** Numbers Ring is allowed to dial. Commas separate more than one. */
export function ringAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  const numbers = raw.split(',').map((part) => toE164(part.trim()));
  return numbers.filter((number): number is string => number !== undefined);
}

export type RingCheck = 'allowed' | 'not-listed' | 'too-soon';

/** Decide before any Twilio request. Repeats inside the gap or over the minute cap are `too-soon`. */
export function checkRing(to: string, allowed: readonly string[], now: number): RingCheck {
  if (!allowed.includes(to)) return 'not-listed';
  const recent = attempts.filter((at) => now - at < ringWindowMs);
  const last = recent.at(-1);
  if (recent.length >= ringMaxPerWindow) return 'too-soon';
  if (last !== undefined && now - last < ringMinGapMs) return 'too-soon';
  return 'allowed';
}

/** Count a ring that is about to be sent. Call this only after `checkRing` returns allowed. */
export function recordRing(now: number): void {
  attempts.push(now);
}
