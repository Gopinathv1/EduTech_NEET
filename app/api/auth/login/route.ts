import { prisma } from '@/lib/prisma';
import { loginOtpRequestSchema } from '@/lib/validation/auth';
import { requestOtp } from '@/lib/auth/otp-service';
import { enforceRateLimit, clientIp } from '@/lib/auth/rate-limit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/auth/login — request a passwordless student login OTP by mobile.
export async function POST(req: Request) {
  const parsed = loginOtpRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const { mobile } = parsed.data;

  // Throttle login OTP requests per IP and per mobile before creating an OTP.
  const ip = clientIp(req);
  for (const key of [`login:ip:${ip}`, `login:mobile:${mobile}`]) {
    const retryAfter = await enforceRateLimit(key, { max: 10, windowSeconds: 600 });
    if (retryAfter !== null) return fail('rateLimited', 429, { retryAfterSeconds: retryAfter });
  }

  const student = await prisma.student.findUnique({ where: { mobile } });
  if (!student) return fail('accountNotFound', 404);

  const res = await requestOtp(mobile, 'LOGIN', {
    email: student.email ?? undefined,
    language: student.preferredLanguage,
  });
  if (!res.ok) {
    if (res.reason === 'delivery_failed') return fail('otpDeliveryFailed', 502);
    return fail('rateLimited', 429, { retryAfterSeconds: res.retryAfterSeconds });
  }

  return ok({ mobile, devOtp: res.devOtp });
}
