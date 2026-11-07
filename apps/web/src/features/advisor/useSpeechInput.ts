import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSpeechRecognition,
  joinTranscript,
  type SpeechError,
  type SpeechRecognitionLike,
  toSpeechError,
} from './speech';

interface SpeechInputOptions {
  /** Called with the box's full text while the farmer talks, so the words appear live. */
  onText: (text: string) => void;
  /** Called once with the final text when they pause (or tap stop). */
  onDone: (text: string) => void;
  lang?: string;
  /** How long a pause ends the dictation. */
  pauseMs?: number;
}

/**
 * Dictation into the advisor box with the browser's speech recogniser (Chrome needs internet for it).
 * Whatever is already in the box stays, and the spoken words are added after it.
 */
export function useSpeechInput({
  onText,
  onDone,
  lang = 'en-IE',
  pauseMs = 2000,
}: SpeechInputOptions) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<SpeechError | null>(null);
  const active = useRef<{ recognition: SpeechRecognitionLike; cancelled: boolean } | null>(null);
  const handlers = useRef({ onText, onDone });

  useEffect(() => {
    handlers.current = { onText, onDone };
  });

  useEffect(() => () => active.current?.recognition.abort(), []);

  const start = useCallback(
    (currentText: string) => {
      const Recognition = getSpeechRecognition();
      if (!Recognition || active.current) return;

      const recognition = new Recognition();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const session = { recognition, cancelled: false };
      const prefix = currentText.trim();
      let transcript = '';
      let failed = false;
      let pauseTimer: ReturnType<typeof setTimeout> | undefined;
      const fullText = () => [prefix, transcript].filter(Boolean).join(' ');

      recognition.onresult = (event) => {
        transcript = joinTranscript(event.results);
        handlers.current.onText(fullText());
        clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => recognition.stop(), pauseMs);
      };
      recognition.onerror = (event) => {
        failed = true;
        const problem = toSpeechError(event.error);
        if (problem && !session.cancelled) setError(problem);
      };
      recognition.onend = () => {
        clearTimeout(pauseTimer);
        if (active.current === session) active.current = null;
        setListening(false);
        if (!failed && !session.cancelled && transcript) handlers.current.onDone(fullText());
      };

      active.current = session;
      setError(null);
      setListening(true);
      try {
        recognition.start();
      } catch {
        active.current = null;
        setListening(false);
        setError('failed');
      }
    },
    [lang, pauseMs],
  );

  /** Stop listening and submit what was heard. */
  const stop = useCallback(() => {
    active.current?.recognition.stop();
  }, []);

  /** Stop listening and drop the dictation (used when the farmer submits by hand). */
  const cancel = useCallback(() => {
    if (!active.current) return;
    active.current.cancelled = true;
    active.current.recognition.abort();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    supported: getSpeechRecognition() !== undefined,
    listening,
    error,
    start,
    stop,
    cancel,
    clearError,
  };
}
