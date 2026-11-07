import { AdviceResponse, farmProfileFixtures } from '@app/shared';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../lib/http';
import { adviseFromText, type PipelineSteps } from './pipeline';

const steps = (overrides: Partial<PipelineSteps> = {}): PipelineSteps => ({
  extract: vi.fn(async () => farmProfileFixtures.declan),
  explain: vi.fn(async () => ({ summary: 'Gemini wrote this.', method: 'gemini' as const })),
  ...overrides,
});

describe('adviseFromText', () => {
  it('runs extract → rules → explain and returns advice that matches the contract', async () => {
    const advice = await adviseFromText('my farm', steps());
    expect(() => AdviceResponse.parse(advice)).not.toThrow();
    expect(advice.summary).toBe('Gemini wrote this.');
    expect(advice.mode).toBe('live');
    expect(advice.matches[0]?.schemeId).toBe('ntas');
  });

  it('computes the matches in code from the extracted profile, not from the model', async () => {
    const explain = vi.fn(async () => ({ summary: 'Fine.', method: 'gemini' as const }));
    const advice = await adviseFromText('my farm', steps({ explain }));
    expect(explain).toHaveBeenCalledWith(farmProfileFixtures.declan, advice.matches);
  });

  it('reports which method wrote each step, for the stepper', async () => {
    const advice = await adviseFromText('my farm', steps());
    expect(advice.steps.extract).toMatchObject({ method: 'gemini' });
    expect(advice.steps.explain).toEqual({ method: 'gemini' });
  });

  it('records why the template summary was used', async () => {
    const explain = vi.fn(async () => ({
      summary: 'Template.',
      method: 'template' as const,
      fallbackReason: 'empty',
    }));
    const advice = await adviseFromText('my farm', steps({ explain }));
    expect(advice.summary).toBe('Template.');
    expect(advice.steps.explain).toEqual({ method: 'template', fallbackReason: 'empty' });
  });

  it('lets an extraction failure through so the farmer can retry', async () => {
    const extract = vi.fn(async () => {
      throw new AppError('UPSTREAM_ERROR', 'The advice service did not respond.');
    });
    await expect(adviseFromText('my farm', steps({ extract }))).rejects.toMatchObject({
      code: 'UPSTREAM_ERROR',
    });
  });
});
