import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: { student: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() } },
}));
vi.mock('@/lib/auth/otp-service', () => ({ requestOtp: vi.fn() }));

import { prisma } from '@/lib/prisma';
import { requestOtp } from '@/lib/auth/otp-service';
import { POST } from '@/app/api/auth/register/route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;
const requestOtpMock = vi.mocked(requestOtp);

const validBody = {
  name: 'Test Student',
  email: 'new@example.com',
  mobile: '9876543210',
  state: 'Tamil Nadu',
  district: 'Chennai',
  schoolName: 'Govt Higher Secondary School',
  class: '12',
  board: 'State Board',
  preferredLanguage: 'ta',
};

function req(body: unknown) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requestOtpMock.mockResolvedValue({ ok: true, expiresAt: new Date(), devOtp: '123456' });
});

describe('POST /api/auth/register', () => {
  it('creates an unverified student and sends a registration OTP', async () => {
    p.student.findUnique.mockResolvedValue(null);
    p.student.create.mockResolvedValue({ id: 's1' });

    const res = await POST(req(validBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.registered).toBe(true);
    expect(json.mobile).toBe('9876543210');
    expect(json.devOtp).toBe('123456');
    expect(p.student.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ passwordHash: expect.anything() }),
      }),
    );
    expect(requestOtpMock).toHaveBeenCalledWith('9876543210', 'REGISTRATION', {
      email: 'new@example.com',
      language: 'ta',
    });
  });

  it('blocks a mobile that already belongs to a verified account', async () => {
    p.student.findUnique.mockResolvedValue({ id: 's1', isMobileVerified: true });
    const res = await POST(req(validBody));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('mobileTaken');
  });

  it('blocks an email that already belongs to a different account', async () => {
    p.student.findUnique.mockImplementation(({ where }: { where: { mobile?: string; email?: string } }) => {
      if (where.mobile) return null;
      if (where.email) return { id: 's2', mobile: '9123456789' };
      return null;
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('emailTaken');
    expect(p.student.create).not.toHaveBeenCalled();
    expect(requestOtpMock).not.toHaveBeenCalled();
  });

  it('maps a P2002 email conflict to emailTaken', async () => {
    p.student.findUnique.mockResolvedValue(null);
    p.student.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['email'] },
      }),
    );
    const res = await POST(req(validBody));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('emailTaken');
  });

  it('returns otpDeliveryFailed when registration OTP cannot be sent', async () => {
    p.student.findUnique.mockResolvedValue(null);
    p.student.create.mockResolvedValue({ id: 's1' });
    requestOtpMock.mockResolvedValue({ ok: false, reason: 'delivery_failed' });

    const res = await POST(req(validBody));

    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('otpDeliveryFailed');
  });

  it('returns rateLimited when registration OTP creation is throttled', async () => {
    p.student.findUnique.mockResolvedValue(null);
    p.student.create.mockResolvedValue({ id: 's1' });
    requestOtpMock.mockResolvedValue({
      ok: false,
      reason: 'rate_limited',
      retryAfterSeconds: 60,
    });

    const res = await POST(req(validBody));
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toBe('rateLimited');
    expect(json.retryAfterSeconds).toBe(60);
  });

  it('rejects invalid input with 400', async () => {
    const res = await POST(req({ ...validBody, mobile: '123' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('validation');
  });

  it('does not require a password during registration', async () => {
    p.student.findUnique.mockResolvedValue(null);
    p.student.create.mockResolvedValue({ id: 's1' });

    const res = await POST(req(validBody));

    expect(res.status).toBe(200);
    expect(p.student.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ passwordHash: expect.anything() }),
      }),
    );
  });
});
