import { prisma } from '@/lib/prisma';
import { partnerLoginSchema } from '@/lib/validation/partner';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { enforceRateLimit, clientIp } from '@/lib/auth/rate-limit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const parsed = partnerLoginSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const { email, password } = parsed.data;

  const ip = clientIp(req);
  for (const key of [`partnerlogin:ip:${ip}`, `partnerlogin:id:${email}`]) {
    const retryAfter = await enforceRateLimit(key, { max: 8, windowSeconds: 600 });
    if (retryAfter !== null) return fail('rateLimited', 429, { retryAfterSeconds: retryAfter });
  }

  const user = await prisma.agencyUser.findUnique({ where: { email }, include: { agency: true } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail('invalidCredentials', 401);
  }

  if (user.agency.approvalStatus !== 'APPROVED') {
    return fail(`partnerStatus:${user.agency.approvalStatus}`, 403);
  }
  if (!user.isActive || !user.agency.isActive) {
    return fail('accountInactive', 403);
  }

  await prisma.agencyUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession({
    sub: user.id,
    kind: 'partner',
    role: 'PARTNER',
    name: user.name,
    agencyId: user.agencyId,
  });
  return ok({ redirect: '/partner' });
}
