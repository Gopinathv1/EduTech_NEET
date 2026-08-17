import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { OtpPurpose, OtpChannel } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * OTP lifecycle: generate → hash → store → verify. Clear-text OTPs are never
 * persisted. Rate limiting and attempt caps are enforced here.
 */

export const OTP_TTL_MINUTES = 5;
export const RATE_LIMIT_MAX = 3; // max OTP requests ...
export const RATE_LIMIT_WINDOW_MINUTES = 10; // ... per this window, per mobile
export const MAX_VERIFY_ATTEMPTS = 5;

/** Cryptographically-random 6-digit code, zero-padded. */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 8); // low cost: OTPs are short-lived and single-use
}

export type CreateOtpResult =
  | { ok: true; otp: string; expiresAt: Date }
  | { ok: false; reason: 'rate_limited'; retryAfterSeconds: number };

/**
 * Rate-limit check + create a fresh OTP token. Older unconsumed tokens for the
 * same (mobile, purpose) are invalidated so only the newest code works.
 */
export async function createOtp(
  mobile: string,
  purpose: OtpPurpose,
  opts: { channel?: OtpChannel; email?: string } = {},
): Promise<CreateOtpResult> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000);

  const recent = await prisma.otpToken.findMany({
    where: { mobile, purpose, createdAt: { gte: windowStart } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });

  if (recent.length >= RATE_LIMIT_MAX) {
    const oldest = recent[0].createdAt.getTime();
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + RATE_LIMIT_WINDOW_MINUTES * 60_000 - Date.now()) / 1000),
    );
    return { ok: false, reason: 'rate_limited', retryAfterSeconds };
  }

  // Invalidate previous outstanding codes for this mobile+purpose.
  await prisma.otpToken.updateMany({
    where: { mobile, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);
  await prisma.otpToken.create({
    data: {
      mobile,
      email: opts.email,
      otpHash: await hashOtp(otp),
      purpose,
      channel: opts.channel ?? 'SMS',
      expiresAt,
    },
  });

  return { ok: true, otp, expiresAt };
}

export type VerifyOtpResult = 'ok' | 'not_found' | 'expired' | 'invalid' | 'too_many_attempts';

/** Map a verify result to a client-facing error code (`auth.errors.<code>`). */
export function otpErrorCode(result: Exclude<VerifyOtpResult, 'ok'>): string {
  switch (result) {
    case 'not_found':
    case 'expired':
      return 'otpExpired';
    case 'too_many_attempts':
      return 'tooManyAttempts';
    case 'invalid':
    default:
      return 'otpInvalid';
  }
}

/** Verify an OTP for a purpose, consuming it on success. */
export async function verifyOtp(
  mobile: string,
  otp: string,
  purpose: OtpPurpose,
): Promise<VerifyOtpResult> {
  const token = await prisma.otpToken.findFirst({
    where: { mobile, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!token) return 'not_found';
  if (token.expiresAt.getTime() < Date.now()) return 'expired';
  if (token.attempts >= MAX_VERIFY_ATTEMPTS) return 'too_many_attempts';

  const matches = await bcrypt.compare(otp, token.otpHash);
  if (!matches) {
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    return 'invalid';
  }

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() },
  });
  return 'ok';
}
