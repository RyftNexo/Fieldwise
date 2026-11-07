// Minimal types for the Web Speech API. Chrome ships it as `webkitSpeechRecognition`, and TypeScript's DOM lib
// doesn't describe it, so we declare only what we use.
export interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

export interface SpeechRecognitionResultLike extends ArrayLike<SpeechRecognitionAlternativeLike> {
  isFinal: boolean;
}

export interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

export interface SpeechRecognitionErrorEventLike {
  error: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

/** The browser's speech recogniser, or undefined where there isn't one (Firefox, many in-app browsers). */
export function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

/** Everything heard so far (final and interim results) as one tidy string. */
export function joinTranscript(
  results: ArrayLike<ArrayLike<SpeechRecognitionAlternativeLike>>,
): string {
  let text = '';
  for (let index = 0; index < results.length; index += 1) {
    text += ` ${results[index]?.[0]?.transcript ?? ''}`;
  }
  return text.replace(/\s+/g, ' ').trim();
}

// Mishearings we saw in testing that change a number or read as one. Kept narrow on purpose: only patterns a farmer
// would never mean, so nothing they actually said gets rewritten.
const TRANSCRIPT_FIXES: [RegExp, string][] = [
  [/\btree (acres?|hectares?)\b/gi, 'three $1'],
  [/\b(?:two|to) wet\b/gi, 'too wet'],
];

/** Fixes the few speech-recognition slips that would feed a wrong number into the rules. */
export function tidyTranscript(text: string): string {
  return TRANSCRIPT_FIXES.reduce(
    (fixed, [pattern, replacement]) => fixed.replace(pattern, replacement),
    text,
  );
}

export type SpeechError = 'blocked' | 'no-mic' | 'network' | 'no-speech' | 'failed';

/** Maps the browser's error code to what we tell the farmer. `aborted` means we cancelled, so it's not an error. */
export function toSpeechError(code: string): SpeechError | null {
  switch (code) {
    case 'aborted':
      return null;
    case 'not-allowed':
    case 'service-not-allowed':
      return 'blocked';
    case 'audio-capture':
      return 'no-mic';
    case 'network':
      return 'network';
    case 'no-speech':
      return 'no-speech';
    default:
      return 'failed';
  }
}

export const SPEECH_ERROR_MESSAGES: Record<SpeechError, string> = {
  blocked: 'The microphone is blocked. Allow it from the icon in the address bar, or type instead.',
  'no-mic': "We couldn't find a microphone. Type instead, or pick an example.",
  network: 'Voice needs an internet connection. Type instead, or pick an example.',
  'no-speech': "We didn't hear anything. Tap the mic and try again.",
  failed: 'Voice input stopped working. Type instead, or pick an example.',
};
