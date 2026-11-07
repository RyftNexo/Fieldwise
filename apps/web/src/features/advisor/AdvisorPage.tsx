import { RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { APP_DESCRIPTION, APP_TAGLINE } from '@/app/config';
import { Button } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { AgentFlowGraph } from './AgentFlowGraph';
import { AskBox } from './AskBox';
import { CallBox } from './CallBox';
import { CallStatus } from './CallStatus';
import { ExamplePrompts } from './ExamplePrompts';
import { Landing } from './Landing';
import { LogicTrace } from './LogicTrace';
import type { Stage } from './pipeline';
import { Results } from './Results';
import { useAdvisor } from './useAdvisor';
import { useVoiceCall } from './useVoiceCall';
import type { CallView } from './voiceCall';

const HERO_TITLE = "Find the farm grants you're missing";

const ANNOUNCEMENTS: Record<Stage, string> = {
  idle: '',
  extract: 'Reading your description…',
  rules: 'Checking the scheme rules…',
  explain: 'Writing your summary…',
  done: 'Your results are ready.',
  error: '',
};

/** "Ringing" isn't announced: focus moves to the status heading, which says it. */
const CALL_ANNOUNCEMENTS: Record<CallView, string> = {
  idle: '',
  ringing: '',
  pending: 'Checking the schemes…',
  done: 'Your results are ready.',
  failed: "The call didn't work.",
  lost: 'We lost track of the call.',
};

/**
 * The homepage. The main action is a phone call: the farmer types a mobile, we ring it, they describe the farm and
 * the result shows here. The text box (typing, the mic and the example farmers) is one click away at `/?mode=type`.
 */
export function AdvisorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const typing = searchParams.get('mode') === 'type';
  const [text, setText] = useState('');
  const [phone, setPhone] = useState('');
  const advisor = useAdvisor();
  const voice = useVoiceCall();
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const callHeading = useRef<HTMLHeadingElement>(null);
  const phoneField = useRef<HTMLInputElement>(null);
  const isIdle = typing ? advisor.stage === 'idle' : voice.view === 'idle';
  const showingResults = typing ? advisor.stage === 'done' : voice.view === 'done';

  useEffect(() => {
    if (showingResults) resultsHeading.current?.focus();
  }, [showingResults]);

  useEffect(() => {
    if (voice.callSid) callHeading.current?.focus();
  }, [voice.callSid]);

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

  /** Keeps the number, so ringing again is one tap. */
  function startAgainCall() {
    voice.reset();
    phoneField.current?.focus();
  }

  /** Replace, not push: Back still leaves the page, and `/?mode=type` works as a link. */
  function setTyping(next: boolean) {
    setSearchParams(next ? { mode: 'type' } : {}, { replace: true });
  }

  function typeInstead() {
    voice.reset();
    setTyping(true);
  }

  return (
    <div>
      <section
        id="grant-checker"
        aria-label="Describe your farm"
        className={cn(
          'scroll-mt-[4.5rem] bg-gradient-to-b from-brand-50 via-cream-50 to-cream-100 md:scroll-mt-[6.75rem]',
          isIdle
            ? 'min-h-[calc(100svh-4.5rem)] px-4 pt-12 pb-20 sm:px-6 md:min-h-[calc(100svh-6.75rem)] md:pt-[6.65rem] md:pb-24'
            : 'px-4 pt-6 pb-2 sm:px-6 sm:pt-10',
        )}
      >
        <div className={cn('mx-auto', isIdle ? 'max-w-[65rem]' : 'max-w-3xl')}>
          {isIdle ? <Hero /> : <h1 className="sr-only">{HERO_TITLE}</h1>}
          <div className={isIdle ? 'mt-12 motion-safe:animate-rise md:mt-[6.75rem]' : undefined}>
            {typing ? (
              <div className="mx-auto max-w-3xl">
                <AskBox value={text} onChange={setText} onSubmit={ask} busy={advisor.isRunning} />
              </div>
            ) : (
              <CallBox
                value={phone}
                onChange={setPhone}
                onCall={voice.ring}
                placing={voice.placing}
                inProgress={voice.inProgress}
                error={voice.ringError?.message}
                inputRef={phoneField}
              />
            )}
          </div>
          {isIdle && (
            <div className="mt-7 flex justify-center sm:mt-10">
              <button
                type="button"
                onClick={() => setTyping(!typing)}
                className="focus-ring rounded-lg px-2 py-1 text-base text-soil-800 underline decoration-1 underline-offset-4 transition hover:text-brand-800 sm:text-lg"
              >
                {typing ? 'Get a phone call instead' : 'Enter your farm details instead'}
              </button>
            </div>
          )}
          {isIdle && typing && <ExamplePrompts onPick={(prompt) => ask(prompt.text)} />}
        </div>
      </section>

      {isIdle ? (
        <Landing />
      ) : typing ? (
        <div className="space-y-8 pt-6">
          {advisor.stage !== 'error' && (
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <AgentFlowGraph stage={advisor.stage} advice={advisor.result} question={text} />
            </div>
          )}

          <div className="mx-auto max-w-3xl px-4 sm:px-6">
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
        </div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-8 px-4 pt-6 sm:px-6">
          {voice.view !== 'idle' && (
            <div className="mx-auto max-w-3xl">
              <CallStatus
                view={voice.view}
                call={voice.call}
                dialled={voice.dialled}
                checkError={voice.checkError}
                headingRef={callHeading}
                onStartAgain={startAgainCall}
                onCheckAgain={voice.checkAgain}
                onTypeInstead={typeInstead}
              />
            </div>
          )}

          {voice.view === 'pending' && voice.call?.checking && <LogicTrace />}

          {voice.advice && (
            <div className="mx-auto max-w-3xl">
              <Results
                advice={voice.advice}
                headingRef={resultsHeading}
                onStartAgain={startAgainCall}
              />
            </div>
          )}
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {typing ? ANNOUNCEMENTS[advisor.stage] : CALL_ANNOUNCEMENTS[voice.view]}
      </p>
    </div>
  );
}

function Hero() {
  return (
    <header className="text-center">
      <h1 className="text-[clamp(3.1rem,5.4vw,4.75rem)] leading-[1.04] font-bold tracking-[-0.045em] text-brand-950">
        <span className="block">Find the farm grants</span>
        <span className="block text-brand-600">you’re missing</span>
      </h1>
      <p className="mx-auto mt-8 max-w-[54rem] text-lg leading-relaxed text-pretty text-soil-700 sm:text-[1.75rem] sm:leading-[1.45]">
        {APP_DESCRIPTION}
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
