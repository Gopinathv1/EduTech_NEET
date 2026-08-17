import { prisma } from '@/lib/prisma';
import { getSuperAdminSession } from '@/lib/auth/admin';
import { createAdminSchema } from '@/lib/validation/manage';
import { hashPassword } from '@/lib/auth/password';
import { logAudit } from '@/lib/audit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/admin/admins — create a back-office admin (super admin only).
export async function POST(req: Request) {
  const admin = await getSuperAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const parsed = createAdminSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400, { fields: parsed.error.flatten().fieldErrors });
  const d = parsed.data;

  const existing = await prisma.admin.findUnique({ where: { email: d.email }, select: { id: true } });
  if (existing) return fail('emailTaken', 409);

  const created = await prisma.admin.create({
    data: { name: d.name, email: d.email, passwordHash: await hashPassword(d.password), role: d.role },
    select: { id: true },
  });

  await logAudit(admin, {
    action: 'admin.create',
    entityType: 'Admin',
    entityId: created.id,
    details: { email: d.email, role: d.role },
  });
  return ok({ id: created.id });
}
