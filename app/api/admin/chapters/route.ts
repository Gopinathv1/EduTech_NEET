import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { chapterCreateSchema } from '@/lib/validation/admin';
import { logAudit } from '@/lib/audit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/admin/chapters — create a chapter under a subject.
export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const parsed = chapterCreateSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400, { issues: parsed.error.flatten() });
  const d = parsed.data;

  const subject = await prisma.subject.findUnique({ where: { id: d.subjectId }, select: { id: true } });
  if (!subject) return fail('subjectNotFound', 404);

  const order = await prisma.chapter.count({ where: { subjectId: d.subjectId } });
  const chapter = await prisma.chapter.create({
    data: {
      subjectId: d.subjectId,
      name: { en: d.nameEn, ta: d.nameTa || '' },
      class: d.class,
      weightage: d.weightage,
      order: order + 1,
    },
  });

  await logAudit(admin, {
    action: 'chapter.create',
    entityType: 'Chapter',
    entityId: chapter.id,
    details: { subjectId: d.subjectId, nameEn: d.nameEn, class: d.class, weightage: d.weightage },
  });

  return ok({ id: chapter.id });
}
