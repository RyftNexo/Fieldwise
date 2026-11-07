import type { FarmProfile } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { evaluateAcres } from './acres';
import { evaluateAnc } from './anc';
import { evaluateBiss } from './biss';
import { evaluateInvestment } from './investment';
import { makeProfile } from './testProfiles';

describe('ANC', () => {
  const cases: Array<[string, Partial<FarmProfile>, boolean]> = [
    ['suckler farm', { enterprise: 'suckler' }, true],
    ['sheep farm', { enterprise: 'sheep' }, true],
    ['tillage farm (paid without the stocking rule)', { enterprise: 'tillage' }, true],
    ['enterprise not listed', { enterprise: 'other' }, false],
  ];

  it.each(cases)('%s → applies: %s', (_name, overrides, applies) => {
    expect(evaluateAnc(makeProfile(overrides)) !== null).toBe(applies);
  });

  it('never says better than "check", because designation is by townland', () => {
    expect(evaluateAnc(makeProfile({ county: 'Cork' }))?.eligible).toBe('check');
  });

  it('gives no euro total, since the land category is unknown', () => {
    expect(evaluateAnc(makeProfile())?.value).toBeUndefined();
  });

  it('warns a farmer who is not the active farmer', () => {
    const reasons = evaluateAnc(makeProfile({ activeFarmer: false }))?.reasons.join(' ');
    expect(reasons).toContain('active farmer');
  });
});

describe('BISS', () => {
  const cases: Array<[string, Partial<FarmProfile>, string]> = [
    ['active farmer not mentioned', {}, 'likely'],
    ['active farmer confirmed', { activeFarmer: true }, 'likely'],
    ['not the active farmer', { activeFarmer: false }, 'check'],
  ];

  it.each(cases)('%s → %s', (_name, overrides, expected) => {
    expect(evaluateBiss(makeProfile(overrides)).eligible).toBe(expected);
  });

  it('gives no euro total, since entitlement values differ per farmer', () => {
    expect(evaluateBiss(makeProfile()).value).toBeUndefined();
  });
});

describe('ACRES', () => {
  it('is always "check": we could not confirm that new entrants are being taken', () => {
    expect(evaluateAcres(makeProfile())?.eligible).toBe('check');
  });

  it('mentions buffer zones only when the land borders a watercourse', () => {
    const near = evaluateAcres(makeProfile({ nearWatercourse: true }))?.reasons.join(' ');
    const far = evaluateAcres(makeProfile())?.reasons.join(' ');
    expect(near).toContain('buffer zone');
    expect(far).not.toContain('buffer zone');
  });

  it('does not apply when the enterprise is not listed', () => {
    expect(evaluateAcres(makeProfile({ enterprise: 'other' }))).toBeNull();
  });
});

describe('investment schemes (unverified)', () => {
  const cases: Array<[string, Partial<FarmProfile>, string | null]> = [
    ['solar panels', { plannedInvestment: 'solar' }, 'scis'],
    ['a shed', { plannedInvestment: 'shed' }, 'awnss'],
    ['slurry storage', { plannedInvestment: 'slurry' }, 'awnss'],
    ['machinery', { plannedInvestment: 'machinery' }, null],
    ['no investment', { plannedInvestment: 'none' }, null],
    ['nothing mentioned', {}, null],
  ];

  it.each(cases)('%s → %s', (_name, overrides, schemeId) => {
    expect(evaluateInvestment(makeProfile(overrides))?.schemeId ?? null).toBe(schemeId);
  });

  it('says plainly that it has not verified the scheme, and gives no figure', () => {
    const match = evaluateInvestment(makeProfile({ plannedInvestment: 'solar' }));
    expect(match?.eligible).toBe('check');
    expect(match?.value).toBeUndefined();
    expect(match?.reasons.join(' ')).toContain('not verified');
  });
});
