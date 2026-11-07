import type { Eligibility, GrantMatch, GrantValue, SchemeStatus } from '@app/shared';
import { CircleCheck, CircleQuestionMark, ExternalLink, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatEuro } from './format';

const ELIGIBILITY: Record<Eligibility, { label: string; className: string; Icon: LucideIcon }> = {
  yes: { label: 'You qualify', className: 'bg-brand-600 text-white', Icon: CircleCheck },
  likely: { label: 'Likely', className: 'bg-brand-100 text-brand-800', Icon: CircleCheck },
  check: {
    label: 'Check first',
    className: 'bg-amber-100 text-amber-900',
    Icon: CircleQuestionMark,
  },
};

const STATUS_LABELS: Record<SchemeStatus, string> = {
  open: 'Open now',
  rolling: 'Open all year',
  closed: 'Closed for now',
  unknown: 'Check the dates',
};

/** "You qualify" / "Likely" / "Check first". Colour plus words, never colour alone. */
export function EligibilityBadge({ eligible }: { eligible: Eligibility }) {
  const badge = ELIGIBILITY[eligible];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        badge.className,
      )}
    >
      <badge.Icon className="size-3.5" aria-hidden />
      {badge.label}
    </span>
  );
}

/** One scheme: badge, € figure, the rules that fired, status, next step and the official link. */
export function GrantCard({ match }: { match: GrantMatch }) {
  const headingId = `grant-${match.schemeId}`;
  return (
    <article
      aria-labelledby={headingId}
      className="flex w-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
            {match.shortName}
          </p>
          <h3 id={headingId} className="mt-0.5 text-lg leading-snug font-semibold text-stone-900">
            {match.name}
          </h3>
        </div>
        <EligibilityBadge eligible={match.eligible} />
      </div>

      <Value value={match.value} />

      <h4 className="mt-4 text-sm font-semibold text-stone-900">Why we think so</h4>
      <ul className="mt-1.5 space-y-1.5 text-sm text-stone-700">
        {match.reasons.map((reason) => (
          <li key={reason} className="flex gap-2">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" />
            {reason}
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-stone-500">Status</dt>
          <dd className="text-stone-800">
            {STATUS_LABELS[match.status]}
            {match.deadline ? ` · closes ${formatDate(match.deadline)}` : ''}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-stone-500">Next step</dt>
          <dd className="text-stone-800">{match.nextStep}</dd>
        </div>
      </dl>

      <a
        href={match.url}
        target="_blank"
        rel="noreferrer"
        className="mt-auto inline-flex items-center gap-1 self-start rounded pt-4 text-sm font-semibold text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Scheme details on gov.ie
        <ExternalLink className="size-3.5" aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </article>
  );
}

function Value({ value }: { value?: GrantValue }) {
  if (!value) {
    return (
      <p className="mt-4 text-sm text-stone-600">
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
    <div className="mt-4">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm text-stone-600">Up to</span>
        <span className="text-3xl font-bold tracking-tight text-stone-900 tabular-nums">
          {formatEuro(value.totalEur)}
        </span>
        {parts.length > 0 && <span className="text-sm text-stone-600">{parts.join(' · ')}</span>}
      </p>
      <p className="mt-1 text-xs text-stone-500">{value.basis}</p>
    </div>
  );
}
