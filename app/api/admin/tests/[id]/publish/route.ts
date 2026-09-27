import { getAdminSession } from '@/lib/auth/admin';
import { publishSchema } from '@/lib/validation/test';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { publishTest } from '@/lib/admin/test-publication';
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

  if (parsed.data.publish) {
    try {
      return ok(await publishTest(id, admin));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publication failed.';
      return fail(message === 'Test not found.' ? 'notFound' : 'notFeasible', message === 'Test not found.' ? 404 : 400, { errors: [message] });
    }
  }

  const test = await prisma.test.findUnique({ where: { id }, select: { id: true } });
  if (!test) return fail('notFound', 404);

  await prisma.test.update({ where: { id }, data: { isPublished: false } });
  await logAudit(admin, { action: 'test.unpublish', entityType: 'Test', entityId: id });
  return ok({ isPublished: false });
}
