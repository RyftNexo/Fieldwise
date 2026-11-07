import { Mic, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MicButtonProps {
  listening: boolean;
  disabled: boolean;
  onClick: () => void;
}

/** Tap to talk; tap again to stop early. The page hides it where the browser can't do speech. */
export function MicButton({ listening, disabled, onClick }: MicButtonProps) {
  const label = listening ? 'Stop listening' : 'Speak instead of typing';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex size-12 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50',
        listening
          ? 'border-red-300 bg-red-50 text-red-700'
          : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100',
      )}
    >
      {listening && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl ring-4 ring-red-400/30 motion-safe:animate-pulse"
        />
      )}
      {listening ? (
        <Square className="size-4 fill-current" aria-hidden />
      ) : (
        <Mic className="size-5" aria-hidden />
      )}
    </button>
  );
}
