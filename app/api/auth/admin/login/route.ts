import { prisma } from '@/lib/prisma';
import { adminLoginSchema } from '@/lib/validation/auth';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { enforceRateLimit, clientIp } from '@/lib/auth/rate-limit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/auth/admin/login — admin/super-admin login by email + password.
export async function POST(req: Request) {
  const parsed = adminLoginSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const { email, password } = parsed.data;

  // Throttle brute force on the admin console (stricter: 8 / 10 min).
  const ip = clientIp(req);
  for (const key of [`adminlogin:ip:${ip}`, `adminlogin:id:${email.toLowerCase()}`]) {
    const retryAfter = await enforceRateLimit(key, { max: 8, windowSeconds: 600 });
    if (retryAfter !== null) return fail('rateLimited', 429, { retryAfterSeconds: retryAfter });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return fail('invalidCredentials', 401);
  }
  if (!admin.isActive) {
    return fail('accountInactive', 403);
  }

  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  // Record the login in the audit trail (shown in the super-admin access logs).
  await prisma.auditLog.create({
    data: { adminId: admin.id, adminName: admin.name, action: 'admin.login', entityType: 'Admin', entityId: admin.id },
  });
  await createSession({ sub: admin.id, kind: 'admin', role: admin.role, name: admin.name });
  return ok({ redirect: '/admin' });
}
