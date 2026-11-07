import {
  CircleCheck,
  LoaderCircle,
  type LucideIcon,
  MessageSquareText,
  Scale,
  ScanText,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PIPELINE_STAGES, type PipelineStage, type Stage } from './pipeline';
import type { AdviceResponse } from './types';

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

/** Extract → Rules → Explain. Once the answer is in, each step opens to show its raw JSON. */
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
    <section
      aria-labelledby="pipeline-heading"
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2
        id="pipeline-heading"
        className="text-sm font-semibold tracking-wide text-stone-500 uppercase"
      >
        How we work it out
      </h2>
      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
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
                  'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-default',
                  status === 'pending' && 'border-dashed border-stone-200',
                  status === 'active' && 'border-brand-300 bg-brand-50',
                  status === 'done' && 'border-stone-200 hover:border-brand-300 hover:bg-brand-50',
                  isOpen && 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20',
                )}
              >
                <StepIcon status={status} Icon={info.Icon} />
                <span className="min-w-0">
                  <span
                    className={cn(
                      'flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold',
                      status === 'pending' ? 'text-stone-400' : 'text-stone-900',
                    )}
                  >
                    <span className="sr-only">{STATUS_TEXT[status]}</span>
                    {info.title}
                    <AiTag ai={info.ai} />
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block text-sm',
                      status === 'pending' ? 'text-stone-400' : 'text-stone-600',
                    )}
                  >
                    {info.detail}
                  </span>
                  {canOpen && (
                    <span className="mt-1 block text-xs font-semibold text-brand-700">
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
          className="mt-3 max-h-80 overflow-auto rounded-xl bg-stone-900 p-4 text-xs leading-relaxed text-stone-100"
        >
          {JSON.stringify(steps[openStep], null, 2)}
        </pre>
      )}
    </section>
  );
}

function StepIcon({ status, Icon }: { status: StepStatus; Icon: LucideIcon }) {
  if (status === 'done') {
    return <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />;
  }
  if (status === 'active') {
    return (
      <LoaderCircle
        className="mt-0.5 size-5 shrink-0 text-brand-600 motion-safe:animate-spin"
        aria-hidden
      />
    );
  }
  return <Icon className="mt-0.5 size-5 shrink-0 text-stone-300" aria-hidden />;
}

function AiTag({ ai }: { ai: boolean }) {
  return ai ? (
    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
      AI
    </span>
  ) : (
    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
      No AI
    </span>
  );
}
