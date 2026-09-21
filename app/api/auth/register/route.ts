import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation/auth';
import { hashPassword } from '@/lib/auth/password';
import { requestEmailVerificationOtp } from '@/lib/email/otp';
import { clientIp } from '@/lib/auth/rate-limit';
import { returnParamFromUrl, withReturnParam } from '@/lib/auth/redirect';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/auth/register — create an unverified password account and send email verification.
export async function POST(req: Request) {
  const parsed = registerSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return fail('validation', 400, { fields: parsed.error.flatten().fieldErrors });
  }
  const d = parsed.data;

  const existing = await prisma.student.findUnique({ where: { mobile: d.mobile } });
  if (existing) {
    return fail('mobileTaken', 409);
  }

  const existingByEmail = await prisma.student.findUnique({ where: { email: d.email } });
  if (existingByEmail) {
    return fail('emailTaken', 409);
  }

  try {
    const student = await prisma.student.create({
      data: {
        name: d.name,
        email: d.email,
        mobile: d.mobile,
        passwordHash: await hashPassword(d.password),
        preferredLanguage: d.preferredLanguage ?? 'en',
        isMobileVerified: false,
      },
    });
    const delivery = await requestEmailVerificationOtp({ email: d.email, mobile: d.mobile, ip: clientIp(req) });
    const verifyUrl = new URL(withReturnParam('/verify-email', returnParamFromUrl(new URL(req.url))), 'http://sivora.local');
    verifyUrl.searchParams.set('email', d.email);
    const redirect = `${verifyUrl.pathname}${verifyUrl.search}`;
    if (!delivery.ok) return fail(delivery.reason === 'delivery_failed' ? 'otpDeliveryFailed' : 'rateLimited', delivery.reason === 'delivery_failed' ? 502 : 429, { registered: true, redirect, retryAfterSeconds: delivery.retryAfterSeconds });
    return ok({ registered: true, redirect });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const target = String((e.meta?.target as string[] | undefined)?.join(',') ?? '');
      if (target.includes('email')) return fail('emailTaken', 409);
      if (target.includes('mobile')) return fail('mobileTaken', 409);
      return fail('conflict', 409);
    }
    throw e;
  }
}
