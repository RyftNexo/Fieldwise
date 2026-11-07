import type { FarmProfile } from '@app/shared';
import { LoaderCircle, Pencil, X } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { draftFromProfile, type ProfileDraft, profileFromDraft } from './profileEdit';
import { profileToChips } from './summary';

/** "What we understood": the extracted profile as chips, with dashed chips for what's missing. */
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
          className="text-sm font-semibold tracking-wide text-stone-500 uppercase"
        >
          What we understood
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit details
          </button>
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <button
              type="button"
              onClick={startEditing}
              aria-label={`Edit ${chip.label}`}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition hover:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                chip.missing
                  ? 'border-dashed border-stone-300 bg-white text-stone-500'
                  : 'border-brand-200 bg-brand-50 font-medium text-brand-800',
              )}
            >
              {chip.missing && <span className="sr-only">You didn't say: </span>}
              {chip.label}
            </button>
          </li>
        ))}
      </ul>
      {!editing && (
        <p className="mt-2 text-sm text-stone-500">
          Something wrong? Select any chip to correct it and re-run the rules without AI.
        </p>
      )}

      {saved && !editing && (
        <p aria-live="polite" className="mt-2 text-sm font-medium text-brand-700">
          Farm details and grant figures updated.
        </p>
      )}

      {editing && (
        <form
          onSubmit={submit}
          className="mt-4 rounded-2xl border border-brand-200 bg-brand-50/60 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-stone-900">Correct the farm details</h3>
              <p className="mt-1 text-sm text-stone-600">
                Saving re-runs the scheme rules only. It does not call the AI.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(false)}
              aria-label="Close farm details editor"
              className="rounded-lg p-1.5 text-stone-500 hover:bg-white hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Farm size (hectares)" htmlFor="profile-hectares">
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
            </Field>
            <Field label="Farm type" htmlFor="profile-enterprise">
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
            </Field>
            <Field label="County" htmlFor="profile-county">
              <input
                id="profile-county"
                value={draft.county}
                onChange={(event) => update('county', event.target.value)}
                className={inputClass}
                autoComplete="address-level1"
              />
            </Field>
            <Field label="Area or region" htmlFor="profile-region">
              <input
                id="profile-region"
                value={draft.region}
                onChange={(event) => update('region', event.target.value)}
                className={inputClass}
                placeholder="e.g. West Cork"
              />
            </Field>
            <Field label="Your age" htmlFor="profile-age">
              <input
                id="profile-age"
                type="number"
                min="0"
                max="120"
                value={draft.age}
                onChange={(event) => update('age', event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Marginal land (hectares)" htmlFor="profile-marginal-hectares">
              <input
                id="profile-marginal-hectares"
                type="number"
                min="0"
                step="0.1"
                value={draft.marginalHectares}
                onChange={(event) => update('marginalHectares', event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Planned investment" htmlFor="profile-investment">
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
            </Field>
            <Field label="Land beside a river or stream" htmlFor="profile-watercourse">
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
            </Field>
            <Field label="Active farmer / claims BISS" htmlFor="profile-active-farmer">
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
            </Field>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-wait disabled:opacity-70"
            >
              {saving && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />}
              {saving ? 'Rechecking the rules…' : 'Save and recalculate'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-stone-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-stone-700">
      {label}
      {children}
    </label>
  );
}
