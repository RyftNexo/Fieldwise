import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { isPipelineStage, type Stage } from './pipeline';
import { getPreviewAdvice } from './preview';

/**
 * Sends one question through Extract → Rules → Explain and tracks which stage it is in.
 * Pre-contract (D1-04): answers come from local preview data. D1-02 swaps `getPreviewAdvice` for
 * `call(endpoints.…, { body: { text } })`, drops `isPreview`, and keeps the rest of this hook's shape.
 */
export function useAdvisor() {
  const [stage, setStage] = useState<Stage>('idle');
  // Each question gets a run number, so a slow earlier run can never overwrite a newer one.
  const latestRun = useRef(0);

  const advice = useMutation({
    mutationFn: ({ text, run }: { text: string; run: number }) =>
      getPreviewAdvice(text, (next) => {
        if (latestRun.current === run) setStage(next);
      }),
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
    isPreview: true,
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
