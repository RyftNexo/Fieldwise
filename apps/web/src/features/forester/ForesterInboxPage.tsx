import { ArrowRight, Inbox, RotateCcw } from 'lucide-react';
import { Link } from 'react-router';
import { Button, buttonClasses } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { formatEuro } from '@/features/advisor/format';
import { useLeads } from '@/features/advisor/leads';
import { LeadCard } from './LeadCard';

/** What a registered forester sees: farmers who were screened against the rules and asked for a site visit. */
export function ForesterInboxPage() {
  const leads = useLeads();
  const totalEur = leads.data?.reduce((sum, lead) => sum + lead.estimatedTotalEur, 0) ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 sm:pt-14">
      <header>
        <p className="text-sm font-bold tracking-wider text-brand-600 uppercase">
          For registered foresters
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">
          Forester inbox
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-pretty text-soil-600">
          Farmers who were checked against the scheme rules and asked for a site visit. It's free
          for them, and you pay per lead, so every call is to someone likely to qualify.
        </p>
      </header>

      {leads.data && leads.data.length > 0 && (
        <dl className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md">
          <div className={cardClasses('surface', 'rounded-2xl p-4')}>
            <dt className="text-sm text-soil-600">Leads waiting</dt>
            <dd className="mt-1 font-display text-3xl font-bold text-brand-900 tabular-nums">
              {leads.data.length}
            </dd>
          </div>
          <div className={cardClasses('surface', 'rounded-2xl p-4')}>
            <dt className="text-sm text-soil-600">Value to farmers</dt>
            <dd className="mt-1 font-display text-3xl font-bold text-harvest-700 tabular-nums">
              {totalEur > 0 ? formatEuro(totalEur) : '–'}
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-8">
        {leads.isPending && (
          <ul aria-label="Loading leads" className="space-y-4">
            {[0, 1].map((index) => (
              <li
                key={index}
                className={cardClasses('surface', 'p-6 motion-safe:animate-pulse')}
                aria-hidden
              >
                <div className="flex items-center gap-3">
                  <span className="size-11 rounded-full bg-soil-100" />
                  <span className="h-5 w-48 rounded-full bg-soil-100" />
                </div>
                <div className="mt-5 h-4 w-3/4 rounded-full bg-soil-100" />
                <div className="mt-3 h-16 rounded-2xl bg-cream-100" />
              </li>
            ))}
          </ul>
        )}

        {leads.error && (
          <div
            role="alert"
            className={cardClasses(
              'surface',
              'border-red-200 bg-red-50 p-6 text-red-900 shadow-none',
            )}
          >
            <p className="font-display text-lg font-semibold">We couldn't load the leads.</p>
            <p className="mt-1">{leads.error.message}</p>
            <Button variant="secondary" className="mt-4" onClick={() => leads.refetch()}>
              <RotateCcw className="size-4" aria-hidden />
              Try again
            </Button>
          </div>
        )}

        {leads.data?.length === 0 && (
          <div className={cardClasses('cream', 'p-10 text-center')}>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-white text-brand-700 shadow-card">
              <Inbox className="size-7" aria-hidden />
            </span>
            <p className="mt-4 font-display text-xl font-semibold text-brand-900">No leads yet</p>
            <p className="mt-1 text-soil-600">
              When a farmer sends you their results, they'll appear here.
            </p>
            <Link to="/" className={buttonClasses({ variant: 'secondary', className: 'mt-5' })}>
              Try a farmer's check
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        )}

        {leads.data && leads.data.length > 0 && (
          <ul className="space-y-4">
            {leads.data.map((lead) => (
              <li key={lead.id}>
                <LeadCard lead={lead} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
