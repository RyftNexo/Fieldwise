import { endpoints } from '@app/shared';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Database, ExternalLink, Leaf, LoaderCircle, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { call } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const DRAWER_ID = 'scheme-raw-data';

/** Scheme criteria and provenance straight from C-05, never copied into the web app. */
export function RawDataDrawer() {
  const [open, setOpen] = useState(false);
  const schemes = useQuery({
    queryKey: [endpoints.listSchemes.id],
    queryFn: () => call(endpoints.listSchemes),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className={cardClasses('surface', 'overflow-hidden')}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={DRAWER_ID}
        onClick={() => setOpen((current) => !current)}
        className="focus-ring flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 rounded-card px-5 py-4 text-left transition duration-200 hover:bg-cream-50 sm:px-6"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Database className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block font-display font-semibold text-brand-900">
              {open ? 'Hide the raw data' : 'Show the raw data'}
            </span>
            <span className="block text-sm text-soil-600">
              The scheme criteria and official sources behind these results
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-soil-500 transition duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div id={DRAWER_ID} className="border-t border-soil-100 px-5 py-5 sm:px-6">
          {schemes.isPending && (
            <p className="flex items-center gap-2 text-soil-600">
              <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />
              Loading scheme data…
            </p>
          )}

          {schemes.isError && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900"
            >
              <p className="font-semibold">We couldn't load the scheme data.</p>
              <p className="mt-1 text-sm">{schemes.error.message}</p>
              <Button variant="secondary" className="mt-3" onClick={() => schemes.refetch()}>
                <RotateCcw className="size-4" aria-hidden />
                Try again
              </Button>
            </div>
          )}

          {schemes.data?.length === 0 && (
            <p className="text-soil-600">No scheme records are available yet.</p>
          )}

          {schemes.data && schemes.data.length > 0 && (
            <ul className="space-y-4">
              {schemes.data.map((scheme) => (
                <li key={scheme.id} className={cardClasses('cream', 'rounded-2xl p-4 sm:p-5')}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold tracking-wider text-brand-600 uppercase">
                        {scheme.shortName}
                      </p>
                      <h3 className="mt-0.5 text-lg font-semibold text-brand-900">{scheme.name}</h3>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        scheme.checkedAt
                          ? 'bg-brand-100 text-brand-900'
                          : 'bg-harvest-100 text-harvest-900',
                      )}
                    >
                      {scheme.checkedAt
                        ? `Checked ${new Date(scheme.checkedAt).toLocaleDateString('en-IE')}`
                        : 'Not independently verified'}
                    </span>
                  </div>
                  <h4 className="mt-4 font-sans text-sm font-bold text-soil-800">Criteria</h4>
                  <ul className="mt-1.5 space-y-1.5 text-[0.95rem] text-soil-700">
                    {scheme.criteria.map((criterion) => (
                      <li key={criterion} className="flex gap-2.5">
                        <Leaf className="mt-1 size-4 shrink-0 text-brand-500" aria-hidden />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-soil-600">
                    <span className="font-semibold text-soil-800">Source:</span> {scheme.source}
                  </p>
                  <a
                    href={scheme.url}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-control font-semibold text-brand-700 underline-offset-4 hover:underline"
                  >
                    Open the official source
                    <ExternalLink className="size-4" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
