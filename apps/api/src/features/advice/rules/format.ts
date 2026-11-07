import type { FarmProfile } from '@app/shared';

export function formatEur(amount: number): string {
  return `€${amount.toLocaleString('en-IE', { maximumFractionDigits: 2 })}`;
}

export function formatHa(hectares: number): string {
  return `${hectares} ha`;
}

/** `2026-11-07T00:00:00.000Z` → `2026-11-07`, for "checked on" notes in plain text. */
export function dateOnly(timestamp: string): string {
  return timestamp.slice(0, 10);
}

const livestockEnterprises: FarmProfile['enterprise'][] = [
  'suckler',
  'beef',
  'dairy',
  'sheep',
  'mixed',
];

/** True when the farm keeps grazing livestock, which is what the ANC stocking rule counts. */
export function keepsLivestock(profile: FarmProfile): boolean {
  return livestockEnterprises.includes(profile.enterprise);
}
