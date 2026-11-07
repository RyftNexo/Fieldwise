import { type AdviceResponse, endpoints, type FarmProfile } from '@app/shared';
import { useMutation } from '@tanstack/react-query';
import { Info, RotateCcw, Sparkles } from 'lucide-react';
import { type Ref, useEffect, useState } from 'react';
import { call } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { HillsArt } from '@/components/ui/HillsArt';
import { ForesterCta } from './ForesterCta';
import { formatEuro } from './format';
import { GrantCard } from './GrantCard';
import { forestryMatches } from './leads';
import { ProfileChips } from './ProfileChips';
import { RawDataDrawer } from './RawDataDrawer';
import { summariseMatches } from './summary';

interface ResultsProps {
  advice: AdviceResponse;
  /** Focus moves here when the answer arrives, so screen readers land on the result. */
  headingRef: Ref<HTMLHeadingElement>;
  onStartAgain: () => void;
}

export function Results({ advice, headingRef, onStartAgain }: ResultsProps) {
  const [currentAdvice, setCurrentAdvice] = useState(advice);
  useEffect(() => setCurrentAdvice(advice), [advice]);
  const evaluation = useMutation({
    mutationFn: (profile: FarmProfile) => call(endpoints.evaluateAdvice, { body: { profile } }),
  });
  const headline = summariseMatches(currentAdvice.matches);

  async function updateProfile(profile: FarmProfile): Promise<FarmProfile> {
    const updated = await evaluation.mutateAsync(profile);
    setCurrentAdvice(updated);
    return updated.profile;
  }

  return (
    <div className="space-y-8 motion-safe:animate-rise">
      <ProfileChips
        profile={currentAdvice.profile}
        onSave={updateProfile}
        saving={evaluation.isPending}
      />

      <section
        aria-labelledby="results-heading"
        className={cardClasses('deep', 'relative overflow-hidden p-6 sm:p-8')}
      >
        <HillsArt className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-brand-300" />
        <div className="relative">
          <h2
            id="results-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight text-cream-50 focus:outline-none sm:text-3xl"
          >
            {headline.schemeCount === 0
              ? 'No schemes matched yet'
              : `${headline.schemeCount} ${headline.schemeCount === 1 ? 'scheme' : 'schemes'} worth a look`}
          </h2>
          {headline.totalEur > 0 && (
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-brand-100">
              Up to
              <span className="font-display text-4xl font-bold tracking-tight text-harvest-300 tabular-nums sm:text-5xl">
                {formatEuro(headline.totalEur)}
              </span>
              from{' '}
              {headline.valuedCount === 1
                ? 'the one scheme'
                : `the ${headline.valuedCount} schemes`}{' '}
              we could put a figure on
            </p>
          )}
          <p className="mt-5 text-lg leading-relaxed text-pretty text-cream-100">
            {currentAdvice.summary}
          </p>
          <p className="mt-4 flex items-center gap-1.5 text-sm text-brand-200">
            <Sparkles className="size-4" aria-hidden />
            Written by AI, using only the rules-engine results below.
          </p>
        </div>
      </section>

      {currentAdvice.matches.length === 0 ? (
        <NoMatches missing={currentAdvice.profile.missing} />
      ) : (
        <section aria-labelledby="grants-heading">
          <h2 id="grants-heading" className="sr-only">
            The schemes
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {currentAdvice.matches.map((match) => (
              <li key={match.schemeId} className="flex">
                <GrantCard match={match} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <RawDataDrawer />

      {currentAdvice.nextSteps.length > 0 && <NextSteps steps={currentAdvice.nextSteps} />}

      {forestryMatches(currentAdvice.matches).length > 0 && <ForesterCta advice={currentAdvice} />}

      {currentAdvice.disclaimers.length > 0 && (
        <ul className="space-y-1.5 text-sm text-soil-600">
          {currentAdvice.disclaimers.map((item) => (
            <li key={item} className="flex gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-soil-400" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-center">
        <Button variant="secondary" onClick={onStartAgain}>
          <RotateCcw className="size-4" aria-hidden />
          Start again
        </Button>
      </div>
    </div>
  );
}

function NextSteps({ steps }: { steps: string[] }) {
  return (
    <section
      aria-labelledby="next-steps-heading"
      className={cardClasses('surface', 'p-5 sm:p-6')}
    >
      <h2 id="next-steps-heading" className="text-xl font-semibold text-brand-900">
        Your next steps
      </h2>
      <ul className="mt-4 space-y-1">
        {steps.map((step) => (
          <li key={step}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl p-2 text-soil-800 transition hover:bg-cream-50">
              <input
                type="checkbox"
                className="peer focus-ring mt-0.5 size-5 shrink-0 cursor-pointer accent-brand-700"
              />
              <span className="peer-checked:text-soil-500 peer-checked:line-through">{step}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NoMatches({ missing }: { missing: string[] }) {
  return (
    <div className={cardClasses('cream', 'p-8 text-center')}>
      <p className="font-display text-lg font-semibold text-brand-900">
        No schemes matched what you told us
      </p>
      <p className="mt-1 text-soil-600">
        Try adding how many hectares you farm, your county and what you farm
        {missing.length > 0 ? `, and ${missing.join(', ')}` : ''}.
      </p>
    </div>
  );
}
