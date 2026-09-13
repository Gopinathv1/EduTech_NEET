import { prisma } from '@/lib/prisma';
import { loginPasswordSchema } from '@/lib/validation/auth';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { enforceRateLimit, clientIp } from '@/lib/auth/rate-limit';
import { syncLocaleFromProfile } from '@/lib/locale';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/auth/login — sign in a student with mobile + password.
export async function POST(req: Request) {
  const parsed = loginPasswordSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const { mobile, password } = parsed.data;

  // Throttle before checking credentials to reduce brute-force attempts and
  // avoid turning responses into account-enumeration signals.
  const ip = clientIp(req);
  for (const key of [`login:ip:${ip}`, `login:mobile:${mobile}`]) {
    const retryAfter = await enforceRateLimit(key, { max: 10, windowSeconds: 600 });
    if (retryAfter !== null) return fail('rateLimited', 429, { retryAfterSeconds: retryAfter });
  }

  const student = await prisma.student.findUnique({ where: { mobile } });
  if (!student?.passwordHash) {
    return fail('invalidCredentials', 401);
  }

  const valid = await verifyPassword(password, student.passwordHash);
  if (!valid) return fail('invalidCredentials', 401);

  await createSession({ sub: student.id, kind: 'student', role: 'STUDENT', name: student.name });
  await syncLocaleFromProfile(student.preferredLanguage);
  return ok({ redirect: '/student' });
}
