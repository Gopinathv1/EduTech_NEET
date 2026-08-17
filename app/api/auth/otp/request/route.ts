import { prisma } from '@/lib/prisma';
import { otpRequestSchema } from '@/lib/validation/auth';
import { requestOtp } from '@/lib/auth/otp-service';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/auth/otp/request — (re)send an OTP for login, reset, or registration.
// Rate limited to 3 requests / 10 min per mobile (enforced in createOtp).
export async function POST(req: Request) {
  const parsed = otpRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const { mobile, purpose } = parsed.data;

  const student = await prisma.student.findUnique({ where: { mobile } });
  if (!student) return fail('accountNotFound', 404);
  if (purpose === 'REGISTRATION' && student.isMobileVerified) {
    return fail('alreadyVerified', 409);
  }

  const res = await requestOtp(mobile, purpose, {
    email: student.email ?? undefined,
    language: student.preferredLanguage,
  });
  if (!res.ok) {
    return fail('rateLimited', 429, { retryAfterSeconds: res.retryAfterSeconds });
  }
  return ok({ devOtp: res.devOtp });
}
