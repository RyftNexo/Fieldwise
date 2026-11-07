import type { FarmProfile } from '@app/shared';
import { Check, CircleQuestionMark, Pencil, X } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { draftFromProfile, type ProfileDraft, profileFromDraft } from './profileEdit';
import { profileToChips } from './summary';

/**
 * "What we understood": the extracted profile as tags, with dashed tags for what's missing. Any tag opens the
 * editor; saving re-runs the scheme rules through C-04 without calling the AI.
 */
export function ProfileChips({
  profile,
  onSave,
  saving,
}: {
  profile: FarmProfile;
  onSave: (profile: FarmProfile) => Promise<FarmProfile>;
  saving: boolean;
}) {
  const chips = profileToChips(profile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => draftFromProfile(profile));
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  function startEditing() {
    setDraft(draftFromProfile(profile));
    setError(undefined);
    setSaved(false);
    setEditing(true);
  }

  function update<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    try {
      const updated = await onSave(profileFromDraft(profile, draft));
      setDraft(draftFromProfile(updated));
      setEditing(false);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Check the farm details and try again.');
    }
  }

  return (
    <section aria-labelledby="understood-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="understood-heading"
          className="font-sans text-sm font-bold tracking-wider text-brand-600 uppercase"
        >
          What we understood
        </h2>
        {!editing && (
          <Button variant="ghost" onClick={startEditing} className="min-h-10 px-3">
            <Pencil className="size-4" aria-hidden />
            Edit details
          </Button>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <button
              type="button"
              onClick={startEditing}
              aria-label={`Edit ${chip.label}`}
              className={cn(
                'focus-ring inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.95rem] transition duration-200',
                chip.missing
                  ? 'border border-dashed border-soil-300 text-soil-600 hover:border-brand-400 hover:text-brand-800'
                  : 'bg-white font-semibold text-brand-900 shadow-card ring-1 ring-brand-100 hover:ring-brand-300',
              )}
            >
              {chip.missing ? (
                <CircleQuestionMark className="size-4 text-soil-400" aria-hidden />
              ) : (
                <Check className="size-4 text-brand-600" aria-hidden />
              )}
              {chip.missing && <span className="sr-only">You didn't say: </span>}
              {chip.label}
            </button>
          </li>
        ))}
      </ul>

      {!editing && (
        <p className="mt-3 text-sm text-soil-600">
          Something wrong? Select any tag to correct it. The rules re-run without the AI.
        </p>
      )}

      {saved && !editing && (
        <p aria-live="polite" className="mt-2 text-sm font-semibold text-brand-700">
          Farm details and grant figures updated.
        </p>
      )}

      {editing && (
        <form onSubmit={submit} className={cardClasses('tinted', 'mt-4 p-5 sm:p-6')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-brand-900">Correct the farm details</h3>
              <p className="mt-1 text-sm text-soil-600">
                Saving re-runs the scheme rules only. It doesn't call the AI.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(false)}
              aria-label="Close farm details editor"
              className="focus-ring grid size-11 shrink-0 cursor-pointer place-items-center rounded-control text-soil-500 transition hover:bg-white hover:text-soil-800"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <LabelledControl label="Farm size (hectares)" htmlFor="profile-hectares">
              <input
                id="profile-hectares"
                type="number"
                min="0.1"
                step="0.1"
                required
                value={draft.hectares}
                onChange={(event) => update('hectares', event.target.value)}
                className={inputClass}
              />
            </LabelledControl>
            <LabelledControl label="Farm type" htmlFor="profile-enterprise">
              <select
                id="profile-enterprise"
                value={draft.enterprise}
                onChange={(event) =>
                  update('enterprise', event.target.value as ProfileDraft['enterprise'])
                }
                className={inputClass}
              >
                <option value="suckler">Suckler beef</option>
                <option value="beef">Beef</option>
                <option value="dairy">Dairy</option>
                <option value="sheep">Sheep</option>
                <option value="tillage">Tillage</option>
                <option value="mixed">Mixed farming</option>
                <option value="other">Other</option>
              </select>
            </LabelledControl>
            <LabelledControl label="County" htmlFor="profile-county">
              <input
                id="profile-county"
                value={draft.county}
                onChange={(event) => update('county', event.target.value)}
                className={inputClass}
                autoComplete="address-level1"
              />
            </LabelledControl>
            <LabelledControl label="Area or region" htmlFor="profile-region">
              <input
                id="profile-region"
                value={draft.region}
                onChange={(event) => update('region', event.target.value)}
                className={inputClass}
                placeholder="e.g. West Cork"
              />
            </LabelledControl>
            <LabelledControl label="Your age" htmlFor="profile-age">
              <input
                id="profile-age"
                type="number"
                min="0"
                max="120"
                value={draft.age}
                onChange={(event) => update('age', event.target.value)}
                className={inputClass}
              />
            </LabelledControl>
            <LabelledControl label="Marginal land (hectares)" htmlFor="profile-marginal-hectares">
              <input
                id="profile-marginal-hectares"
                type="number"
                min="0"
                step="0.1"
                value={draft.marginalHectares}
                onChange={(event) => update('marginalHectares', event.target.value)}
                className={inputClass}
              />
            </LabelledControl>
            <LabelledControl label="Planned investment" htmlFor="profile-investment">
              <select
                id="profile-investment"
                value={draft.plannedInvestment}
                onChange={(event) =>
                  update(
                    'plannedInvestment',
                    event.target.value as ProfileDraft['plannedInvestment'],
                  )
                }
                className={inputClass}
              >
                <option value="">Not specified</option>
                <option value="none">None</option>
                <option value="shed">Farm building or shed</option>
                <option value="solar">Solar panels</option>
                <option value="slurry">Slurry storage</option>
                <option value="machinery">Machinery</option>
              </select>
            </LabelledControl>
            <LabelledControl label="Land beside a river or stream" htmlFor="profile-watercourse">
              <select
                id="profile-watercourse"
                value={draft.nearWatercourse}
                onChange={(event) =>
                  update('nearWatercourse', event.target.value as ProfileDraft['nearWatercourse'])
                }
                className={inputClass}
              >
                <option value="">Not specified</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </LabelledControl>
            <LabelledControl label="Active farmer / claims BISS" htmlFor="profile-active-farmer">
              <select
                id="profile-active-farmer"
                value={draft.activeFarmer}
                onChange={(event) =>
                  update('activeFarmer', event.target.value as ProfileDraft['activeFarmer'])
                }
                className={inputClass}
              >
                <option value="">Not specified</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </LabelledControl>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="submit" loading={saving}>
              {saving ? 'Rechecking the rules…' : 'Save and recalculate'}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

const inputClass =
  'mt-1.5 block min-h-12 w-full rounded-control border border-soil-200 bg-white px-3.5 text-base text-soil-900 outline-none transition duration-200 placeholder:text-soil-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-200';

function LabelledControl({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-soil-800">
      {label}
      {children}
    </label>
  );
}
