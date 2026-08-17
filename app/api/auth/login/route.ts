import { prisma } from '@/lib/prisma';
import { passwordLoginSchema } from '@/lib/validation/auth';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { syncLocaleFromProfile } from '@/lib/locale';
import { enforceRateLimit, clientIp } from '@/lib/auth/rate-limit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/auth/login — student password login by mobile OR email.
export async function POST(req: Request) {
  const parsed = passwordLoginSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const { identifier, password } = parsed.data;

  // Throttle brute force: cap attempts per IP and per identifier (10 / 10 min).
  const ip = clientIp(req);
  for (const key of [`login:ip:${ip}`, `login:id:${identifier}`]) {
    const retryAfter = await enforceRateLimit(key, { max: 10, windowSeconds: 600 });
    if (retryAfter !== null) return fail('rateLimited', 429, { retryAfterSeconds: retryAfter });
  }

  const student = identifier.includes('@')
    ? await prisma.student.findUnique({ where: { email: identifier } })
    : await prisma.student.findUnique({ where: { mobile: identifier } });

  // Same generic error whether the account is missing or the password is wrong.
  if (!student || !(await verifyPassword(password, student.passwordHash))) {
    return fail('invalidCredentials', 401);
  }
  if (!student.isMobileVerified) {
    return fail('notVerified', 403, { mobile: student.mobile });
  }

  await createSession({ sub: student.id, kind: 'student', role: 'STUDENT', name: student.name });
  // Restore the student's saved UI language as the active locale on this device.
  await syncLocaleFromProfile(student.preferredLanguage);
  return ok({ redirect: '/student' });
}
