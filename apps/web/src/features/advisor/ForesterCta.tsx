import type { AdviceResponse } from '@app/shared';
import { ArrowRight, Check, CircleCheck, Send, Trees } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { Button, buttonClasses } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
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
        className={cardClasses('tinted', 'p-6 sm:p-8 motion-safe:animate-rise')}
      >
        <span className="grid size-12 place-items-center rounded-full bg-brand-700 text-white">
          <CircleCheck className="size-6" aria-hidden />
        </span>
        <h2 id="forester-sent-heading" className="mt-4 text-2xl font-semibold text-brand-900">
          Sent to a registered forester
        </h2>
        <p className="mt-2 text-lg text-soil-700">
          A forester covering {area} will ring {createLead.data.name} on {createLead.data.phone} to
          arrange a site visit.
        </p>
        <Link to="/forester" className={buttonClasses({ variant: 'secondary', className: 'mt-5' })}>
          See it in the forester's inbox (demo)
          <ArrowRight className="size-4" aria-hidden />
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
      className={cardClasses('surface', 'grid overflow-hidden md:grid-cols-[0.9fr_1.1fr]')}
    >
      <div className="bg-brand-900 p-6 text-cream-100 sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand-700 text-harvest-300">
          <Trees className="size-6" aria-hidden />
        </span>
        <h2 id="forester-heading" className="mt-4 text-2xl font-semibold text-cream-50">
          Get a registered forester to check your land
        </h2>
        <ul className="mt-4 space-y-2">
          {[
            'Free for you',
            `One registered forester covering ${area}`,
            'They ring you to walk the site and make the application',
          ].map((line) => (
            <li key={line} className="flex gap-2.5">
              <Check className="mt-1 size-4 shrink-0 text-harvest-300" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid gap-4 p-6 sm:p-8">
        <Field
          id="lead-name"
          label="Your name"
          value={name}
          onChange={setName}
          autoComplete="name"
          maxLength={120}
          error={showErrors ? nameError : undefined}
        />
        <Field
          id="lead-phone"
          label="Phone"
          type="tel"
          value={phone}
          onChange={setPhone}
          autoComplete="tel"
          hint="The forester rings this number. We don't share it with anyone else."
          error={showErrors ? phoneError : undefined}
        />
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-[0.95rem] text-soil-800">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              aria-invalid={showErrors && consentError ? true : undefined}
              aria-describedby={showErrors && consentError ? 'lead-consent-error' : undefined}
              className="focus-ring mt-0.5 size-5 shrink-0 cursor-pointer accent-brand-700"
            />
            I agree to share these details and my forestry results with one registered forester.
          </label>
          {showErrors && consentError && (
            <p id="lead-consent-error" className="mt-1 text-sm font-medium text-red-700">
              {consentError}
            </p>
          )}
        </div>
        {createLead.error && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {createLead.error.message}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          loading={createLead.isPending}
          className="justify-self-start"
        >
          {!createLead.isPending && <Send className="size-4" aria-hidden />}
          {createLead.isPending ? 'Sending…' : 'Send to a forester'}
        </Button>
      </form>
    </section>
  );
}
