import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { testSchema } from '@/lib/validation/test';
import { buildTestPersistence } from '@/lib/admin/test-build';
import { logAudit } from '@/lib/audit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/admin/tests — create a test (draft, unpublished).
export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const parsed = testSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400, { issues: parsed.error.flatten() });
  const input = parsed.data;

  const { data, isRandom, fixedQuestionIds } = buildTestPersistence(input);

  if (!isRandom) {
    const unique = [...new Set(fixedQuestionIds)];
    if (unique.length !== fixedQuestionIds.length) return fail('duplicateQuestions', 400);
    const found = await prisma.question.count({ where: { id: { in: unique } } });
    if (found !== unique.length) return fail('questionsNotFound', 400);
  }

  const test = await prisma.$transaction(async (tx) => {
    const created = await tx.test.create({ data: { ...data, isPublished: false } });
    if (!isRandom && fixedQuestionIds.length > 0) {
      await tx.testQuestion.createMany({
        data: fixedQuestionIds.map((questionId, i) => ({ testId: created.id, questionId, order: i + 1 })),
      });
    }
    return created;
  });

  await logAudit(admin, {
    action: 'test.create',
    entityType: 'Test',
    entityId: test.id,
    details: { testType: input.testType, isRandom, totalQuestions: data.totalQuestions },
  });

  return ok({ id: test.id });
}
