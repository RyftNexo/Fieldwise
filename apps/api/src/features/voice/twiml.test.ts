import { describe, expect, it } from 'vitest';
import {
  gatherLanguage,
  gatherSpeechModel,
  gatherSpeechTimeout,
  gatherTwiml,
  sayLanguage,
  sayVoice,
} from './twiml';

describe('gatherTwiml', () => {
  it('uses a Gather configuration Twilio documents for a phone call', () => {
    const body = gatherTwiml('Describe the farm.', '/api/voice/advice?attempt=1');
    const gatherStart = body.indexOf('<Gather');
    const gather = body.slice(gatherStart, body.indexOf('>', gatherStart));

    expect(gatherLanguage).toBe('en-GB');
    expect(gatherSpeechModel).toBe('phone_call');
    expect(gatherSpeechTimeout).toMatch(/^[1-9]\d*$/u);
    expect(gather).toContain(`language="${gatherLanguage}"`);
    expect(gather).toContain(`speechModel="${gatherSpeechModel}"`);
    expect(gather).toContain(`speechTimeout="${gatherSpeechTimeout}"`);
    expect(gather).toContain('actionOnEmptyResult="true"');
    expect(gather).not.toContain('en-IE');
    expect(gather).not.toContain('speechTimeout="auto"');

    const sayStart = body.indexOf('<Say');
    const say = body.slice(sayStart, body.indexOf('>', sayStart));
    expect(say).toContain(`language="${sayLanguage}"`);
    expect(say).toContain(`voice="${sayVoice}"`);
    expect(sayLanguage).toBe('en-IE');
    expect(sayVoice).toBe('Polly.Niamh');
  });
});
