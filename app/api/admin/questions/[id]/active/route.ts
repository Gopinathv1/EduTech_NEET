import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { questionActiveSchema } from '@/lib/validation/admin';
import { writeQuestionVersion } from '@/lib/admin/question-version';
import { logAudit } from '@/lib/audit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/questions/[id]/active — toggle a question's active flag.
export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const parsed = questionActiveSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);

  const existing = await prisma.question.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return fail('notFound', 404);

  // Keep status and isActive consistent: active ⇒ PUBLISHED, inactive ⇒ DRAFT.
  const status = parsed.data.isActive ? 'PUBLISHED' : 'DRAFT';
  await prisma.$transaction(async (tx) => {
    await tx.question.update({ where: { id }, data: { isActive: parsed.data.isActive, status } });
    await writeQuestionVersion(tx, id, `status:${status}`, admin);
  });
  await logAudit(admin, {
    action: 'question.toggleActive',
    entityType: 'Question',
    entityId: id,
    details: { isActive: parsed.data.isActive, status },
  });

  return ok({ isActive: parsed.data.isActive, status });
}
