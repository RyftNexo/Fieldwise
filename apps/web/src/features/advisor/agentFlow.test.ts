import { describe, expect, it } from 'vitest';
import {
  agentEdgeStatus,
  agentNodeStatuses,
  RULES_STAGE_MIN_MS,
  SCHEME_DATASETS,
  SCHEME_STEP_MS,
} from './agentFlow';

describe('agent flow progress', () => {
  it('shows every dataset evaluated by the rules engine', () => {
    expect(SCHEME_DATASETS.map((scheme) => scheme.id)).toEqual([
      'ntas',
      'anc',
      'biss',
      'acres',
      'scis',
      'awnss',
    ]);
    expect(RULES_STAGE_MIN_MS).toBeGreaterThan(SCHEME_DATASETS.length * SCHEME_STEP_MS);
  });

  it('moves from the farmer into the AI understanding step', () => {
    const statuses = agentNodeStatuses('extract');
    expect(statuses.farmer).toBe('done');
    expect(statuses.understand).toBe('active');
    expect(agentEdgeStatus('farmer', 'understand', statuses)).toBe('active');
    expect(statuses.profile).toBe('pending');
  });

  it('lights scheme datasets one after another during the rules stage', () => {
    const first = agentNodeStatuses('rules', 0);
    expect(first.ntas).toBe('active');
    expect(first.anc).toBe('pending');

    const fourth = agentNodeStatuses('rules', 3);
    expect(fourth.ntas).toBe('done');
    expect(fourth.biss).toBe('done');
    expect(fourth.acres).toBe('active');
    expect(fourth.scis).toBe('pending');
  });

  it('keeps every visited node solid when the report is ready', () => {
    expect(new Set(Object.values(agentNodeStatuses('done')))).toEqual(new Set(['done']));
  });
});
