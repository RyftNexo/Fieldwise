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
      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600"
    >
      <span
        className={cn(
          'size-2 rounded-full',
          health.isPending
            ? 'bg-neutral-300'
            : ok
              ? API_MODE === 'mock'
                ? 'bg-amber-400'
                : 'bg-emerald-500'
              : 'bg-red-500',
        )}
      />
      {label}
    </span>
  );
}
