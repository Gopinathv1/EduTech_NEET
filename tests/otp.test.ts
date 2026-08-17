import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// Mock the Prisma singleton so OTP logic can be tested without a database.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    otpToken: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { generateOtp, createOtp, verifyOtp, otpErrorCode } from '@/lib/auth/otp';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;

beforeEach(() => vi.clearAllMocks());

describe('generateOtp', () => {
  it('always returns a 6-digit numeric string', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });
});

describe('otpErrorCode', () => {
  it('maps verify results to client error codes', () => {
    expect(otpErrorCode('expired')).toBe('otpExpired');
    expect(otpErrorCode('not_found')).toBe('otpExpired');
    expect(otpErrorCode('invalid')).toBe('otpInvalid');
    expect(otpErrorCode('too_many_attempts')).toBe('tooManyAttempts');
  });
});

describe('createOtp rate limiting', () => {
  it('blocks a 4th request within the window', async () => {
    p.otpToken.findMany.mockResolvedValue([
      { createdAt: new Date() },
      { createdAt: new Date() },
      { createdAt: new Date() },
    ]);
    const res = await createOtp('9876543210', 'LOGIN');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe('rate_limited');
      expect(res.retryAfterSeconds).toBeGreaterThan(0);
    }
    expect(p.otpToken.create).not.toHaveBeenCalled();
  });

  it('creates and invalidates prior codes when under the limit', async () => {
    p.otpToken.findMany.mockResolvedValue([]);
    p.otpToken.updateMany.mockResolvedValue({ count: 1 });
    p.otpToken.create.mockResolvedValue({});
    const res = await createOtp('9876543210', 'LOGIN');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.otp).toMatch(/^\d{6}$/);
    // Old outstanding codes are consumed before a new one is created.
    expect(p.otpToken.updateMany).toHaveBeenCalled();
    expect(p.otpToken.create).toHaveBeenCalledTimes(1);
  });
});

describe('verifyOtp', () => {
  it('returns ok and consumes the token on a correct code', async () => {
    const otp = '123456';
    const otpHash = await bcrypt.hash(otp, 8);
    p.otpToken.findFirst.mockResolvedValue({
      id: 't1',
      otpHash,
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
    });
    p.otpToken.update.mockResolvedValue({});
    const result = await verifyOtp('9876543210', otp, 'LOGIN');
    expect(result).toBe('ok');
    expect(p.otpToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ consumedAt: expect.any(Date) }) }),
    );
  });

  it('returns invalid and increments attempts on a wrong code', async () => {
    const otpHash = await bcrypt.hash('123456', 8);
    p.otpToken.findFirst.mockResolvedValue({
      id: 't1',
      otpHash,
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
    });
    const result = await verifyOtp('9876543210', '000000', 'LOGIN');
    expect(result).toBe('invalid');
    expect(p.otpToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { attempts: { increment: 1 } } }),
    );
  });

  it('returns expired for a stale token', async () => {
    p.otpToken.findFirst.mockResolvedValue({
      id: 't1',
      otpHash: 'x',
      expiresAt: new Date(Date.now() - 1_000),
      attempts: 0,
    });
    expect(await verifyOtp('9876543210', '123456', 'LOGIN')).toBe('expired');
  });

  it('returns too_many_attempts once the cap is hit', async () => {
    p.otpToken.findFirst.mockResolvedValue({
      id: 't1',
      otpHash: 'x',
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 5,
    });
    expect(await verifyOtp('9876543210', '123456', 'LOGIN')).toBe('too_many_attempts');
  });

  it('returns not_found when there is no outstanding token', async () => {
    p.otpToken.findFirst.mockResolvedValue(null);
    expect(await verifyOtp('9876543210', '123456', 'LOGIN')).toBe('not_found');
  });
});
