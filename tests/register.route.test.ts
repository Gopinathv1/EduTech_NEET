import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    student: { findUnique: vi.fn(), create: vi.fn() },
    rateLimit: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    otpToken: { findMany: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  },
}));
vi.mock('@/lib/auth/password', () => ({ hashPassword: vi.fn(async () => 'hashed-password') }));

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { POST } from '@/app/api/auth/register/route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;
const hashPasswordMock = vi.mocked(hashPassword);

const validBody = {
  name: 'Test Student',
  email: 'new@example.com',
  mobile: '9876543210',
  password: 'password123',
  confirmPassword: 'password123',
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
  p.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(p));
  p.rateLimit.findUnique.mockResolvedValue(null);
  p.rateLimit.upsert.mockResolvedValue({});
  p.rateLimit.update.mockResolvedValue({});
  p.otpToken.findMany.mockResolvedValue([]);
  p.otpToken.updateMany.mockResolvedValue({ count: 0 });
  p.otpToken.create.mockResolvedValue({});
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.RESEND_FROM_EMAIL = 'test@example.com';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  vi.unstubAllGlobals();
});

describe('POST /api/auth/register', () => {
  it('creates an unverified password account and sends it to email verification', async () => {
    p.student.findUnique.mockResolvedValue(null);
    p.student.create.mockResolvedValue({
      id: 's1',
      name: 'Test Student',
      preferredLanguage: 'ta',
    });

    const res = await POST(req(validBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      ok: true,
      registered: true,
      redirect: '/verify-email?callbackUrl=%2Fstudent&email=new%40example.com',
    });
    expect(hashPasswordMock).toHaveBeenCalledWith('password123');
    expect(p.student.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Test Student',
        email: 'new@example.com',
        mobile: '+919876543210',
        passwordHash: 'hashed-password',
        isMobileVerified: false,
      }),
    });
    expect(p.otpToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mobile: '+919876543210',
        email: 'new@example.com',
        purpose: 'EMAIL_VERIFICATION',
        channel: 'EMAIL',
        otpHash: expect.not.stringMatching(/^\d{6}$/),
      }),
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('blocks duplicate mobile numbers', async () => {
    p.student.findUnique.mockImplementation(({ where }: { where: { mobile?: string; email?: string } }) => {
      if (where.mobile) return { id: 's1' };
      return null;
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('mobileTaken');
    expect(p.student.create).not.toHaveBeenCalled();
  });

  it('blocks duplicate email addresses', async () => {
    p.student.findUnique.mockImplementation(({ where }: { where: { mobile?: string; email?: string } }) => {
      if (where.mobile) return null;
      if (where.email) return { id: 's2' };
      return null;
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('emailTaken');
    expect(p.student.create).not.toHaveBeenCalled();
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

  it('rejects invalid input with 400', async () => {
    const res = await POST(req({ ...validBody, mobile: '123' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('validation');
  });

  it('requires matching password confirmation', async () => {
    const res = await POST(req({ ...validBody, confirmPassword: 'different123' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('validation');
    expect(p.student.create).not.toHaveBeenCalled();
  });
});
