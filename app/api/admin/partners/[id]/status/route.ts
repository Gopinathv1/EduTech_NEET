import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { agencyStatusSchema } from '@/lib/validation/partner';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const parsed = agencyStatusSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);

  const { id } = await params;
  const { status, note } = parsed.data;
  const agency = await prisma.agency.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!agency) return fail('notFound', 404);

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id },
      data: {
        approvalStatus: status,
        isActive: status === 'APPROVED',
        approvedAt: status === 'APPROVED' ? new Date() : null,
        reviewNote: note,
        users: {
          updateMany: {
            where: {},
            data: { isActive: status === 'APPROVED' },
          },
        },
      },
    });
    await tx.auditLog.create({
      data: {
        adminId: admin.sub,
        adminName: admin.name,
        action: `partner.${status.toLowerCase()}`,
        entityType: 'Agency',
        entityId: id,
        details: { agencyName: agency.name, note: note ?? null },
      },
    });
  });

  return ok();
}
