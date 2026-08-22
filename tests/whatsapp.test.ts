import { afterEach, describe, expect, it, vi } from 'vitest';
import { getConfiguredWhatsAppNumber, getWhatsAppUrl, sanitizeWhatsAppNumber } from '@/lib/whatsapp';

describe('WhatsApp click-to-chat helper', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sanitizes configured phone numbers to digits only', () => {
    expect(sanitizeWhatsAppNumber('+91 98765-43210')).toBe('919876543210');
  });

  it('builds an encoded wa.me URL for multiline messages', () => {
    const result = getWhatsAppUrl('Hello SIVORA UPRISING,\nI need partner support.', '91 98765 43210');

    expect(result.available).toBe(true);
    if (!result.available) throw new Error('Expected WhatsApp URL to be available');
    expect(result.url).toBe(
      'https://wa.me/919876543210?text=Hello+SIVORA UPRISING%2C%0AI+need+partner+support.',
    );
  });

  it('returns unavailable when the configured number is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '');

    expect(getConfiguredWhatsAppNumber()).toBeNull();
    expect(getWhatsAppUrl('Hello')).toEqual({ available: false, url: null, number: null });
  });

  it('returns unavailable for invalid phone numbers', () => {
    expect(sanitizeWhatsAppNumber('123')).toBeNull();
    expect(getWhatsAppUrl('Hello', '123')).toEqual({ available: false, url: null, number: null });
  });
});
