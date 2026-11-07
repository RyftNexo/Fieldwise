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
        'focus-ring relative inline-flex size-13 shrink-0 cursor-pointer items-center justify-center rounded-control border transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        listening
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-soil-200 bg-white text-brand-800 shadow-card hover:border-brand-300 hover:bg-brand-50',
      )}
    >
      {listening && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-control ring-4 ring-red-400/30 motion-safe:animate-pulse"
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
