import { env } from '../../env';
import { escapeXml } from './twiml';

/** A Call button on the API, because the forester Ring link belongs to dev1. */
export function callPageHtml(): string {
  const to = escapeXml(env.TWILIO_RING_TO ?? '');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Call GrantGuide</title>
  <style>
    body { font-family: Georgia, serif; margin: 0; background: #faf7f2; color: #1c1917; }
    main { max-width: 28rem; margin: 4rem auto; padding: 0 1.25rem; }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    p { line-height: 1.5; }
    label { display: block; font-size: 0.9rem; margin-top: 1.5rem; }
    input { width: 100%; box-sizing: border-box; margin-top: 0.35rem; padding: 0.7rem 0.8rem; font-size: 1rem; }
    button { margin-top: 1rem; background: #3f6212; color: white; border: 0; border-radius: 0.75rem; padding: 0.8rem 1.2rem; font-size: 1rem; font-weight: 700; }
    button:disabled { opacity: 0.6; }
    #status { min-height: 3rem; }
  </style>
</head>
<body>
  <main>
    <h1>Call GrantGuide</h1>
    <p>Answer the phone, describe the farm, and the advice line reads back the grants.</p>
    <label for="to">Mobile to ring</label>
    <input id="to" name="to" value="${to}" autocomplete="tel" />
    <button id="call" type="button">Call</button>
    <p id="status" role="status">Answer the phone, describe the farm, and the result shows here.</p>
    <p id="result"></p>
  </main>
  <script>
    const button = document.getElementById('call');
    const status = document.getElementById('status');
    const result = document.getElementById('result');
    let pollTimer = 0;

    button.addEventListener('click', async () => {
      button.disabled = true;
      window.clearInterval(pollTimer);
      result.textContent = '';
      status.textContent = 'Calling…';
      try {
        const response = await fetch('/api/voice/ring', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ to: document.getElementById('to').value }),
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          status.textContent = body && body.error ? body.error.message : 'The call could not be placed.';
          button.disabled = false;
          return;
        }
        status.textContent = 'Ringing. Answer, then describe the farm.';
        pollTimer = window.setInterval(() => pollCall(body.data.callSid), 2000);
      } catch {
        status.textContent = 'The call could not be placed.';
        button.disabled = false;
      }
    });

    async function pollCall(callSid) {
      try {
        const response = await fetch('/api/voice/calls/' + encodeURIComponent(callSid));
        const body = await response.json().catch(() => null);
        const call = body && body.data;
        if (!call) return;
        if (call.state === 'pending') status.textContent = 'Checking the schemes…';
        if (call.state === 'failed') {
          window.clearInterval(pollTimer);
          status.textContent = call.failure || 'The call could not be checked.';
          button.disabled = false;
        }
        if (call.state === 'done') {
          window.clearInterval(pollTimer);
          status.textContent = 'Here is what the phone is reading back.';
          result.textContent = call.script || '';
          button.disabled = false;
        }
      } catch {
        // The next poll can still pick the result up.
      }
    }
  </script>
</body>
</html>`;
}
