import { prisma } from '@/lib/prisma';
import { getSuperAdminSession } from '@/lib/auth/admin';
import { updateAdminSchema } from '@/lib/validation/manage';
import { logAudit } from '@/lib/audit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/admins/[id] — change an admin's role or active flag.
export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await getSuperAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const parsed = updateAdminSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const d = parsed.data;

  const target = await prisma.admin.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return fail('notFound', 404);

  // Guard against a super admin locking themselves out.
  if (id === admin.sub) {
    if (d.isActive === false) return fail('cannotDeactivateSelf', 400);
    if (d.role === 'ADMIN') return fail('cannotDemoteSelf', 400);
  }

  await prisma.admin.update({
    where: { id },
    data: { ...(d.role ? { role: d.role } : {}), ...(d.isActive !== undefined ? { isActive: d.isActive } : {}) },
  });

  await logAudit(admin, { action: 'admin.update', entityType: 'Admin', entityId: id, details: d });
  return ok();
}
