import { RotateCcw, Sprout } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { APP_TAGLINE } from '@/app/config';
import { Button } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { HillsArt } from '@/components/ui/HillsArt';
import { cn } from '@/lib/utils';
import { AskBox } from './AskBox';
import { ExamplePrompts } from './ExamplePrompts';
import { Landing } from './Landing';
import { PipelineStepper } from './PipelineStepper';
import type { Stage } from './pipeline';
import { Results } from './Results';
import { useAdvisor } from './useAdvisor';

const HERO_TITLE = "Find the farm grants you're missing";

const ANNOUNCEMENTS: Record<Stage, string> = {
  idle: '',
  extract: 'Reading your description…',
  rules: 'Checking the scheme rules…',
  explain: 'Writing your summary…',
  done: 'Your results are ready.',
  error: '',
};

export function AdvisorPage() {
  const [text, setText] = useState('');
  const advisor = useAdvisor();
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const isIdle = advisor.stage === 'idle';

  useEffect(() => {
    if (advisor.stage === 'done') resultsHeading.current?.focus();
  }, [advisor.stage]);

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || advisor.isRunning) return;
    setText(question);
    advisor.ask(trimmed);
  }

  function startAgain() {
    advisor.reset();
    setText('');
  }

  return (
    <div>
      <section
        aria-label="Describe your farm"
        className={cn(
          'relative overflow-hidden',
          isIdle ? 'pt-12 pb-20 sm:pt-20 sm:pb-28' : 'pt-6 pb-2 sm:pt-10',
        )}
      >
        {isIdle && (
          <HillsArt className="pointer-events-none absolute inset-x-0 bottom-0 h-44 w-full text-brand-600" />
        )}
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          {isIdle ? <Hero /> : <h1 className="sr-only">{HERO_TITLE}</h1>}
          <div className={isIdle ? 'mt-10 motion-safe:animate-rise' : undefined}>
            <AskBox value={text} onChange={setText} onSubmit={ask} busy={advisor.isRunning} />
          </div>
          {isIdle && <ExamplePrompts onPick={(prompt) => ask(prompt.text)} />}
        </div>
      </section>

      {isIdle ? (
        <Landing />
      ) : (
        <div className="mx-auto max-w-3xl space-y-8 px-4 pt-6 sm:px-6">
          {advisor.stage !== 'error' && (
            <PipelineStepper stage={advisor.stage} steps={advisor.result?.steps} />
          )}

          {advisor.stage === 'error' && (
            <ErrorPanel message={advisor.error?.message} onRetry={() => ask(text)} />
          )}

          {advisor.result && (
            <Results
              advice={advisor.result}
              headingRef={resultsHeading}
              onStartAgain={startAgain}
            />
          )}
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {ANNOUNCEMENTS[advisor.stage]}
      </p>
    </div>
  );
}

function Hero() {
  return (
    <header className="text-center">
      <p className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3.5 py-1.5 text-sm font-semibold text-brand-800 shadow-card ring-1 ring-brand-100">
        <Sprout className="size-4 text-brand-600" aria-hidden />
        For farmers in Ireland · free · no login
      </p>
      <h1 className="mt-6 text-4xl leading-[1.1] font-bold tracking-tight text-brand-900 sm:text-6xl">
        Find the farm grants you're{' '}
        <span className="underline decoration-harvest-300 decoration-[0.14em] underline-offset-[0.18em] [text-decoration-skip-ink:none]">
          missing
        </span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-soil-600 sm:text-xl">
        {APP_TAGLINE}
      </p>
    </header>
  );
}

function ErrorPanel({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className={cardClasses('surface', 'border-red-200 bg-red-50 p-6 text-red-900 shadow-none')}
    >
      <p className="font-display text-lg font-semibold">We couldn't check your grants just now.</p>
      <p className="mt-1">{message ?? 'Something went wrong. Please try again.'}</p>
      <Button variant="secondary" className="mt-4" onClick={onRetry}>
        <RotateCcw className="size-4" aria-hidden />
        Try again
      </Button>
    </div>
  );
}
