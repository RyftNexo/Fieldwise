import { endpoints } from '@app/shared';
import { useQuery } from '@tanstack/react-query';
import { API_MODE, call } from '@/api/client';
import { cn } from '@/lib/utils';

/** Small header badge: shows mock/live mode and whether the API + DB answer. */
export function ApiStatus() {
  const health = useQuery({
    queryKey: [endpoints.health.id],
    queryFn: () => call(endpoints.health),
    refetchInterval: 15_000,
    retry: false,
  });

  const ok = health.data?.status === 'ok' && health.data.db !== 'error';
  const label = health.isPending
    ? 'Checking…'
    : ok
      ? API_MODE === 'mock'
        ? 'Mock API'
        : 'API online'
      : 'API offline';

  return (
    <span
      title={health.error?.message ?? `db: ${health.data?.db ?? '…'}`}
      className="inline-flex items-center gap-2 rounded-full bg-white/80 px-2 py-1.5 text-xs font-semibold text-soil-600 ring-1 ring-soil-100 sm:px-3 sm:py-1"
    >
      <span
        className={cn(
          'size-2 rounded-full',
          health.isPending
            ? 'bg-soil-300'
            : ok
              ? API_MODE === 'mock'
                ? 'bg-amber-400'
                : 'bg-emerald-500'
              : 'bg-red-500',
        )}
      />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </span>
  );
}
