import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Twilio signs the public URL plus the sorted form fields with the auth token.
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export function signTwilioWebhook(
  url: string,
  params: Record<string, string>,
  authToken: string,
): string {
  const payload = Object.keys(params)
    .sort()
    .reduce((data, key) => data + key + params[key], url);
  return createHmac('sha1', authToken).update(Buffer.from(payload, 'utf8')).digest('base64');
}

export function isValidTwilioSignature(input: {
  authToken: string;
  signature: string | undefined;
  url: string;
  params: Record<string, string>;
}): boolean {
  if (!input.signature) return false;
  const expected = signTwilioWebhook(input.url, input.params, input.authToken);
  const actual = Buffer.from(input.signature);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length) return false;
  return timingSafeEqual(actual, wanted);
}

/** URLs Twilio might have signed. A tunnel keeps the public host off the local request URL. */
export function webhookUrls(input: {
  requestUrl: string;
  forwardedProto?: string;
  forwardedHost?: string;
  publicBase?: string;
}): string[] {
  const request = new URL(input.requestUrl);
  const path = `${request.pathname}${request.search}`;
  const urls = new Set<string>([request.toString()]);

  if (input.publicBase) {
    urls.add(`${input.publicBase.replace(/\/$/u, '')}${path}`);
  }

  const host = input.forwardedHost?.split(',')[0]?.trim();
  if (host) {
    const proto = input.forwardedProto?.split(',')[0]?.trim() || 'https';
    urls.add(`${proto}://${host}${path}`);
  }

  return [...urls];
}
