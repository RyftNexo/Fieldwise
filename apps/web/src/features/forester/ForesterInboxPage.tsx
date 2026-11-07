import { Inbox } from 'lucide-react';
import { PreviewBanner } from '@/components/PreviewBanner';
import { useLeads } from '@/features/advisor/leads';
import { LeadCard } from './LeadCard';

/** What a registered forester sees: farmers who were screened against the rules and asked for a site visit. */
export function ForesterInboxPage() {
  const leads = useLeads();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase">
          For registered foresters
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">Forester inbox</h1>
        <p className="mt-2 max-w-2xl text-pretty text-stone-600">
          Farmers who were checked against the scheme rules and asked for a site visit. It's free
          for them, and you pay per lead, so every call is to someone likely to qualify.
        </p>
      </header>

      <PreviewBanner>
        Until the leads API is connected, new leads are only kept until the page reloads. The first
        two are made-up examples.
      </PreviewBanner>

      {leads.isPending && <p className="text-sm text-stone-500">Loading leads…</p>}
      {leads.error && (
        <p role="alert" className="text-sm text-red-700">
          {leads.error.message}
        </p>
      )}
      {leads.data?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
          <Inbox className="mx-auto size-8 text-stone-400" aria-hidden />
          <p className="mt-2 font-semibold text-stone-900">No leads yet</p>
          <p className="mt-1 text-sm text-stone-600">
            When a farmer sends you their results, they'll appear here.
          </p>
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
  );
}
