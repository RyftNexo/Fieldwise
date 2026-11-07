import { PhoneCall, Smartphone } from 'lucide-react';
import { type FormEvent, type Ref, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { isPlausiblePhone } from './contact';

interface CallBoxProps {
  value: string;
  onChange: (value: string) => void;
  /** Rings this number. It goes to the API as typed; the API normalises it. */
  onCall: (to: string) => void;
  /** The ring request is on its way to the API. */
  placing: boolean;
  /** A call is ringing or being checked: the number is locked and the button disabled. */
  inProgress: boolean;
  /** Why the API wouldn't ring the number (its error.message). */
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
}

const FIELD_ID = 'call-phone';
const HINT_ID = 'call-phone-hint';
const ERROR_ID = 'call-phone-error';

/**
 * The main control on the homepage. The farmer types a mobile and we ring it; they describe the farm on the call
 * and the result comes back to this page. The number is checked loosely here and properly by the API.
 */
export function CallBox({
  value,
  onChange,
  onCall,
  placing,
  inProgress,
  error,
  inputRef,
}: CallBoxProps) {
  const [showErrors, setShowErrors] = useState(false);
  const formatError = isPlausiblePhone(value)
    ? undefined
    : 'Enter your mobile number, starting 08 or +353.';
  const shownError = (showErrors ? formatError : undefined) ?? error;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inProgress) return;
    setShowErrors(true);
    if (formatError) return;
    onCall(value.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cardClasses('surface', 'rounded-[1.75rem] p-4 shadow-raised sm:p-5')}
    >
      <label
        htmlFor={FIELD_ID}
        className="block px-1 font-display text-lg font-semibold text-brand-900"
      >
        Your mobile number
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Smartphone
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-brand-700"
          />
          <input
            ref={inputRef}
            id={FIELD_ID}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            readOnly={inProgress}
            placeholder="08X XXX XXXX"
            aria-invalid={shownError ? true : undefined}
            aria-describedby={shownError ? `${HINT_ID} ${ERROR_ID}` : HINT_ID}
            className={cn(
              'block min-h-13 w-full rounded-control border bg-white pr-4 pl-12 text-lg text-soil-900 tabular-nums outline-none transition duration-200 placeholder:text-soil-400 read-only:bg-cream-50 read-only:text-soil-600 focus:border-brand-500 focus:ring-4 focus:ring-brand-200 sm:text-xl',
              shownError ? 'border-red-400' : 'border-soil-200',
            )}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          loading={placing}
          disabled={inProgress}
          className="w-full sm:w-auto"
        >
          {placing ? (
            'Calling…'
          ) : inProgress ? (
            'On the call…'
          ) : (
            <>
              Call me
              <PhoneCall className="size-5" aria-hidden />
            </>
          )}
        </Button>
      </div>
      <p id={HINT_ID} className="mt-3 px-1 text-sm text-soil-600">
        We'll ring you now. Describe your farm on the call, and your grants show up on this page.
      </p>
      {shownError && (
        <p id={ERROR_ID} role="alert" className="mt-2 px-1 text-sm font-medium text-red-700">
          {shownError}
        </p>
      )}
    </form>
  );
}
