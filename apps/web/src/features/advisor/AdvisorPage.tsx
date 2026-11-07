import { RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { APP_TAGLINE } from '@/app/config';
import { PreviewBanner } from '@/components/PreviewBanner';
import { AskBox } from './AskBox';
import { ExamplePrompts } from './ExamplePrompts';
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
    <div className="mx-auto max-w-3xl space-y-8">
      {isIdle ? <Hero /> : <h1 className="sr-only">{HERO_TITLE}</h1>}

      <AskBox value={text} onChange={setText} onSubmit={ask} busy={advisor.isRunning} />

      {isIdle && (
        <>
          <ExamplePrompts onPick={(prompt) => ask(prompt.text)} />
          <p className="mx-auto max-w-xl text-center text-sm text-pretty text-stone-500">
            The AI only reads your words and writes the summary. What you qualify for, and how much,
            is worked out by our rules engine from the scheme rules.
          </p>
        </>
      )}

      {!isIdle && advisor.stage !== 'error' && (
        <PipelineStepper stage={advisor.stage} steps={advisor.result?.steps} />
      )}

      {advisor.stage === 'error' && (
        <ErrorPanel message={advisor.error?.message} onRetry={() => ask(text)} />
      )}

      {advisor.result && (
        <>
          {advisor.isPreview && (
            <PreviewBanner>
              Until the advice API is connected, every question shows Declan's worked example, and
              the figures haven't been checked against gov.ie yet.
            </PreviewBanner>
          )}
          <Results advice={advisor.result} headingRef={resultsHeading} onStartAgain={startAgain} />
        </>
      )}

      <p aria-live="polite" className="sr-only">
        {ANNOUNCEMENTS[advisor.stage]}
      </p>
    </div>
  );
}

function Hero() {
  return (
    <header className="pt-2 text-center sm:pt-6">
      <p className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-800">
        For farmers in Ireland · free · no login
      </p>
      <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance text-stone-900 sm:text-5xl">
        {HERO_TITLE}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-pretty text-stone-600">{APP_TAGLINE}</p>
    </header>
  );
}

function ErrorPanel({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
      <p className="font-semibold">We couldn't check your grants just now.</p>
      <p className="mt-1 text-sm">{message ?? 'Something went wrong. Please try again.'}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-900 shadow-sm ring-1 ring-red-200 transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
      >
        <RotateCcw className="size-4" aria-hidden />
        Try again
      </button>
    </div>
  );
}
