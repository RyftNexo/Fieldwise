import type { AdviceResponse } from '@app/shared';
import {
  Check,
  LoaderCircle,
  type LucideIcon,
  MessageSquareText,
  Scale,
  ScanText,
} from 'lucide-react';
import { useState } from 'react';
import { Pill } from '@/components/ui/Badge';
import { cardClasses } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { PIPELINE_STAGES, type PipelineStage, type Stage } from './pipeline';

const STEP_INFO: Record<
  PipelineStage,
  { title: string; detail: string; Icon: LucideIcon; ai: boolean }
> = {
  extract: {
    title: 'Understand',
    detail: 'Gemini turns your words into farm details.',
    Icon: ScanText,
    ai: true,
  },
  rules: {
    title: 'Check the rules',
    detail: 'Our code checks every scheme and does the maths.',
    Icon: Scale,
    ai: false,
  },
  explain: {
    title: 'Explain',
    detail: 'Gemini writes up the results in plain English.',
    Icon: MessageSquareText,
    ai: true,
  },
};

const PANEL_ID = 'pipeline-step-data';

type StepStatus = 'pending' | 'active' | 'done';

function statusOf(step: PipelineStage, stage: Stage): StepStatus {
  if (stage === 'done') return 'done';
  const current = (PIPELINE_STAGES as readonly Stage[]).indexOf(stage);
  const index = PIPELINE_STAGES.indexOf(step);
  if (current === -1 || index > current) return 'pending';
  return index === current ? 'active' : 'done';
}

const STATUS_TEXT: Record<StepStatus, string> = {
  pending: 'Waiting: ',
  active: 'Working: ',
  done: 'Done: ',
};

/** Extract → Rules → Explain as a progress track. Once the answer is in, each step opens to show its raw JSON. */
export function PipelineStepper({
  stage,
  steps,
}: {
  stage: Stage;
  steps?: AdviceResponse['steps'];
}) {
  const [open, setOpen] = useState<PipelineStage | null>(null);
  const openStep = stage === 'done' && steps ? open : null;

  return (
    <section aria-labelledby="pipeline-heading" className={cardClasses('surface', 'p-5 sm:p-6')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="pipeline-heading" className="text-lg font-semibold text-brand-900">
          How we're working it out
        </h2>
        {stage === 'done' && steps && (
          <p className="text-sm text-soil-500">Tap a step to see its data</p>
        )}
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-3">
        {PIPELINE_STAGES.map((step) => {
          const info = STEP_INFO[step];
          const status = statusOf(step, stage);
          const canOpen = status === 'done' && steps !== undefined;
          const isOpen = openStep === step;
          return (
            <li key={step} className="flex">
              <button
                type="button"
                disabled={!canOpen}
                aria-expanded={canOpen ? isOpen : undefined}
                aria-controls={canOpen ? PANEL_ID : undefined}
                onClick={() => setOpen(isOpen ? null : step)}
                className={cn(
                  'focus-ring flex w-full items-start gap-3 rounded-2xl p-3 text-left transition duration-200 disabled:cursor-default',
                  status === 'active' && 'bg-harvest-50',
                  canOpen && 'cursor-pointer hover:bg-brand-50',
                  isOpen && 'bg-brand-50 ring-2 ring-brand-200',
                )}
              >
                <span
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-full ring-4 transition duration-200',
                    status === 'done' && 'bg-brand-700 text-white ring-brand-100',
                    status === 'active' && 'bg-harvest-300 text-harvest-900 ring-harvest-100',
                    status === 'pending' && 'bg-soil-100 text-soil-400 ring-soil-50',
                  )}
                >
                  {status === 'done' ? (
                    <Check className="size-5" aria-hidden />
                  ) : status === 'active' ? (
                    <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden />
                  ) : (
                    <info.Icon className="size-5" aria-hidden />
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold',
                      status === 'pending' ? 'text-soil-500' : 'text-soil-900',
                    )}
                  >
                    <span className="sr-only">{STATUS_TEXT[status]}</span>
                    {info.title}
                    <Pill tone={info.ai ? 'ai' : 'code'}>{info.ai ? 'AI' : 'No AI'}</Pill>
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block text-sm leading-snug',
                      status === 'pending' ? 'text-soil-500' : 'text-soil-600',
                    )}
                  >
                    {info.detail}
                  </span>
                  {canOpen && (
                    <span className="mt-1 block text-sm font-semibold text-brand-700">
                      {isOpen ? 'Hide the data' : 'See the data'}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {openStep && steps && (
        <pre
          id={PANEL_ID}
          className="mt-4 max-h-80 overflow-auto rounded-2xl bg-brand-950 p-4 font-mono text-xs leading-relaxed text-brand-100"
        >
          {JSON.stringify(steps[openStep], null, 2)}
        </pre>
      )}
    </section>
  );
}
