import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation/auth';
import { hashPassword } from '@/lib/auth/password';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/auth/register — create an (unverified) student and send a mobile OTP.
export async function POST(req: Request) {
  const parsed = registerSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return fail('validation', 400, { fields: parsed.error.flatten().fieldErrors });
  }
  const d = parsed.data;

  // A verified account already owns this mobile → block. An UNVERIFIED record is
  // overwritten so an abandoned signup can be retried.
  const existing = await prisma.student.findUnique({ where: { mobile: d.mobile } });
  if (existing?.isMobileVerified) {
    return fail('mobileTaken', 409);
  }

  const existingByEmail = await prisma.student.findUnique({ where: { email: d.email } });
  if (existingByEmail && existingByEmail.mobile !== d.mobile) {
    return fail('emailTaken', 409);
  }

  const data = {
    name: d.name,
    email: d.email,
    mobile: d.mobile,
    passwordHash: await hashPassword(d.password),
    state: d.state,
    district: d.district,
    schoolName: d.schoolName,
    class: d.class,
    board: d.board,
    preferredLanguage: d.preferredLanguage,
    isMobileVerified: false,
  };

  try {
    if (existing) {
      await prisma.student.update({ where: { id: existing.id }, data });
    } else {
      await prisma.student.create({ data });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const target = String((e.meta?.target as string[] | undefined)?.join(',') ?? '');
      if (target.includes('email')) return fail('emailTaken', 409);
      if (target.includes('mobile')) return fail('mobileTaken', 409);
      return fail('conflict', 409);
    }
    throw e;
  }

  return ok({ registered: true, mobile: d.mobile });
}
