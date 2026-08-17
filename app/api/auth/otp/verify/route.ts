import { prisma } from '@/lib/prisma';
import { otpVerifySchema } from '@/lib/validation/auth';
import { verifyOtp, otpErrorCode } from '@/lib/auth/otp';
import { createSession } from '@/lib/auth/session';
import { syncLocaleFromProfile } from '@/lib/locale';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/auth/otp/verify — verify a REGISTRATION or LOGIN OTP and start a
// student session on success.
export async function POST(req: Request) {
  const parsed = otpVerifySchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const { mobile, otp, purpose } = parsed.data;

  const student = await prisma.student.findUnique({ where: { mobile } });
  if (!student) return fail('accountNotFound', 404);

  const result = await verifyOtp(mobile, otp, purpose);
  if (result !== 'ok') {
    return fail(otpErrorCode(result), result === 'too_many_attempts' ? 429 : 400);
  }

  if (!student.isMobileVerified) {
    await prisma.student.update({
      where: { id: student.id },
      data: { isMobileVerified: true },
    });
  }

  await createSession({ sub: student.id, kind: 'student', role: 'STUDENT', name: student.name });
  // On both registration completion and OTP login, adopt the student's saved
  // language so the UI switches to it immediately (and persists for next time).
  await syncLocaleFromProfile(student.preferredLanguage);
  return ok({ redirect: '/student' });
}
