import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/validation/auth';
import { createResetToken, hashResetToken, RESET_TTL_MS } from '@/lib/auth/password-reset';
import { ok, fail, readJson } from '@/lib/http';
import { sendPasswordResetEmail } from '@/lib/email/password-reset';
export async function POST(req: Request) {
  const parsed = forgotPasswordSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const { email, mobile } = parsed.data;
  const student = await prisma.student.findFirst({ where: { email, mobile }, select: { id: true } });
  if (student) {
    const token = createResetToken();
    await prisma.passwordResetToken.deleteMany({ where: { studentId: student.id, consumedAt: null } });
    await prisma.passwordResetToken.create({ data: { studentId: student.id, tokenHash: hashResetToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) } });
    await sendPasswordResetEmail(email, token).catch(() => false);
  }
  return ok({ message: 'If the details match an account, a password reset link has been sent to the registered email address.' });
}
