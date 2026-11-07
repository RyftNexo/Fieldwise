import { ArrowRight, LoaderCircle } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useRef, useState } from 'react';
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
      className="rounded-2xl border border-stone-300 bg-white shadow-sm transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15"
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
        className="block w-full resize-none rounded-t-2xl bg-transparent px-5 pt-4 pb-2 text-lg leading-relaxed text-stone-900 placeholder:text-stone-400 focus:outline-none"
      />
      <div className="flex items-center gap-3 px-3 pb-3 sm:pl-5">
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
          <p className="text-sm font-medium text-brand-800">Check the words, then press Enter</p>
        ) : (
          <p className="hidden text-xs text-stone-500 sm:block">
            Enter to check · Shift + Enter for a new line
          </p>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {speech.supported && (
            <MicButton listening={speech.listening} disabled={busy} onClick={toggleMic} />
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <>
                <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden />
                Checking…
              </>
            ) : (
              <>
                Check my grants
                <ArrowRight className="size-5" aria-hidden />
              </>
            )}
          </button>
        </div>
      </div>
      {speech.error && (
        <p
          id="voice-error"
          role="alert"
          className="border-t border-stone-200 px-5 py-3 text-sm text-red-700"
        >
          {SPEECH_ERROR_MESSAGES[speech.error]}
        </p>
      )}
    </form>
  );
}
