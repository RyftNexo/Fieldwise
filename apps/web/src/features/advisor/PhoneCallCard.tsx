import type { VoiceCall } from '@app/shared';
import { PhoneCall, PhoneIncoming } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { cn } from '@/lib/utils';
import { isPlausiblePhone } from './contact';
import { useVoiceCall } from './useVoiceCall';

/** What the farmer sees while the call runs, and whether it went wrong. */
function callStatus(active: boolean, call?: VoiceCall): { text: string; problem: boolean } {
  switch (call?.state) {
    case 'ringing':
      return {
        text: 'Ringing. Answer, then tell us about your farm.',
        problem: false,
      };
    case 'pending':
      return { text: 'Got it. Checking the schemes…', problem: false };
    case 'failed':
      return {
        text: call.failure ?? 'The call did not go through. Please try again.',
        problem: true,
      };
    case 'done':
      return call.advice
        ? { text: 'Done. Opening your results…', problem: false }
        : {
            text: 'The call ended before we had your results. Please try again.',
            problem: true,
          };
    default:
      return { text: active ? 'Calling your phone…' : '', problem: false };
  }
}

/**
 * "Prefer to talk? We'll ring you." Rings the farmer's mobile, they describe the farm out loud, and the results
 * screen opens when the call finishes. Goes through C-08 and C-09 (the API's phone line).
 */
export function PhoneCallCard({ onAdvice }: { onAdvice: (call: VoiceCall) => void }) {
  const voice = useVoiceCall();
  const [phone, setPhone] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const phoneError = isPlausiblePhone(phone) ? undefined : 'Enter a mobile number we can ring.';
  const status = voice.error ? { text: '', problem: false } : callStatus(voice.active, voice.call);

  useEffect(() => {
    if (voice.call?.state === 'done' && voice.call.advice) onAdvice(voice.call);
  }, [voice.call, onAdvice]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setShowErrors(true);
    if (phoneError || voice.active) return;
    voice.ring(phone.trim());
  }

  return (
    <section
      aria-labelledby="phone-call-heading"
      className={cardClasses('surface', 'mt-8 p-5 text-left sm:p-6')}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <PhoneCall className="size-5" aria-hidden />
        </span>
        <div>
          <h2 id="phone-call-heading" className="text-lg font-semibold text-brand-900">
            Prefer to talk? We'll ring you.
          </h2>
          <p className="mt-0.5 text-[0.95rem] text-soil-600">
            Type your mobile. GrantGuide rings you, you describe your farm out loud, and your
            results open here.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-56">
          <Field
            id="phone-call-number"
            label="Your mobile"
            type="tel"
            value={phone}
            onChange={setPhone}
            autoComplete="tel"
            error={showErrors ? phoneError : undefined}
          />
        </div>
        <Button type="submit" size="lg" loading={voice.active}>
          {voice.active ? 'Calling…' : 'Ring me'}
        </Button>
      </form>

      <div aria-live="polite" className="mt-3 space-y-2 empty:hidden">
        {status.text && (
          <p className={cn('font-medium', status.problem ? 'text-red-700' : 'text-brand-800')}>
            {status.text}
          </p>
        )}
        {voice.call?.transcript && voice.call.state === 'pending' && (
          <p className="rounded-xl bg-cream-100 p-3 text-soil-700">
            <span className="font-semibold">You said:</span> “{voice.call.transcript}”
          </p>
        )}
        {voice.error && <p className="font-medium text-red-700">{voice.error.message}</p>}
      </div>
    </section>
  );
}

/** Shown above the results when they came from a phone call. */
export function PhoneCallSummary({ call }: { call: VoiceCall }) {
  return (
    <section
      aria-label="Your phone call"
      className={cardClasses('tinted', 'flex items-start gap-3 p-5')}
    >
      <PhoneIncoming className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden />
      <div>
        <p className="font-semibold text-brand-900">From your phone call</p>
        {call.transcript && <p className="mt-1 text-soil-700">You said: “{call.transcript}”</p>}
      </div>
    </section>
  );
}
