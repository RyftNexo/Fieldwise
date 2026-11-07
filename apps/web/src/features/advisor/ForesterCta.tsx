import type { AdviceResponse } from '@app/shared';
import { CircleCheck, Send, Trees } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { isPlausiblePhone } from './contact';
import { forestryMatches, useCreateLead } from './leads';
import { placeOf } from './summary';

/**
 * "Send to a registered forester": turns a forestry result into a pre-qualified lead. Free for the farmer;
 * foresters pay per lead (decision D-015).
 */
export function ForesterCta({ advice }: { advice: AdviceResponse }) {
  const createLead = useCreateLead();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const area = placeOf(advice.profile) ?? 'your area';

  const nameError = name.trim() ? undefined : 'Enter your name.';
  const phoneError = isPlausiblePhone(phone)
    ? undefined
    : 'Enter a phone number the forester can ring.';
  const consentError = consent ? undefined : 'Tick the box so we can share your details.';

  if (createLead.isSuccess) {
    return (
      <section
        aria-labelledby="forester-sent-heading"
        className="rounded-2xl border border-brand-300 bg-brand-50 p-5 sm:p-6"
      >
        <h2
          id="forester-sent-heading"
          className="flex items-center gap-2 text-lg font-semibold text-brand-900"
        >
          <CircleCheck className="size-5 text-brand-600" aria-hidden />
          Sent to a registered forester
        </h2>
        <p className="mt-2 text-stone-700">
          A forester covering {area} will ring {createLead.data.name} on {createLead.data.phone} to
          arrange a site visit.
        </p>
        <Link
          to="/forester"
          className="mt-3 inline-flex rounded text-sm font-semibold text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          See it in the forester's inbox (demo)
        </Link>
      </section>
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setShowErrors(true);
    if (nameError || phoneError || consentError) return;
    const matches = forestryMatches(advice.matches);
    createLead.mutate({
      profile: advice.profile,
      schemeIds: matches.map((match) => match.schemeId),
      name: name.trim(),
      phone: phone.trim(),
      consent: true,
    });
  }

  return (
    <section
      aria-labelledby="forester-heading"
      className="rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
          <Trees className="size-5" aria-hidden />
        </span>
        <div>
          <h2 id="forester-heading" className="text-lg font-semibold text-stone-900">
            Get a registered forester to check your land
          </h2>
          <p className="mt-1 text-sm text-pretty text-stone-700">
            It's free for you. We send your farm details and forestry results to one registered
            forester covering {area}, and they ring you to walk the site.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextField
          id="lead-name"
          label="Your name"
          maxLength={120}
          value={name}
          onChange={setName}
          autoComplete="name"
          error={showErrors ? nameError : undefined}
        />
        <TextField
          id="lead-phone"
          label="Phone"
          type="tel"
          value={phone}
          onChange={setPhone}
          autoComplete="tel"
          error={showErrors ? phoneError : undefined}
        />
        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 text-sm text-stone-800">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              aria-invalid={showErrors && consentError ? true : undefined}
              aria-describedby={showErrors && consentError ? 'lead-consent-error' : undefined}
              className="mt-0.5 size-4 shrink-0 accent-brand-600"
            />
            I agree to share these details and my forestry results with one registered forester.
          </label>
          {showErrors && consentError && (
            <p id="lead-consent-error" className="mt-1 text-sm text-red-700">
              {consentError}
            </p>
          )}
        </div>
        {createLead.error && (
          <p role="alert" className="text-sm text-red-700 sm:col-span-2">
            {createLead.error.message}
          </p>
        )}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={createLead.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="size-4" aria-hidden />
            {createLead.isPending ? 'Sending…' : 'Send to a forester'}
          </button>
        </div>
      </form>
    </section>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: 'text' | 'tel';
  autoComplete?: string;
  maxLength?: number;
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  maxLength,
}: TextFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={type === 'tel' ? 'tel' : undefined}
        autoComplete={autoComplete}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-base text-stone-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15',
          error ? 'border-red-400' : 'border-stone-300',
        )}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
