import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: { student: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() } },
}));
const otp = vi.hoisted(() => ({ requestOtp: vi.fn() }));
vi.mock('@/lib/auth/otp-service', () => otp);

import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/auth/register/route';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;

const validBody = {
  name: 'Test Student',
  email: 'new@example.com',
  mobile: '9876543210',
  password: 'secret12',
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
  otp.requestOtp.mockResolvedValue({ ok: true, devOtp: '123456', expiresAt: new Date() });
});

describe('POST /api/auth/register', () => {
  it('creates an unverified student and sends an OTP in their language', async () => {
    p.student.findUnique.mockResolvedValue(null);
    p.student.create.mockResolvedValue({ id: 's1' });

    const res = await POST(req(validBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.next).toBe('verify');
    expect(json.mobile).toBe('9876543210');
    expect(p.student.create).toHaveBeenCalled();
    // The OTP is requested in the student's chosen language.
    expect(otp.requestOtp).toHaveBeenCalledWith(
      '9876543210',
      'REGISTRATION',
      expect.objectContaining({ language: 'ta' }),
    );
  });

  it('blocks a mobile that already belongs to a verified account', async () => {
    p.student.findUnique.mockResolvedValue({ id: 's1', isMobileVerified: true });
    const res = await POST(req(validBody));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('mobileTaken');
    expect(otp.requestOtp).not.toHaveBeenCalled();
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

  it('returns 429 when the OTP request is rate limited', async () => {
    p.student.findUnique.mockResolvedValue(null);
    p.student.create.mockResolvedValue({ id: 's1' });
    otp.requestOtp.mockResolvedValue({ ok: false, reason: 'rate_limited', retryAfterSeconds: 300 });

    const res = await POST(req(validBody));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe('rateLimited');
  });

  it('rejects invalid input with 400', async () => {
    const res = await POST(req({ ...validBody, mobile: '123' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('validation');
  });
});
