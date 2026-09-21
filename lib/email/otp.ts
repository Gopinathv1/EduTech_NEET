import { createOtp, OTP_TTL_MINUTES } from '@/lib/auth/otp';
import { enforceRateLimit } from '@/lib/auth/rate-limit';
import type { OtpPurpose } from '@prisma/client';

export type EmailOtpRequestResult =
  | { ok: true }
  | { ok: false; reason: 'rate_limited' | 'delivery_failed'; retryAfterSeconds?: number };

export async function requestEmailVerificationOtp(input: { email: string; mobile: string; ip: string }): Promise<EmailOtpRequestResult> {
  const emailCooldown = await enforceRateLimit(`email-otp:email-cooldown:${input.email}`, { max: 1, windowSeconds: 60 });
  if (emailCooldown !== null) return { ok: false, reason: 'rate_limited', retryAfterSeconds: emailCooldown };
  const emailWindow = await enforceRateLimit(`email-otp:email:${input.email}`, { max: 3, windowSeconds: 600 });
  if (emailWindow !== null) return { ok: false, reason: 'rate_limited', retryAfterSeconds: emailWindow };
  const ipWindow = await enforceRateLimit(`email-otp:ip:${input.ip}`, { max: 10, windowSeconds: 600 });
  if (ipWindow !== null) return { ok: false, reason: 'rate_limited', retryAfterSeconds: ipWindow };

  const created = await createOtp(input.mobile, 'EMAIL_VERIFICATION' as OtpPurpose, { email: input.email, channel: 'EMAIL' });
  if (!created.ok) return { ok: false, reason: 'rate_limited', retryAfterSeconds: created.retryAfterSeconds };

  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) return { ok: false, reason: 'delivery_failed' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: 'Your SIVORA verification code',
      html: `<h2>SIVORA UP↑RISING</h2><p>Your verification code is <strong>${created.otp}</strong>.</p><p>This code expires in ${OTP_TTL_MINUTES} minutes. Do not share it with anyone.</p>`,
    }),
  });
  return res.ok ? { ok: true } : { ok: false, reason: 'delivery_failed' };
}
