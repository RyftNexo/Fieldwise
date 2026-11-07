const euro = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const day = new Intl.DateTimeFormat('en-IE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** 44900 → "€44,900" (whole euros). */
export function formatEuro(amount: number): string {
  return euro.format(Math.round(amount));
}

/** "2027-05-15" → "15 May 2027". */
export function formatDate(iso: string): string {
  return day.format(new Date(iso));
}

const relative = new Intl.RelativeTimeFormat('en-IE', { numeric: 'auto' });

/** "just now", "25 minutes ago", "2 hours ago", then the date. */
export function formatTimeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const elapsed = Math.abs(seconds);
  if (elapsed < 60) return 'just now';
  if (elapsed < 3600) return relative.format(Math.round(seconds / 60), 'minute');
  if (elapsed < 86_400) return relative.format(Math.round(seconds / 3600), 'hour');
  return formatDate(iso);
}

/** 40 → "40 ha", 2.5 → "2.5 ha". */
export function formatHectares(hectares: number): string {
  return `${Number.isInteger(hectares) ? hectares : hectares.toFixed(1)} ha`;
}
