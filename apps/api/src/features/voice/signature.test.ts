import { describe, expect, it } from 'vitest';
import { isValidTwilioSignature, signTwilioWebhook, webhookUrls } from './signature';

describe('signTwilioWebhook', () => {
  it('matches the documented HMAC of the URL plus sorted form fields', () => {
    const url = 'https://mycompany.com/myapp.php?foo=1&bar=2';
    const params = {
      Digits: '1234',
      To: '+18005551212',
      From: '+14158675310',
      Caller: '+14158675310',
      CallSid: 'CA1234567890ABCDE',
    };
    expect(signTwilioWebhook(url, params, '12345')).toBe('GvWf1cFY/Q7PnoempGyD5oXAezc=');
    expect(
      isValidTwilioSignature({
        authToken: '12345',
        signature: 'GvWf1cFY/Q7PnoempGyD5oXAezc=',
        url,
        params,
      }),
    ).toBe(true);
    expect(
      isValidTwilioSignature({
        authToken: '12345',
        signature: 'not-the-signature',
        url,
        params,
      }),
    ).toBe(false);
  });
});

describe('webhookUrls', () => {
  it('keeps the request URL and the tunnel origin Twilio actually called', () => {
    expect(
      webhookUrls({
        requestUrl: 'http://localhost:8787/api/voice/incoming',
        forwardedProto: 'https',
        forwardedHost: 'demo.trycloudflare.com',
        publicBase: 'https://grantguide.example/',
      }),
    ).toEqual([
      'http://localhost:8787/api/voice/incoming',
      'https://grantguide.example/api/voice/incoming',
      'https://demo.trycloudflare.com/api/voice/incoming',
    ]);
  });
});
