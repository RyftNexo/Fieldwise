import { ArrowDown, ArrowRight } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const logicSteps = [
  { label: 'Hear', code: 'speech → words' },
  { label: 'Read', code: 'extractProfile()' },
  { label: 'Rules', code: 'evaluateProfile()' },
  { label: 'Match', code: 'keep yes, likely' },
  { label: 'Speak', code: 'say(grants)' },
] as const;

const stepMs = 2200;

type StepStatus = 'pending' | 'active' | 'done';

/** Five boxes, in order, while the call checks the schemes. The last box keeps flashing until the result arrives. */
export function LogicTrace() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current >= logicSteps.length - 1 ? current : current + 1));
    }, stepMs);
    return () => window.clearInterval(timer);
  }, []);

  const current = logicSteps[active];

  return (
    <section
      aria-labelledby="logic-trace-heading"
      className="overflow-hidden rounded-2xl border border-brand-800 bg-brand-950 text-cream-50 shadow-raised"
    >
      <div className="flex items-center gap-2 border-b border-brand-800 px-4 py-3">
        <span aria-hidden className="size-2.5 rounded-full bg-red-400" />
        <span aria-hidden className="size-2.5 rounded-full bg-harvest-400" />
        <span aria-hidden className="size-2.5 rounded-full bg-brand-400" />
        <span className="ml-2 font-mono text-xs text-brand-100">grant-guide.ts</span>
      </div>
      <h2 id="logic-trace-heading" className="px-4 pt-4 text-lg font-semibold text-cream-50">
        Looking through the check
      </h2>
      <p className="px-4 pt-1 text-sm text-brand-100">
        {current ? `Now: ${current.label}. ${current.code}` : 'Starting the check.'}
      </p>
      <ol className="flex flex-col gap-2 p-4 md:flex-row md:items-stretch md:gap-2">
        {logicSteps.map((step, index) => {
          const status: StepStatus =
            index < active ? 'done' : index === active ? 'active' : 'pending';
          return (
            <Fragment key={step.label}>
              <li
                className={cn(
                  'min-w-0 flex-1 rounded-xl border px-3 py-3',
                  status === 'done' && 'border-brand-400 bg-brand-900',
                  status === 'active' && 'logic-box-active border-harvest-300 bg-harvest-900/40',
                  status === 'pending' && 'border-brand-800 bg-brand-950/40 text-brand-200',
                )}
              >
                <p className="font-mono text-[0.7rem] text-brand-200">0{index + 1}</p>
                <p className="font-semibold text-cream-50">{step.label}</p>
                <p className="mt-1 truncate font-mono text-xs text-brand-100">{step.code}</p>
              </li>
              {index < logicSteps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'grid place-items-center text-harvest-300',
                    index === active && 'motion-safe:animate-pulse',
                  )}
                >
                  <ArrowDown className="size-5 md:hidden" />
                  <ArrowRight className="hidden size-5 md:block" />
                </span>
              )}
            </Fragment>
          );
        })}
      </ol>
    </section>
  );
}
