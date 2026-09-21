import { prisma } from '@/lib/prisma';
import { emailVerificationRequestSchema } from '@/lib/validation/auth';
import { requestEmailVerificationOtp } from '@/lib/email/otp';
import { clientIp } from '@/lib/auth/rate-limit';
import { fail, ok, readJson } from '@/lib/http';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const parsed = emailVerificationRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const student = await prisma.student.findUnique({ where: { email: parsed.data.email }, select: { mobile: true, isEmailVerified: true } });
  if (!student || student.mobile !== parsed.data.mobile) return fail('accountNotFound', 404);
  if (student.isEmailVerified) return fail('alreadyVerified', 409);
  const result = await requestEmailVerificationOtp({ ...parsed.data, ip: clientIp(req) });
  if (!result.ok) return fail(result.reason === 'delivery_failed' ? 'otpDeliveryFailed' : 'rateLimited', result.reason === 'delivery_failed' ? 502 : 429, result.retryAfterSeconds ? { retryAfterSeconds: result.retryAfterSeconds } : undefined);
  return ok();
}
