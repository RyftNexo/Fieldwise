const voiceName = 'Polly.Niamh';
const voiceLanguage = 'en-IE';
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
  return `<Say language="${voiceLanguage}" voice="${voiceName}">${escapeXml(text)}</Say>`;
}

function document(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

/** Prompt, then listen. `action` is where Twilio posts the transcript. */
export function gatherTwiml(prompt: string, action: string): string {
  const gather = [
    `<Gather input="speech" language="${voiceLanguage}"`,
    ' speechTimeout="auto" timeout="10" speechModel="phone_call"',
    ` action="${escapeXml(action)}" method="POST" hints="${escapeXml(speechHints)}">`,
    say(prompt),
    '</Gather>',
    say("We didn't hear anything. Please call again."),
  ].join('');
  return document(gather);
}

/** Read the result, then end the call. One spoken turn, no follow-up chat. */
export function hangupTwiml(text: string): string {
  return document(`${say(text)}<Hangup/>`);
}
