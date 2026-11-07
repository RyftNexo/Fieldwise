import type { AdviceResponse, GrantMatch } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { scriptFromAdvice } from './script';

function advice(matches: Array<Pick<GrantMatch, 'shortName' | 'eligible'>>): AdviceResponse {
  return { matches } as AdviceResponse;
}

describe('scriptFromAdvice', () => {
  it('names the grants that look available, then says goodbye', () => {
    const spoken = scriptFromAdvice(
      advice([
        { shortName: 'NTAS', eligible: 'likely' },
        { shortName: 'BISS', eligible: 'yes' },
        { shortName: 'ACRES', eligible: 'check' },
      ]),
    );
    expect(spoken).toBe(
      'The grants that look available are NTAS and BISS. Thank you for your time. Call me back if you need anything else.',
    );
    const grantPart = spoken.split('Thank you')[0] ?? '';
    expect(grantPart.match(/[.!?]/gu)?.length ?? 0).toBeLessThanOrEqual(3);
  });

  it('does not invent a grant when none clearly fits', () => {
    const spoken = scriptFromAdvice(advice([{ shortName: 'ACRES', eligible: 'check' }]));
    expect(spoken.startsWith('I could not see a grant that clearly fits')).toBe(true);
    expect(spoken).not.toContain('ACRES');
    expect(spoken).toContain('Call me back if you need anything else.');
  });
});
