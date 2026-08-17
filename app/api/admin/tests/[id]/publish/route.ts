import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { publishSchema } from '@/lib/validation/test';
import { checkFeasibility } from '@/lib/generator/plan';
import { logAudit } from '@/lib/audit';
import { notifyNewTestPublished } from '@/lib/notifications/create';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/admin/tests/[id]/publish — publish (with feasibility check) or unpublish.
export async function POST(req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const parsed = publishSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);

  const test = await prisma.test.findUnique({ where: { id }, select: { id: true, isPublished: true, title: true } });
  if (!test) return fail('notFound', 404);

  if (parsed.data.publish) {
    // Validate the bank can satisfy the test in every offered language.
    const feasibility = await checkFeasibility(id);
    if (!feasibility.ok) {
      return fail('notFeasible', 400, { errors: feasibility.errors });
    }
    await prisma.test.update({ where: { id }, data: { isPublished: true } });
    await logAudit(admin, { action: 'test.publish', entityType: 'Test', entityId: id });
    // Announce to all students, but only on the first publish (not re-publishes).
    if (!test.isPublished) {
      await notifyNewTestPublished({ testId: id, title: test.title });
    }
    return ok({ isPublished: true, warnings: feasibility.warnings });
  }

  await prisma.test.update({ where: { id }, data: { isPublished: false } });
  await logAudit(admin, { action: 'test.unpublish', entityType: 'Test', entityId: id });
  return ok({ isPublished: false });
}
