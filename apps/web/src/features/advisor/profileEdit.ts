import {
  type Enterprise,
  type FarmProfile,
  FarmProfile as FarmProfileSchema,
  type Investment,
} from '@app/shared';

export interface ProfileDraft {
  hectares: string;
  enterprise: Enterprise;
  county: string;
  region: string;
  age: string;
  marginalHectares: string;
  nearWatercourse: OptionalBooleanDraft;
  activeFarmer: OptionalBooleanDraft;
  plannedInvestment: Investment | '';
}

export type OptionalBooleanDraft = '' | 'yes' | 'no';

export function draftFromProfile(profile: FarmProfile): ProfileDraft {
  return {
    hectares: String(profile.hectares),
    enterprise: profile.enterprise,
    county: profile.county ?? '',
    region: profile.region ?? '',
    age: profile.age === undefined ? '' : String(profile.age),
    marginalHectares:
      profile.marginalHectares === undefined ? '' : String(profile.marginalHectares),
    nearWatercourse: booleanDraft(profile.nearWatercourse),
    activeFarmer: booleanDraft(profile.activeFarmer),
    plannedInvestment: profile.plannedInvestment ?? '',
  };
}

/** Turns the edit form back into the shared contract shape without inventing missing facts. */
export function profileFromDraft(original: FarmProfile, draft: ProfileDraft): FarmProfile {
  const missing = original.missing.filter((item) => {
    if (draft.age && /age/iu.test(item)) return false;
    if ((draft.county || draft.region) && /county|location|where/iu.test(item)) return false;
    if (draft.marginalHectares && /marginal|wet|rough|unused land/iu.test(item)) return false;
    if (draft.nearWatercourse && /river|stream|watercourse/iu.test(item)) return false;
    if (draft.activeFarmer && /active farmer|biss/iu.test(item)) return false;
    if (draft.plannedInvestment && /investment|shed|solar|slurry|machinery/iu.test(item))
      return false;
    return true;
  });

  const checked = FarmProfileSchema.safeParse({
    ...original,
    hectares: Number(draft.hectares),
    enterprise: draft.enterprise,
    county: optionalText(draft.county),
    region: optionalText(draft.region),
    age: optionalNumber(draft.age),
    marginalHectares: optionalNumber(draft.marginalHectares),
    nearWatercourse: optionalBoolean(draft.nearWatercourse),
    activeFarmer: optionalBoolean(draft.activeFarmer),
    plannedInvestment: draft.plannedInvestment || undefined,
    missing,
  });

  if (!checked.success) {
    throw new Error(checked.error.issues[0]?.message ?? 'Check the farm details and try again.');
  }
  return checked.data;
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalNumber(value: string): number | undefined {
  return value === '' ? undefined : Number(value);
}

function booleanDraft(value: boolean | undefined): OptionalBooleanDraft {
  if (value === undefined) return '';
  return value ? 'yes' : 'no';
}

function optionalBoolean(value: OptionalBooleanDraft): boolean | undefined {
  if (!value) return undefined;
  return value === 'yes';
}
