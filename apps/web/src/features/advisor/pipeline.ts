/** Every question goes through these three stages. Only `rules` decides anything; it uses no AI. */
export const PIPELINE_STAGES = ['extract', 'rules', 'explain'] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/** UI state of the advisor page. */
export type Stage = 'idle' | PipelineStage | 'done' | 'error';

export function isPipelineStage(stage: Stage): stage is PipelineStage {
  return (PIPELINE_STAGES as readonly Stage[]).includes(stage);
}
