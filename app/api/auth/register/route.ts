import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation/auth';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { syncLocaleFromProfile } from '@/lib/locale';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/auth/register — create a password student account and sign in.
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
    await createSession({ sub: student.id, kind: 'student', role: 'STUDENT', name: student.name });
    await syncLocaleFromProfile(student.preferredLanguage);
    return ok({ registered: true, redirect: '/student' });
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
