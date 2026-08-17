import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { testSchema } from '@/lib/validation/test';
import { buildTestPersistence } from '@/lib/admin/test-build';
import { logAudit } from '@/lib/audit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/tests/[id] — update a test (editing unpublishes it; the admin
// must re-publish, which re-runs feasibility validation).
export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const parsed = testSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400, { issues: parsed.error.flatten() });
  const input = parsed.data;

  const existing = await prisma.test.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return fail('notFound', 404);

  const { data, isRandom, fixedQuestionIds } = buildTestPersistence(input);

  if (!isRandom) {
    const unique = [...new Set(fixedQuestionIds)];
    if (unique.length !== fixedQuestionIds.length) return fail('duplicateQuestions', 400);
    const found = await prisma.question.count({ where: { id: { in: unique } } });
    if (found !== unique.length) return fail('questionsNotFound', 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.test.update({ where: { id }, data: { ...data, isPublished: false } });
    // Rebuild the fixed question set.
    await tx.testQuestion.deleteMany({ where: { testId: id } });
    if (!isRandom && fixedQuestionIds.length > 0) {
      await tx.testQuestion.createMany({
        data: fixedQuestionIds.map((questionId, i) => ({ testId: id, questionId, order: i + 1 })),
      });
    }
  });

  await logAudit(admin, { action: 'test.update', entityType: 'Test', entityId: id, details: { isRandom } });
  return ok();
}

// DELETE /api/admin/tests/[id] — delete a test (blocked if it has attempts/payments).
export async function DELETE(_req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const [attempts, payments] = await Promise.all([
    prisma.testAttempt.count({ where: { testId: id } }),
    prisma.payment.count({ where: { testId: id } }),
  ]);
  if (attempts > 0) return fail('testHasAttempts', 409, { count: attempts });
  if (payments > 0) return fail('testHasPayments', 409, { count: payments });

  await prisma.test.delete({ where: { id } }); // testQuestions cascade
  await logAudit(admin, { action: 'test.delete', entityType: 'Test', entityId: id });
  return ok();
}
