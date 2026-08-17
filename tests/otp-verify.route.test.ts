import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { student: { findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock('@/lib/auth/session', () => ({ createSession: vi.fn() }));
vi.mock('@/lib/locale', () => ({ syncLocaleFromProfile: vi.fn() }));
// Keep otpErrorCode real; stub only verifyOtp (DB-backed).
vi.mock('@/lib/auth/otp', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/otp')>();
  return { ...actual, verifyOtp: vi.fn() };
});

import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { verifyOtp } from '@/lib/auth/otp';
import { POST } from '@/app/api/auth/otp/verify/route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;
const verifyOtpMock = vi.mocked(verifyOtp);

function req(body: unknown) {
  return new Request('http://localhost/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/auth/otp/verify', () => {
  it('verifies registration, marks the student verified, and starts a session', async () => {
    p.student.findUnique.mockResolvedValue({
      id: 's1',
      name: 'Ravi',
      isMobileVerified: false,
      preferredLanguage: 'en',
    });
    p.student.update.mockResolvedValue({});
    verifyOtpMock.mockResolvedValue('ok');

    const res = await POST(req({ mobile: '9876543210', otp: '123456', purpose: 'REGISTRATION' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.redirect).toBe('/student');
    expect(p.student.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isMobileVerified: true } }),
    );
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 's1', kind: 'student', role: 'STUDENT' }),
    );
  });

  it('rejects a wrong OTP without creating a session', async () => {
    p.student.findUnique.mockResolvedValue({
      id: 's1',
      name: 'Ravi',
      isMobileVerified: false,
      preferredLanguage: 'en',
    });
    verifyOtpMock.mockResolvedValue('invalid');

    const res = await POST(req({ mobile: '9876543210', otp: '000000', purpose: 'REGISTRATION' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('otpInvalid');
    expect(createSession).not.toHaveBeenCalled();
    expect(p.student.update).not.toHaveBeenCalled();
  });

  it('returns accountNotFound when no student matches the mobile', async () => {
    p.student.findUnique.mockResolvedValue(null);

    const res = await POST(req({ mobile: '9876543210', otp: '123456', purpose: 'LOGIN' }));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe('accountNotFound');
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it('marks an unverified mobile verified after a successful login OTP', async () => {
    p.student.findUnique.mockResolvedValue({
      id: 's1',
      name: 'Ravi',
      isMobileVerified: false,
      preferredLanguage: 'en',
    });
    p.student.update.mockResolvedValue({});
    verifyOtpMock.mockResolvedValue('ok');

    const res = await POST(req({ mobile: '9876543210', otp: '123456', purpose: 'LOGIN' }));

    expect(res.status).toBe(200);
    expect(p.student.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isMobileVerified: true } }),
    );
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 's1', kind: 'student', role: 'STUDENT' }),
    );
  });
});
