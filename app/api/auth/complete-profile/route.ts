import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { completeProfileSchema } from '@/lib/validation/auth';
import { getSession } from '@/lib/auth/session';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/auth/complete-profile — save the mandatory contact mobile for a
// Google-created student account. The number is not OTP-verified here.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);

  const parsed = completeProfileSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return fail('validation', 400, { fields: parsed.error.flatten().fieldErrors });
  }

  try {
    await prisma.student.update({
      where: { id: session.sub },
      data: { mobile: parsed.data.mobile, isMobileVerified: false },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return fail('mobileTaken', 409);
    }
    throw e;
  }

  return ok({ redirect: '/student' });
}
