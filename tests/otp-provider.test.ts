import { afterEach, describe, expect, it, vi } from 'vitest';
import { Msg91OtpProvider, OtpDeliveryError } from '@/lib/otp/provider';

describe('Msg91OtpProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends an app-generated OTP to MSG91 with an Indian country code', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ type: 'success' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const provider = new Msg91OtpProvider('auth-key', 'template-id');
    await provider.sendSms('9876543210', '123456', 'Your OTP is 123456');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url));
    expect(parsed.origin + parsed.pathname).toBe('https://control.msg91.com/api/v5/otp');
    expect(parsed.searchParams.get('template_id')).toBe('template-id');
    expect(parsed.searchParams.get('mobile')).toBe('919876543210');
    expect(parsed.searchParams.get('authkey')).toBe('auth-key');
    expect(parsed.searchParams.get('otp')).toBe('123456');
    expect(parsed.searchParams.get('response')).toBe('json');
    expect(init).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String(init.body))).toEqual({ OTP: '123456', otp: '123456' });
  });

  it('includes the configured MSG91 OTP template variable alias', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ type: 'success' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const provider = new Msg91OtpProvider('auth-key', 'template-id', 'VAR1');
    await provider.sendSms('9876543210', '123456', 'Your OTP is 123456');

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init.body))).toEqual({ OTP: '123456', otp: '123456', VAR1: '123456' });
  });

  it('rejects invalid Indian mobile numbers before calling MSG91', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const provider = new Msg91OtpProvider('auth-key', 'template-id');

    await expect(provider.sendSms('12345', '123456', 'message')).rejects.toBeInstanceOf(OtpDeliveryError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a delivery error for unsuccessful MSG91 responses without exposing provider details', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ type: 'error', message: 'invalid auth key' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const provider = new Msg91OtpProvider('auth-key', 'template-id');

    await expect(provider.sendSms('9876543210', '123456', 'message')).rejects.toThrow('OTP delivery failed');
  });
});
