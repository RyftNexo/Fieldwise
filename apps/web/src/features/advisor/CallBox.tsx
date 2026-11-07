import { ArrowRight } from 'lucide-react';
import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type Ref,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { irishLocalDigits, isCompleteIrishMobile, toIrishE164 } from './contact';

interface CallBoxProps {
  value: string;
  onChange: (value: string) => void;
  onCall: (to: string) => void;
  placing: boolean;
  inProgress: boolean;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
}

const DIGIT_COUNT = 9;
const DIGIT_IDS = Array.from({ length: DIGIT_COUNT }, (_, index) => `phone-digit-${index + 1}`);
const HINT_ID = 'call-phone-hint';
const ERROR_ID = 'call-phone-error';

function setRef(ref: Ref<HTMLInputElement> | undefined, node: HTMLInputElement | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}

/** A nine-cell Irish mobile field matching the homepage design while preserving the existing call flow. */
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
  const fields = useRef<Array<HTMLInputElement | null>>([]);
  const digits = irishLocalDigits(value);
  const formatError = isCompleteIrishMobile(value)
    ? undefined
    : 'Enter all 9 digits of your Irish mobile number, beginning with 8.';
  const shownError = (showErrors ? formatError : undefined) ?? error;

  function commit(nextDigits: string) {
    onChange(toIrishE164(nextDigits));
    if (showErrors) setShowErrors(false);
  }

  function enterDigits(index: number, input: string) {
    const incoming = irishLocalDigits(input);
    if (!incoming) return;
    const next = digits.split('');
    incoming.split('').forEach((digit, offset) => {
      if (index + offset < DIGIT_COUNT) next[index + offset] = digit;
    });
    const joined = next
      .filter((digit) => digit !== undefined && digit !== '')
      .join('')
      .slice(0, DIGIT_COUNT);
    commit(joined);
    fields.current[Math.min(index + incoming.length, DIGIT_COUNT - 1)]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      fields.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < DIGIT_COUNT - 1) {
      event.preventDefault();
      fields.current[index + 1]?.focus();
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      const next = digits.split('');
      const removeAt = next[index] ? index : Math.max(index - 1, 0);
      next.splice(removeAt, 1);
      commit(next.join(''));
      fields.current[removeAt]?.focus();
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    enterDigits(index, event.clipboardData.getData('text'));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inProgress) return;
    setShowErrors(true);
    if (formatError) return;
    onCall(toIrishE164(value));
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset
        disabled={inProgress}
        aria-describedby={shownError ? `${HINT_ID} ${ERROR_ID}` : HINT_ID}
        className={cn(
          'flex min-w-0 flex-col gap-5 rounded-[1.75rem] border bg-gradient-to-br from-white via-cream-50 to-brand-50 p-4 shadow-card transition sm:p-8 lg:flex-row lg:items-center lg:gap-9 lg:px-8',
          shownError ? 'border-red-400' : 'border-brand-200',
        )}
      >
        <legend className="sr-only">Your Irish mobile number</legend>
        <label className="flex min-h-14 shrink-0 items-center gap-3 border-soil-200 px-1 text-xl font-semibold text-soil-900 lg:min-h-[4.75rem] lg:w-[13.5rem] lg:border-r lg:pr-8">
          <span className="sr-only">Country code</span>
          <select
            aria-label="Country code"
            className="focus-ring w-full cursor-pointer appearance-auto rounded-lg bg-white px-1 py-3 text-xl font-semibold outline-none disabled:cursor-not-allowed"
            defaultValue="IE"
          >
            <option value="IE">IE (+353)</option>
          </select>
        </label>

        <div className="grid min-w-0 flex-1 grid-cols-9 gap-1.5 sm:gap-3.5">
          {DIGIT_IDS.map((id, index) => (
            <input
              key={id}
              id={id}
              ref={(node) => {
                fields.current[index] = node;
                if (index === 0) setRef(inputRef, node);
              }}
              type="tel"
              inputMode="numeric"
              autoComplete={index === 0 ? 'tel-national' : 'off'}
              value={digits[index] ?? ''}
              onChange={(event) => enterDigits(index, event.currentTarget.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={(event) => handlePaste(index, event)}
              readOnly={inProgress}
              maxLength={DIGIT_COUNT}
              aria-label={`Phone number digit ${index + 1} of ${DIGIT_COUNT}`}
              aria-invalid={shownError ? true : undefined}
              className="focus-ring h-14 min-w-0 rounded-xl border border-brand-200 bg-white text-center text-xl font-medium text-brand-950 tabular-nums outline-none transition placeholder:text-brand-300 read-only:bg-brand-50 focus:border-harvest-400 focus:bg-harvest-50 sm:h-[5.25rem] sm:rounded-2xl sm:text-2xl"
              placeholder="–"
            />
          ))}
        </div>
      </fieldset>

      <p id={HINT_ID} className="sr-only">
        Enter the nine digits after plus three five three. We will ring you to hear your farm
        details.
      </p>
      {shownError && (
        <p id={ERROR_ID} role="alert" className="mt-3 text-center text-sm font-medium text-red-700">
          {shownError}
        </p>
      )}

      <div className="mx-auto mt-8 max-w-[35rem] sm:mt-16">
        <Button
          type="submit"
          size="lg"
          loading={placing}
          disabled={inProgress}
          className="min-h-[5.25rem] w-full rounded-[1.35rem] bg-gradient-to-br from-brand-800 to-brand-700 text-xl shadow-raised hover:from-brand-900 hover:to-brand-800 sm:text-2xl"
        >
          {placing ? (
            'Calling…'
          ) : inProgress ? (
            'On the call…'
          ) : (
            <>
              Get started
              <ArrowRight className="size-7" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
