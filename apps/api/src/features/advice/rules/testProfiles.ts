// Shared helper for the rules tests: a plain 40 ha suckler farm that tests change one field at a time.
import type { FarmProfile } from '@app/shared';

export function makeProfile(overrides: Partial<FarmProfile> = {}): FarmProfile {
  return { hectares: 40, enterprise: 'suckler', missing: [], ...overrides };
}
