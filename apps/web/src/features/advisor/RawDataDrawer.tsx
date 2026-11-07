import { endpoints } from '@app/shared';
import { useQuery } from '@tanstack/react-query';
import { Database, ExternalLink, LoaderCircle, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { call } from '@/api/client';

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
    <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={DRAWER_ID}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left font-semibold text-stone-900 transition hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <span className="flex items-center gap-2">
          <Database className="size-5 text-brand-700" aria-hidden />
          {open ? 'Hide the raw data' : 'Show the raw data'}
        </span>
        <span className="text-sm font-normal text-stone-500">Criteria and official sources</span>
      </button>

      {open && (
        <div id={DRAWER_ID} className="border-t border-stone-200 px-5 py-5">
          {schemes.isPending && (
            <p className="flex items-center gap-2 text-sm text-stone-600">
              <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />
              Loading scheme data…
            </p>
          )}

          {schemes.isError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"
            >
              <p className="font-semibold">We couldn't load the scheme data.</p>
              <p className="mt-1 text-sm">{schemes.error.message}</p>
              <button
                type="button"
                onClick={() => schemes.refetch()}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold ring-1 ring-red-200 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                <RotateCcw className="size-4" aria-hidden />
                Try again
              </button>
            </div>
          )}

          {schemes.data?.length === 0 && (
            <p className="text-sm text-stone-600">No scheme records are available yet.</p>
          )}

          {schemes.data && schemes.data.length > 0 && (
            <ul className="space-y-4">
              {schemes.data.map((scheme) => (
                <li key={scheme.id} className="rounded-xl bg-stone-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                        {scheme.shortName}
                      </p>
                      <h3 className="font-semibold text-stone-900">{scheme.name}</h3>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-stone-600 ring-1 ring-stone-200">
                      {scheme.checkedAt
                        ? `Checked ${new Date(scheme.checkedAt).toLocaleDateString('en-IE')}`
                        : 'Not independently verified'}
                    </span>
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-stone-800">Criteria</h4>
                  <ul className="mt-1 space-y-1 text-sm text-stone-700">
                    {scheme.criteria.map((criterion) => (
                      <li key={criterion} className="flex gap-2">
                        <span
                          aria-hidden
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500"
                        />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-stone-600">
                    <span className="font-semibold text-stone-800">Source:</span> {scheme.source}
                  </p>
                  <a
                    href={scheme.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 rounded text-sm font-semibold text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    Open the official source
                    <ExternalLink className="size-3.5" aria-hidden />
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
