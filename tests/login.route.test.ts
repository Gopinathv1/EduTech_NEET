import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { student: { findUnique: vi.fn() } },
}));
vi.mock('@/lib/auth/otp-service', () => ({ requestOtp: vi.fn() }));
vi.mock('@/lib/auth/rate-limit', () => ({
  enforceRateLimit: vi.fn(async () => null),
  clientIp: vi.fn(() => '127.0.0.1'),
}));

import { prisma } from '@/lib/prisma';
import { requestOtp } from '@/lib/auth/otp-service';
import { POST } from '@/app/api/auth/login/route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;
const requestOtpMock = vi.mocked(requestOtp);

function req(body: unknown) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/auth/login', () => {
  it('sends a login OTP to a registered mobile number', async () => {
    p.student.findUnique.mockResolvedValue({
      id: 's1',
      name: 'Ravi',
      mobile: '9876543210',
      email: 'ravi@example.com',
      preferredLanguage: 'ta',
    });
    requestOtpMock.mockResolvedValue({ ok: true, expiresAt: new Date(), devOtp: '123456' });

    const res = await POST(req({ mobile: '+91 98765-43210' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.mobile).toBe('9876543210');
    expect(json.devOtp).toBe('123456');
    expect(p.student.findUnique).toHaveBeenCalledWith({ where: { mobile: '9876543210' } });
    expect(requestOtpMock).toHaveBeenCalledWith('9876543210', 'LOGIN', {
      email: 'ravi@example.com',
      language: 'ta',
    });
  });

  it('returns accountNotFound when the mobile is not registered', async () => {
    p.student.findUnique.mockResolvedValue(null);

    const res = await POST(req({ mobile: '9876543210' }));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe('accountNotFound');
    expect(requestOtpMock).not.toHaveBeenCalled();
  });

  it('returns a validation error for invalid mobile input', async () => {
    const res = await POST(req({ mobile: 'not-a-mobile' }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('validation');
    expect(p.student.findUnique).not.toHaveBeenCalled();
  });

  it('returns rateLimited when OTP creation is throttled', async () => {
    p.student.findUnique.mockResolvedValue({
      id: 's1',
      mobile: '9876543210',
      email: null,
      preferredLanguage: 'en',
    });
    requestOtpMock.mockResolvedValue({
      ok: false,
      reason: 'rate_limited',
      retryAfterSeconds: 60,
    });

    const res = await POST(req({ mobile: '9876543210' }));
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toBe('rateLimited');
    expect(json.retryAfterSeconds).toBe(60);
  });

  it('returns otpDeliveryFailed when the provider cannot send the OTP', async () => {
    p.student.findUnique.mockResolvedValue({
      id: 's1',
      mobile: '9876543210',
      email: null,
      preferredLanguage: 'en',
    });
    requestOtpMock.mockResolvedValue({ ok: false, reason: 'delivery_failed' });

    const res = await POST(req({ mobile: '9876543210' }));
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.error).toBe('otpDeliveryFailed');
  });
});
