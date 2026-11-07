import type { GrantMatch, GrantValue, SchemeStatus } from '@app/shared';
import { ExternalLink, Leaf } from 'lucide-react';
import { EligibilityBadge } from '@/components/ui/Badge';
import { cardClasses } from '@/components/ui/Card';
import { formatDate, formatEuro } from './format';

const STATUS_LABELS: Record<SchemeStatus, string> = {
  open: 'Open now',
  rolling: 'Open all year',
  closed: 'Closed for now',
  unknown: 'Check the dates',
};

/** One scheme: badge, € figure, the rules that fired, status, next step and the official link. */
export function GrantCard({ match }: { match: GrantMatch }) {
  const headingId = `grant-${match.schemeId}`;
  return (
    <article
      aria-labelledby={headingId}
      className={cardClasses('surface', 'flex w-full flex-col p-5 sm:p-6')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wider text-brand-600 uppercase">
            {match.shortName}
          </p>
          <h3 id={headingId} className="mt-1 text-xl leading-snug font-semibold text-brand-900">
            {match.name}
          </h3>
        </div>
        <EligibilityBadge eligible={match.eligible} />
      </div>

      <Value value={match.value} />

      <h4 className="mt-5 font-sans text-sm font-bold text-soil-800">Why we think so</h4>
      <ul className="mt-2 space-y-2 text-[0.95rem] text-soil-700">
        {match.reasons.map((reason) => (
          <li key={reason} className="flex gap-2.5">
            <Leaf className="mt-1 size-4 shrink-0 text-brand-500" aria-hidden />
            {reason}
          </li>
        ))}
      </ul>

      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-soil-100 pt-4 text-[0.95rem]">
        <dt className="text-soil-500">Status</dt>
        <dd className="text-soil-800">
          {STATUS_LABELS[match.status]}
          {match.deadline ? ` · closes ${formatDate(match.deadline)}` : ''}
        </dd>
        <dt className="text-soil-500">Next step</dt>
        <dd className="text-soil-800">{match.nextStep}</dd>
      </dl>

      <a
        href={match.url}
        target="_blank"
        rel="noreferrer"
        className="focus-ring mt-auto inline-flex min-h-11 items-center gap-1.5 self-start rounded-control pt-4 font-semibold text-brand-700 underline-offset-4 hover:underline"
      >
        Scheme details on gov.ie
        <ExternalLink className="size-4" aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </article>
  );
}

function Value({ value }: { value?: GrantValue }) {
  if (!value) {
    return (
      <p className="mt-4 rounded-2xl bg-cream-100 p-4 text-[0.95rem] text-soil-600">
        We can't put a figure on this one from what you told us.
      </p>
    );
  }
  const parts = [
    value.years ? `over ${value.years} years` : null,
    value.annualEur ? `${formatEuro(value.annualEur)} a year` : null,
    value.oneOffEur ? `${formatEuro(value.oneOffEur)} up front` : null,
  ].filter((part): part is string => part !== null);
  return (
    <div className="mt-4 rounded-2xl bg-harvest-50 p-4 ring-1 ring-harvest-100">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-semibold text-harvest-800">Up to</span>
        <span className="font-display text-3xl font-bold tracking-tight text-soil-900 tabular-nums">
          {formatEuro(value.totalEur)}
        </span>
        {parts.length > 0 && (
          <span className="text-sm font-semibold text-harvest-800">{parts.join(' · ')}</span>
        )}
      </p>
      <p className="mt-1 text-sm text-soil-600">{value.basis}</p>
    </div>
  );
}
