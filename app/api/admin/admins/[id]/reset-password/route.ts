import { prisma } from '@/lib/prisma';
import { getSuperAdminSession } from '@/lib/auth/admin';
import { resetAdminPasswordSchema } from '@/lib/validation/manage';
import { hashPassword } from '@/lib/auth/password';
import { logAudit } from '@/lib/audit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/admin/admins/[id]/reset-password — set a new password for an admin.
export async function POST(req: Request, { params }: Ctx) {
  const admin = await getSuperAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const parsed = resetAdminPasswordSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);

  const target = await prisma.admin.findUnique({ where: { id }, select: { id: true } });
  if (!target) return fail('notFound', 404);

  await prisma.admin.update({ where: { id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  await logAudit(admin, { action: 'admin.resetPassword', entityType: 'Admin', entityId: id });
  return ok();
}
