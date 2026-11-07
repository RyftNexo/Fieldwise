// C-03: Extract (LLM) → Rules (code) → Explain (LLM). The steps are injectable so tests never call the model.
import type { AdviceResponse, FarmProfile, GrantMatch } from '@app/shared';
import { env } from '../../env';
import { type ExplainResult, explainMatches } from './explain';
import { extractProfile } from './extract';
import { buildRulesAdvice } from './rulesAdvice';

export interface PipelineSteps {
  extract: (text: string) => Promise<FarmProfile>;
  explain: (profile: FarmProfile, matches: GrantMatch[]) => Promise<ExplainResult>;
}

const llmSteps: PipelineSteps = { extract: extractProfile, explain: explainMatches };

/** Farmer's words → full advice. Extract failures throw (the farmer must retry); explain failures degrade quietly. */
export async function adviseFromText(
  text: string,
  steps: PipelineSteps = llmSteps,
): Promise<AdviceResponse> {
  const profile = await steps.extract(text);
  const advice = buildRulesAdvice(profile);
  const explained = await steps.explain(profile, advice.matches);

  return {
    ...advice,
    summary: explained.summary,
    steps: {
      extract: { method: 'llm', model: env.OPENAI_MODEL, profile },
      rules: advice.steps.rules,
      explain: {
        method: explained.method,
        ...(explained.method === 'llm' && { model: env.OPENAI_MODEL }),
        ...(explained.fallbackReason && { fallbackReason: explained.fallbackReason }),
      },
    },
    mode: 'live',
  };
}
