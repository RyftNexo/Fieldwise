import { ArrowRight } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { MicButton } from './MicButton';
import { SPEECH_ERROR_MESSAGES } from './speech';
import { useSpeechInput } from './useSpeechInput';

interface AskBoxProps {
  value: string;
  onChange: (value: string) => void;
  /** Runs the check with this text, typed or heard by the mic. */
  onSubmit: (text: string) => void;
  busy: boolean;
}

/**
 * The one big input. Enter submits and Shift+Enter adds a new line. Where the browser supports it, the mic fills
 * the box live as the farmer talks. When they pause it stops and hands the text back to check before anything runs,
 * because a misheard number ("40 acre" for "40 hectare") would give a confident wrong answer.
 */
export function AskBox({ value, onChange, onSubmit, busy }: AskBoxProps) {
  const box = useRef<HTMLTextAreaElement>(null);
  const [reviewing, setReviewing] = useState(false);
  const speech = useSpeechInput({
    onText: onChange,
    onDone: (text) => {
      onChange(text);
      setReviewing(true);
      const field = box.current;
      if (field) {
        field.focus();
        field.setSelectionRange(text.length, text.length);
      }
    },
  });
  const canSubmit = value.trim().length > 0 && !busy;

  function submitTyped() {
    if (!canSubmit) return;
    speech.cancel();
    setReviewing(false);
    onSubmit(value);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submitTyped();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submitTyped();
    }
  }

  function toggleMic() {
    if (speech.listening) speech.stop();
    else {
      setReviewing(false);
      speech.start(value);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cardClasses(
        'surface',
        'rounded-[1.75rem] shadow-raised transition duration-200 focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-200/70',
      )}
    >
      <label htmlFor="farm-description" className="sr-only">
        Describe your farm
      </label>
      <textarea
        ref={box}
        id="farm-description"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          if (speech.error) speech.clearError();
        }}
        onKeyDown={handleKeyDown}
        readOnly={speech.listening}
        aria-describedby={speech.error ? 'voice-error' : undefined}
        rows={3}
        placeholder="e.g. I have a 40-hectare beef farm in West Cork. 3 hectares by the river are too wet for the cattle…"
        className="block w-full resize-none rounded-t-[1.75rem] bg-transparent px-5 pt-5 pb-2 text-lg leading-relaxed text-soil-900 placeholder:text-soil-400 focus:outline-none sm:px-6 sm:text-xl"
      />
      <div className="flex items-center gap-3 px-3 pb-3 sm:pl-6">
        {speech.listening ? (
          <p className="flex items-center gap-2 text-sm font-medium text-red-700">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full bg-red-600 motion-safe:animate-pulse"
            />
            <span className="sm:hidden">Listening…</span>
            <span className="hidden sm:inline">Listening… pause when you're done</span>
          </p>
        ) : reviewing ? (
          <p className="text-sm font-semibold text-brand-700">Check the words, then press Enter</p>
        ) : (
          <p className="hidden text-sm text-soil-500 sm:block">
            Enter to check · Shift + Enter for a new line
          </p>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {speech.supported && (
            <MicButton listening={speech.listening} disabled={busy} onClick={toggleMic} />
          )}
          <Button type="submit" size="lg" disabled={!canSubmit} loading={busy}>
            {busy ? (
              'Checking…'
            ) : (
              <>
                Check my grants
                <ArrowRight className="size-5" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </div>
      {speech.error && (
        <p
          id="voice-error"
          role="alert"
          className="border-t border-soil-100 px-6 py-3 text-sm font-medium text-red-700"
        >
          {SPEECH_ERROR_MESSAGES[speech.error]}
        </p>
      )}
    </form>
  );
}
