import { Keyboard, Phone, RotateCcw, Sprout } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { APP_TAGLINE } from '@/app/config';
import { Button } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { HillsArt } from '@/components/ui/HillsArt';
import { cn } from '@/lib/utils';
import { AgentFlowGraph } from './AgentFlowGraph';
import { AskBox } from './AskBox';
import { CallBox } from './CallBox';
import { CallStatus } from './CallStatus';
import { ExamplePrompts } from './ExamplePrompts';
import { Landing } from './Landing';
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
            {typing ? (
              <AskBox value={text} onChange={setText} onSubmit={ask} busy={advisor.isRunning} />
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
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" onClick={() => setTyping(!typing)}>
                {typing ? (
                  <Phone className="size-4" aria-hidden />
                ) : (
                  <Keyboard className="size-4" aria-hidden />
                )}
                {typing ? 'Get a phone call instead' : 'Type your farm details instead'}
              </Button>
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
        <div className="mx-auto max-w-3xl space-y-8 px-4 pt-6 sm:px-6">
          {voice.view !== 'idle' && (
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
          )}

          {voice.advice && (
            <Results
              advice={voice.advice}
              headingRef={resultsHeading}
              onStartAgain={startAgainCall}
            />
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
