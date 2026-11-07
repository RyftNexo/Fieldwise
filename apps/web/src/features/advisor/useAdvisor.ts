import { endpoints } from '@app/shared';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { call } from '@/api/client';
import { RULES_STAGE_MIN_MS } from './agentFlow';
import { isPipelineStage, PIPELINE_STAGES, type Stage } from './pipeline';

/** While C-03 is working we can't see inside it, so the stepper moves on a schedule… */
const STAGE_AFTER_MS = [0, 1500, 3000];
/** …and when the answer comes back early, every remaining stage still shows for a moment. */
const MIN_STAGE_MS = 400;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Sends one question through Extract → Rules → Explain (C-03, one request) and tracks which stage to show.
 * The raw JSON for each stage comes back in `steps` for the stepper to display.
 */
export function useAdvisor() {
  const [stage, setStage] = useState<Stage>('idle');
  // Each question gets a run number, so a slow earlier run can never overwrite a newer one.
  const latestRun = useRef(0);

  const advice = useMutation({
    mutationFn: async ({ text, run }: { text: string; run: number }) => {
      let shown = -1;
      const show = (index: number) => {
        const next = PIPELINE_STAGES[index];
        if (index <= shown || !next) return;
        shown = index;
        if (latestRun.current === run) setStage(next);
      };
      const timers = STAGE_AFTER_MS.map((ms, index) => setTimeout(() => show(index), ms));
      try {
        const result = await call(endpoints.advice, { body: { text } });
        for (let index = shown + 1; index < PIPELINE_STAGES.length; index += 1) {
          const next = PIPELINE_STAGES[index];
          show(index);
          await wait(next === 'rules' ? RULES_STAGE_MIN_MS : MIN_STAGE_MS);
        }
        return result;
      } finally {
        for (const timer of timers) clearTimeout(timer);
      }
    },
    onSuccess: (_data, { run }) => {
      if (latestRun.current === run) setStage('done');
    },
    onError: (_error, { run }) => {
      if (latestRun.current === run) setStage('error');
    },
  });

  return {
    stage,
    result: stage === 'done' ? advice.data : undefined,
    error: advice.error,
    isRunning: isPipelineStage(stage),
    ask(text: string) {
      latestRun.current += 1;
      advice.mutate({ text, run: latestRun.current });
    },
    reset() {
      latestRun.current += 1;
      advice.reset();
      setStage('idle');
    },
  };
}
