import { describe, expect, it } from 'vitest';
import { getSpeechRecognition, joinTranscript, tidyTranscript, toSpeechError } from './speech';

describe('joinTranscript', () => {
  it('joins final and interim results into one tidy string', () => {
    expect(
      joinTranscript([
        [{ transcript: 'I have a 40-hectare' }],
        [{ transcript: ' suckler beef farm ' }],
        [{ transcript: '  in West Cork' }],
      ]),
    ).toBe('I have a 40-hectare suckler beef farm in West Cork');
  });

  it('returns an empty string before anything is heard', () => {
    expect(joinTranscript([])).toBe('');
  });
});

describe('toSpeechError', () => {
  it('maps browser error codes to messages we can show', () => {
    expect(toSpeechError('not-allowed')).toBe('blocked');
    expect(toSpeechError('service-not-allowed')).toBe('blocked');
    expect(toSpeechError('audio-capture')).toBe('no-mic');
    expect(toSpeechError('network')).toBe('network');
    expect(toSpeechError('no-speech')).toBe('no-speech');
    expect(toSpeechError('language-not-supported')).toBe('failed');
  });

  it('treats our own cancel as no error', () => {
    expect(toSpeechError('aborted')).toBeNull();
  });
});

describe('getSpeechRecognition', () => {
  it('reports no support outside a browser', () => {
    expect(getSpeechRecognition()).toBeUndefined();
  });
});

describe('tidyTranscript', () => {
  it('fixes the slips from the stage-laptop test', () => {
    expect(
      tidyTranscript('West Cork tree acres and Exeter river which are two wet for cattle'),
    ).toBe('West Cork three acres and Exeter river which are too wet for cattle');
    expect(tidyTranscript('Tree hectares to wet')).toBe('three hectares too wet');
  });

  it('leaves everything else alone', () => {
    const said = 'I planted a tree. Two fields, two acres, to the river';
    expect(tidyTranscript(said)).toBe(said);
  });
});
