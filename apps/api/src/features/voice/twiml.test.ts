import { describe, expect, it } from 'vitest';
import { gatherLanguage, gatherSpeechTimeout, gatherTwiml, sayLanguage } from './twiml';

describe('gatherTwiml', () => {
  it('uses a Gather configuration Twilio documents for a phone call', () => {
    const body = gatherTwiml('Describe the farm.', '/api/voice/advice?attempt=1');
    const gatherStart = body.indexOf('<Gather');
    const gather = body.slice(gatherStart, body.indexOf('>', gatherStart));

    expect(gatherLanguage).toBe('en-GB');
    expect(gatherSpeechTimeout).toBe('3');
    expect(gather).toContain(`language="${gatherLanguage}"`);
    expect(gather).toContain(`speechTimeout="${gatherSpeechTimeout}"`);
    expect(gather).toContain('actionOnEmptyResult="true"');
    expect(gather).not.toContain('speechModel=');
    expect(gather).not.toContain('Polly.');

    const sayStart = body.indexOf('<Say');
    const say = body.slice(sayStart, body.indexOf('>', sayStart));
    expect(say).toContain(`language="${sayLanguage}"`);
    expect(say).not.toContain('voice=');
    expect(sayLanguage).toBe('en-GB');
  });
});
