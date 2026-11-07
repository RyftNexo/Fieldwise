import type { Enterprise, FarmProfile, GrantMatch, Investment } from '@app/shared';
import { formatHectares } from './format';

export interface Headline {
  schemeCount: number;
  /** How many matches the rules engine could put a figure on (and that count towards the total). */
  valuedCount: number;
  totalEur: number;
}

/** Adds up what the rules engine priced, for `yes` and `likely` matches only: `check` never counts. */
export function summariseMatches(matches: GrantMatch[]): Headline {
  let valuedCount = 0;
  let totalEur = 0;
  for (const match of matches) {
    if (match.value && match.eligible !== 'check') {
      valuedCount += 1;
      totalEur += match.value.totalEur;
    }
  }
  return { schemeCount: matches.length, valuedCount, totalEur };
}

export interface ProfileChip {
  key: string;
  label: string;
  /** Something the farmer didn't tell us that would sharpen the answer. */
  missing?: boolean;
}

const ENTERPRISE_LABELS: Record<Enterprise, string> = {
  suckler: 'Suckler beef',
  beef: 'Beef',
  dairy: 'Dairy',
  sheep: 'Sheep',
  tillage: 'Tillage',
  mixed: 'Mixed farming',
  other: 'Other farming',
};

const INVESTMENT_LABELS: Record<Exclude<Investment, 'none'>, string> = {
  shed: 'Planning a new shed',
  solar: 'Planning solar panels',
  slurry: 'Planning slurry storage',
  machinery: 'Planning new machinery',
};

/** What the farmer told us as short chips, followed by the things worth asking about. */
export function profileToChips(profile: FarmProfile): ProfileChip[] {
  const chips: ProfileChip[] = [];
  if (profile.hectares !== undefined) {
    chips.push({ key: 'hectares', label: formatHectares(profile.hectares) });
  }
  chips.push({ key: 'enterprise', label: ENTERPRISE_LABELS[profile.enterprise] });
  const place = placeOf(profile);
  if (place) chips.push({ key: 'place', label: place });
  if (profile.age !== undefined) chips.push({ key: 'age', label: `Age ${profile.age}` });
  if (profile.gender === 'female') chips.push({ key: 'gender', label: 'Woman farmer' });
  if (profile.marginalHectares) {
    chips.push({
      key: 'marginal',
      label: `${formatHectares(profile.marginalHectares)} of marginal land`,
    });
  }
  if (profile.nearWatercourse) chips.push({ key: 'water', label: 'Beside a river or stream' });
  if (profile.peatSoil) chips.push({ key: 'peat', label: 'Peat soil' });
  if (profile.designatedSite) chips.push({ key: 'designated', label: 'Designated site (SAC/SPA)' });
  if (profile.activeFarmer) chips.push({ key: 'biss', label: 'Claims BISS' });
  if (profile.plannedInvestment && profile.plannedInvestment !== 'none') {
    chips.push({ key: 'investment', label: INVESTMENT_LABELS[profile.plannedInvestment] });
  }
  for (const item of profile.missing) {
    chips.push({ key: `missing:${item}`, label: `${capitalise(item)}?`, missing: true });
  }
  return chips;
}

/** Where the farm is, in the farmer's words if they gave them ("West Cork"), else "Co. Cork". */
export function placeOf(profile: FarmProfile): string | undefined {
  return profile.region ?? (profile.county ? `Co. ${profile.county}` : undefined);
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
