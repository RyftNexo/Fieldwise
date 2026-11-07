import { type AdviceResponse, endpoints, type FarmProfile } from '@app/shared';
import { useMutation } from '@tanstack/react-query';
import { Info, RotateCcw, Sparkles } from 'lucide-react';
import { type Ref, useEffect, useState } from 'react';
import { call } from '@/api/client';
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
    <div className="space-y-8">
      <ProfileChips
        profile={currentAdvice.profile}
        onSave={updateProfile}
        saving={evaluation.isPending}
      />

      <section
        aria-labelledby="results-heading"
        className="rounded-2xl bg-brand-900 p-6 text-white shadow-sm sm:p-8"
      >
        <h2
          id="results-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold tracking-tight focus:outline-none sm:text-3xl"
        >
          {headline.schemeCount === 0
            ? 'No schemes matched yet'
            : `${headline.schemeCount} ${headline.schemeCount === 1 ? 'scheme' : 'schemes'} worth a look`}
        </h2>
        {headline.totalEur > 0 && (
          <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-brand-100">
            Up to
            <span className="text-4xl font-bold tracking-tight text-white tabular-nums">
              {formatEuro(headline.totalEur)}
            </span>
            from{' '}
            {headline.valuedCount === 1 ? 'the one scheme' : `the ${headline.valuedCount} schemes`}{' '}
            we could put a figure on
          </p>
        )}
        <p className="mt-5 text-lg leading-relaxed text-pretty text-brand-50">
          {currentAdvice.summary}
        </p>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-brand-200">
          <Sparkles className="size-3.5" aria-hidden />
          Written by AI, using only the rules-engine results below.
        </p>
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
        <ul className="space-y-1.5 text-sm text-stone-500">
          {currentAdvice.disclaimers.map((item) => (
            <li key={item} className="flex gap-2">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onStartAgain}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <RotateCcw className="size-4" aria-hidden />
          Start again
        </button>
      </div>
    </div>
  );
}

function NextSteps({ steps }: { steps: string[] }) {
  return (
    <section
      aria-labelledby="next-steps-heading"
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <h2 id="next-steps-heading" className="text-lg font-semibold text-stone-900">
        Your next steps
      </h2>
      <ul className="mt-3 space-y-2.5">
        {steps.map((step) => (
          <li key={step}>
            <label className="flex cursor-pointer items-start gap-3 text-stone-800">
              <input type="checkbox" className="mt-1 size-4 shrink-0 accent-brand-600" />
              <span>{step}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NoMatches({ missing }: { missing: string[] }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center">
      <p className="font-semibold text-stone-900">No schemes matched what you told us</p>
      <p className="mt-1 text-sm text-stone-600">
        Try adding how many hectares you farm, your county and what you farm
        {missing.length > 0 ? `, and ${missing.join(', ')}` : ''}.
      </p>
    </div>
  );
}
