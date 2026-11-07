import { describe, expect, it } from 'vitest';
import type { AppError } from '../../lib/http';
import { parseExtractedProfile } from './extract';

const json = (value: unknown) => JSON.stringify(value);

function errorOf(jsonText: string): AppError {
  try {
    parseExtractedProfile(jsonText);
  } catch (error) {
    return error as AppError;
  }
  throw new Error('Expected parseExtractedProfile to throw');
}

describe('parseExtractedProfile', () => {
  it('accepts a complete profile', () => {
    const profile = parseExtractedProfile(
      json({
        hectares: 40,
        enterprise: 'suckler',
        marginalHectares: 3,
        nearWatercourse: true,
        missing: ['your age'],
      }),
    );
    expect(profile).toMatchObject({
      hectares: 40,
      enterprise: 'suckler',
      marginalHectares: 3,
      nearWatercourse: true,
    });
  });

  it('treats null as "not said", except for peat soil and designated site where null means unknown', () => {
    const profile = parseExtractedProfile(
      json({
        hectares: 40,
        enterprise: 'dairy',
        age: null,
        county: '',
        peatSoil: null,
        designatedSite: null,
        missing: [],
      }),
    );
    expect(profile.age).toBeUndefined();
    expect(profile.county).toBeUndefined();
    expect(profile.peatSoil).toBeNull();
    expect(profile.designatedSite).toBeNull();
  });

  it('continues when the farm size was not given', () => {
    for (const hectares of [0, null, undefined, 'forty']) {
      const profile = parseExtractedProfile(json({ hectares, enterprise: 'other', missing: [] }));
      expect(profile.hectares).toBeUndefined();
      expect(profile.missing).toContain('the size of the farm');
    }
  });

  it('drops wet land larger than the farm and asks about it instead', () => {
    const profile = parseExtractedProfile(
      json({ hectares: 10, enterprise: 'beef', marginalHectares: 25, missing: [] }),
    );
    expect(profile.marginalHectares).toBeUndefined();
    expect(profile.missing).toContain('how many hectares are wet or unused');
  });

  const unreadable: Array<[string, string]> = [
    ['text that is not JSON', 'Sure! Here is the profile'],
    ['a JSON array', '[1, 2]'],
    ['JSON null', 'null'],
    [
      'an enterprise that does not exist',
      json({ hectares: 5, enterprise: 'alpacas', missing: [] }),
    ],
  ];

  it.each(unreadable)('rejects %s with UPSTREAM_ERROR', (_name, text) => {
    expect(errorOf(text).code).toBe('UPSTREAM_ERROR');
  });
});
