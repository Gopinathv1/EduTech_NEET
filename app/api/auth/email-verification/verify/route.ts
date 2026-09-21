import { prisma } from '@/lib/prisma';
import { emailVerificationVerifySchema } from '@/lib/validation/auth';
import { verifyOtp, otpErrorCode } from '@/lib/auth/otp';
import { createSession } from '@/lib/auth/session';
import { syncLocaleFromProfile } from '@/lib/locale';
import { returnParamFromUrl } from '@/lib/auth/redirect';
import { fail, ok, readJson } from '@/lib/http';
import type { OtpPurpose } from '@prisma/client';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const parsed = emailVerificationVerifySchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const student = await prisma.student.findUnique({ where: { email: parsed.data.email } });
  if (!student || student.mobile !== parsed.data.mobile) return fail('accountNotFound', 404);
  const result = await verifyOtp(parsed.data.mobile, parsed.data.otp, 'EMAIL_VERIFICATION' as OtpPurpose);
  if (result !== 'ok') return fail(otpErrorCode(result), result === 'too_many_attempts' ? 429 : 400);
  await prisma.student.update({ where: { id: student.id }, data: { isEmailVerified: true } });
  await createSession({ sub: student.id, kind: 'student', role: 'STUDENT', name: student.name });
  await syncLocaleFromProfile(student.preferredLanguage);
  return ok({ redirect: returnParamFromUrl(new URL(req.url)) });
}
