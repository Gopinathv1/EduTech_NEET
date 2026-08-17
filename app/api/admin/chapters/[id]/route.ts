import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { chapterUpdateSchema } from '@/lib/validation/admin';
import { logAudit } from '@/lib/audit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/chapters/[id] — update a chapter.
export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const parsed = chapterUpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400, { issues: parsed.error.flatten() });

  const existing = await prisma.chapter.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return fail('notFound', 404);

  const d = parsed.data;
  await prisma.chapter.update({
    where: { id },
    data: { name: { en: d.nameEn, ta: d.nameTa || '' }, class: d.class, weightage: d.weightage },
  });

  await logAudit(admin, {
    action: 'chapter.update',
    entityType: 'Chapter',
    entityId: id,
    details: { nameEn: d.nameEn, class: d.class, weightage: d.weightage },
  });

  return ok();
}

// DELETE /api/admin/chapters/[id] — delete a chapter (blocked if in use).
export async function DELETE(_req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const [questionCount, testCount] = await Promise.all([
    prisma.question.count({ where: { chapterId: id } }),
    prisma.test.count({ where: { chapterId: id } }),
  ]);
  if (questionCount > 0) return fail('chapterHasQuestions', 409, { count: questionCount });
  if (testCount > 0) return fail('chapterHasTests', 409, { count: testCount });

  await prisma.chapter.delete({ where: { id } });
  await logAudit(admin, { action: 'chapter.delete', entityType: 'Chapter', entityId: id });

  return ok();
}
