import { farmProfileFixtures } from '@app/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../lib/http';
import { callGemini } from '../../services/gemini';
import { euroFiguresIn, explainMatches, summaryProblem, wordCount } from './explain';
import { evaluateProfile } from './rules';

vi.mock('../../services/gemini', () => ({ callGemini: vi.fn() }));
const callGeminiMock = vi.mocked(callGemini);

const profile = farmProfileFixtures.declan;
const matches = evaluateProfile(profile);

beforeEach(() => {
  callGeminiMock.mockReset();
});

describe('euroFiguresIn', () => {
  it('reads figures with commas, decimals and a space after the sign', () => {
    expect(euroFiguresIn('Up to €58,388, or € 285, or €88.25 a hectare.')).toEqual([
      58_388, 285, 88.25,
    ]);
  });
});

describe('summaryProblem', () => {
  it('accepts a summary that only repeats figures the rules produced', () => {
    expect(summaryProblem('You could get up to €58,388 over 10 years.', matches)).toBeNull();
  });

  it('accepts figures quoted in the reasons, like the BISS entitlement limit', () => {
    expect(summaryProblem('No entitlement is above €285 in 2026.', matches)).toBeNull();
  });

  it('rejects an invented figure', () => {
    expect(summaryProblem('You could get €100,000 from NTAS.', matches)).toContain(
      'figure not from the rules',
    );
  });

  it('rejects an empty summary', () => {
    expect(summaryProblem('   ', matches)).toBe('empty');
  });

  it('rejects a summary over 120 words', () => {
    const long = Array.from({ length: 121 }, () => 'word').join(' ');
    expect(wordCount(long)).toBe(121);
    expect(summaryProblem(long, matches)).toContain('longer than 120 words');
  });
});

describe('explainMatches', () => {
  it('uses Gemini’s summary when it follows the rules', async () => {
    callGeminiMock.mockResolvedValue(
      '  Your wet land by the river is your best chance: up to €58,388 from NTAS.  ',
    );
    const result = await explainMatches(profile, matches);
    expect(result).toEqual({
      summary: 'Your wet land by the river is your best chance: up to €58,388 from NTAS.',
      method: 'gemini',
    });
  });

  it('sends the matches as data and keeps the rules in the system instruction', async () => {
    callGeminiMock.mockResolvedValue('Fine.');
    await explainMatches(profile, matches);
    const request = callGeminiMock.mock.calls[0]?.[0];
    expect(request?.userText).toContain('"shortName":"NTAS"');
    expect(request?.systemInstruction).toContain('never more than 120');
  });

  it('falls back to the template summary when Gemini invents a figure', async () => {
    callGeminiMock.mockResolvedValue('You will get €99,999.');
    const result = await explainMatches(profile, matches);
    expect(result.method).toBe('template');
    expect(result.fallbackReason).toContain('figure not from the rules');
    expect(result.summary).toContain('€58,388');
  });

  it('falls back to the template summary when Gemini fails, instead of failing the request', async () => {
    callGeminiMock.mockRejectedValue(
      new AppError('UPSTREAM_ERROR', 'The advice service did not respond.'),
    );
    const result = await explainMatches(profile, matches);
    expect(result.method).toBe('template');
    expect(result.fallbackReason).toBe('The advice service did not respond.');
  });
});
