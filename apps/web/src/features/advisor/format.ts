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

/** 40 → "40 ha", 2.5 → "2.5 ha". */
export function formatHectares(hectares: number): string {
  return `${Number.isInteger(hectares) ? hectares : hectares.toFixed(1)} ha`;
}
