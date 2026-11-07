/**
 * Recognition and the spoken voice are separate.
 * `phone_call` does not support en-IE, and it rejects speechTimeout="auto".
 * en-GB is on the documented phone_call list. Polly Niamh still speaks en-IE.
 * https://www.twilio.com/docs/voice/twiml/gather#speechmodel
 */
export const gatherLanguage = 'en-GB';
export const gatherSpeechModel = 'phone_call';
export const gatherSpeechTimeout = '3';
export const sayLanguage = 'en-IE';
export const sayVoice = 'Polly.Niamh';

/** Seconds of call audio between result polls. This is not the webhook's HTTP time. */
export const voicePauseSeconds = 4;
/**
 * How many result polls we will answer before giving up.
 * 12 pauses of 4 seconds cover two OpenAI calls at the 20 second client timeout.
 */
export const voiceMaxPolls = 12;

const speechHints = [
  'hectares',
  'suckler',
  'dairy',
  'sheep',
  'tillage',
  'West Cork',
  'forestry',
  'river',
  'wet land',
].join(', ');

export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function say(text: string): string {
  return `<Say language="${sayLanguage}" voice="${sayVoice}">${escapeXml(text)}</Say>`;
}

function document(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

/** Prompt, then listen. Silence posts to `action` because actionOnEmptyResult is true. */
export function gatherTwiml(prompt: string, action: string): string {
  const gather = [
    '<Gather input="speech"',
    ` language="${gatherLanguage}"`,
    ` speechTimeout="${gatherSpeechTimeout}"`,
    ' timeout="10"',
    ` speechModel="${gatherSpeechModel}"`,
    ' actionOnEmptyResult="true"',
    ` action="${escapeXml(action)}" method="POST"`,
    ` hints="${escapeXml(speechHints)}">`,
    say(prompt),
    '</Gather>',
  ].join('');
  return document(gather);
}

/**
 * Hold the line without holding the HTTP request. Twilio's voice webhook limit is 15 seconds;
 * the Pause happens on the call after this response has already been sent.
 */
export function waitTwiml(poll: number): string {
  const next = `/api/voice/result?poll=${poll}`;
  const hold = [
    `<Pause length="${voicePauseSeconds}"/>`,
    `<Redirect method="POST">${escapeXml(next)}</Redirect>`,
  ].join('');
  if (poll === 1) return document(`${say("I'm checking the schemes. One moment.")}${hold}`);
  return document(hold);
}

/** Read the result, then end the call. One spoken turn, no follow-up chat. */
export function hangupTwiml(text: string): string {
  return document(`${say(text)}<Hangup/>`);
}
