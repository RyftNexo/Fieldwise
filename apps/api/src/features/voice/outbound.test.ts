import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../../env';
import { AppError } from '../../lib/http';
import { placeOutboundCall } from './outbound';

const original = {
  sid: env.TWILIO_ACCOUNT_SID,
  token: env.TWILIO_AUTH_TOKEN,
  from: env.TWILIO_FROM_NUMBER,
  publicBase: env.TWILIO_PUBLIC_BASE,
};

afterEach(() => {
  env.TWILIO_ACCOUNT_SID = original.sid;
  env.TWILIO_AUTH_TOKEN = original.token;
  env.TWILIO_FROM_NUMBER = original.from;
  env.TWILIO_PUBLIC_BASE = original.publicBase;
});

function readyLine() {
  env.TWILIO_ACCOUNT_SID = 'ACtest';
  env.TWILIO_AUTH_TOKEN = 'test-token';
  env.TWILIO_FROM_NUMBER = '+4915888620339';
  env.TWILIO_PUBLIC_BASE = 'https://demo.trycloudflare.com';
}

describe('placeOutboundCall', () => {
  it('asks Twilio to dial the lead and then open the voice webhook', async () => {
    readyLine();
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      Response.json({ sid: 'CA123' }),
    );
    await expect(placeOutboundCall('+353871234567', { fetchImpl })).resolves.toBe('CA123');

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toBe('https://api.twilio.com/2010-04-01/Accounts/ACtest/Calls.json');
    const body = String(init?.body);
    expect(body).toContain('To=%2B353871234567');
    expect(body).toContain('From=%2B4915888620339');
    expect(body).toContain('Url=https%3A%2F%2Fdemo.trycloudflare.com%2Fapi%2Fvoice%2Fincoming');
    expect(body).not.toContain('Method=');
    const headers = init?.headers as Record<string, string>;
    expect(headers.authorization).toBe(
      `Basic ${Buffer.from('ACtest:test-token').toString('base64')}`,
    );
  });

  it('uses Twilio’s speech template until this API has a public address', async () => {
    readyLine();
    env.TWILIO_PUBLIC_BASE = undefined;
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      Response.json({ sid: 'CA456' }),
    );
    await placeOutboundCall('+353871234567', { fetchImpl });
    const body = String(fetchImpl.mock.calls[0]?.[1]?.body);
    expect(body).toContain(
      'Url=https%3A%2F%2Fwebhooks.twilio.com%2Fv1%2FVoice%2FTemplate%2Fvoice_speech_recognition',
    );
  });

  it('does not call Twilio when the line has no number to call from', async () => {
    readyLine();
    env.TWILIO_FROM_NUMBER = undefined;
    const fetchImpl = vi.fn();
    await expect(placeOutboundCall('+353871234567', { fetchImpl })).rejects.toBeInstanceOf(
      AppError,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('says when a trial account has not verified the mobile', async () => {
    readyLine();
    const fetchImpl = vi.fn(async () => Response.json({ code: 21219 }, { status: 400 }));
    const error = await placeOutboundCall('+353871234567', { fetchImpl }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).message).toContain('verified');
  });
});
