import type { Lead } from '@app/shared';
import { Mail, MapPin, Phone } from 'lucide-react';
import { EligibilityBadge, Pill } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { phoneHref } from '@/features/advisor/contact';
import { formatEuro, formatTimeAgo } from '@/features/advisor/format';
import { placeOf, profileToChips } from '@/features/advisor/summary';

const NEW_FOR_MS = 30 * 60 * 1000;

/** One lead: who and where, the farm in tags, the schemes that matched, what it's worth, and how to reach them. */
export function LeadCard({ lead }: { lead: Lead }) {
  const place = placeOf(lead.profile);
  const chips = profileToChips(lead.profile).filter(
    (chip) => !chip.missing && chip.key !== 'place',
  );
  const isNew = Date.now() - new Date(lead.createdAt).getTime() < NEW_FOR_MS;
  const headingId = `lead-${lead.id}`;

  return (
    <article aria-labelledby={headingId} className={cardClasses('surface', 'p-5 sm:p-6')}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-full bg-harvest-100 font-display text-lg font-semibold text-harvest-800"
        >
          {lead.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id={headingId} className="text-xl font-semibold text-brand-900">
              {lead.name}
            </h2>
            {isNew && <Pill tone="new">New</Pill>}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-soil-600">
            {place && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" aria-hidden />
                {place}
              </span>
            )}
            <time dateTime={lead.createdAt}>{formatTimeAgo(lead.createdAt)}</time>
          </p>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li
            key={chip.key}
            className="rounded-full bg-cream-100 px-3 py-1 text-sm font-medium text-soil-700"
          >
            {chip.label}
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
        {lead.estimatedTotalEur > 0 && (
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-soil-600">
            Worth up to
            <span className="font-display text-2xl font-bold tracking-tight text-harvest-700 tabular-nums">
              {formatEuro(lead.estimatedTotalEur)}
            </span>
            to the farmer
          </p>
        )}
        <ul className="mt-1 space-y-2">
          {lead.matches.map((match) => (
            <li key={match.schemeId} className="flex items-center justify-between gap-3">
              <span className="text-soil-800">
                <span className="font-semibold">{match.shortName}</span> · {match.name}
              </span>
              <EligibilityBadge eligible={match.eligible} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {lead.phone && (
          <a href={phoneHref(lead.phone)} className={buttonClasses()}>
            <Phone className="size-4" aria-hidden />
            Ring {lead.phone}
          </a>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}`} className={buttonClasses({ variant: 'secondary' })}>
            <Mail className="size-4" aria-hidden />
            {lead.email}
          </a>
        )}
      </div>
    </article>
  );
}
