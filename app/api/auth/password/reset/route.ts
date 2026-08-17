import { prisma } from '@/lib/prisma';
import { passwordResetSchema } from '@/lib/validation/auth';
import { verifyOtp, otpErrorCode } from '@/lib/auth/otp';
import { hashPassword } from '@/lib/auth/password';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/auth/password/reset — set a new password using a PASSWORD_RESET OTP.
export async function POST(req: Request) {
  const parsed = passwordResetSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const { mobile, otp, newPassword } = parsed.data;

  const student = await prisma.student.findUnique({ where: { mobile } });
  if (!student) return fail('accountNotFound', 404);

  const result = await verifyOtp(mobile, otp, 'PASSWORD_RESET');
  if (result !== 'ok') {
    return fail(otpErrorCode(result), result === 'too_many_attempts' ? 429 : 400);
  }

  await prisma.student.update({
    where: { id: student.id },
    // Resetting via mobile OTP also proves mobile ownership.
    data: { passwordHash: await hashPassword(newPassword), isMobileVerified: true },
  });

  return ok({ redirect: '/login' });
}
