import { Mail, Phone } from 'lucide-react';
import { phoneHref } from '@/features/advisor/contact';
import { formatEuro, formatTimeAgo } from '@/features/advisor/format';
import { EligibilityBadge } from '@/features/advisor/GrantCard';
import { placeOf, profileToChips } from '@/features/advisor/summary';
import type { Lead } from '@/features/advisor/types';

/** One lead: who and where, the farm in chips, the schemes that matched, what it's worth, and how to reach them. */
export function LeadCard({ lead }: { lead: Lead }) {
  const place = placeOf(lead.profile);
  const chips = profileToChips(lead.profile).filter(
    (chip) => !chip.missing && chip.key !== 'place',
  );
  const headingId = `lead-${lead.id}`;
  return (
    <article
      aria-labelledby={headingId}
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={headingId} className="text-lg font-semibold text-stone-900">
          {lead.name}
          {place ? ` · ${place}` : ''}
        </h2>
        <p className="text-sm text-stone-500">
          <time dateTime={lead.createdAt}>{formatTimeAgo(lead.createdAt)}</time>
        </p>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li
            key={chip.key}
            className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-sm text-stone-700"
          >
            {chip.label}
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-xl bg-brand-50 p-4">
        {lead.estimatedTotalEur > 0 && (
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-stone-600">
            Worth up to
            <span className="text-2xl font-bold tracking-tight text-stone-900 tabular-nums">
              {formatEuro(lead.estimatedTotalEur)}
            </span>
            to the farmer
          </p>
        )}
        <ul className="mt-2 space-y-2">
          {lead.matches.map((match) => (
            <li key={match.schemeId} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-stone-800">
                <span className="font-semibold">{match.shortName}</span> · {match.name}
              </span>
              <EligibilityBadge eligible={match.eligible} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {lead.phone && (
          <a
            href={phoneHref(lead.phone)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <Phone className="size-4" aria-hidden />
            Ring {lead.phone}
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <Mail className="size-4" aria-hidden />
            {lead.email}
          </a>
        )}
      </div>
    </article>
  );
}
