import { cn } from '@/lib/utils';

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: 'text' | 'tel' | 'email';
  autoComplete?: string;
  maxLength?: number;
}

/** Labelled text input with helper text and an error right under the field. 48px tall for touch. */
export function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = 'text',
  autoComplete,
  maxLength,
}: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-soil-800">
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
        aria-describedby={describedBy || undefined}
        className={cn(
          'mt-1.5 block min-h-12 w-full rounded-control border bg-white px-3.5 text-base text-soil-900 outline-none transition duration-200 placeholder:text-soil-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-200',
          error ? 'border-red-400' : 'border-soil-200',
        )}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1 text-sm text-soil-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
