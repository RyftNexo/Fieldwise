import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent';
export type ButtonSize = 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-white shadow-card hover:bg-brand-800',
  secondary:
    'border border-soil-200 bg-white text-soil-900 shadow-card hover:border-brand-300 hover:bg-brand-50',
  ghost: 'text-brand-800 hover:bg-brand-50',
  accent: 'bg-harvest-300 text-harvest-900 shadow-card hover:bg-harvest-200',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-[0.95rem]',
  lg: 'min-h-13 px-6 text-base',
};

/** Classes for anything that should look like a button (also used on links). Every size is at least 44px tall. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    'focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-control font-semibold transition duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.98]',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Disables the button and shows a spinner while an action runs. */
  loading?: boolean;
}

export function Button({
  variant,
  size,
  loading = false,
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
    >
      {loading && <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
