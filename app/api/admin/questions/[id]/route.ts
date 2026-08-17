import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { questionSchema, isTaComplete } from '@/lib/validation/admin';
import { writeQuestionVersion } from '@/lib/admin/question-version';
import { logAudit } from '@/lib/audit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/questions/[id] — full update incl. EN/TA translations.
export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const parsed = questionSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400, { issues: parsed.error.flatten() });
  const d = parsed.data;

  const existing = await prisma.question.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return fail('notFound', 404);
  const chapter = await prisma.chapter.findUnique({ where: { id: d.chapterId }, select: { subjectId: true } });
  if (!chapter) return fail('chapterNotFound', 404);
  if (chapter.subjectId !== d.subjectId) return fail('chapterSubjectMismatch', 400);

  const taComplete = isTaComplete(d.ta);

  await prisma.$transaction(async (tx) => {
    await tx.question.update({
      where: { id },
      data: {
        subjectId: d.subjectId,
        chapterId: d.chapterId,
        topic: d.topic || null,
        difficulty: d.difficulty,
        questionType: d.questionType,
        status: d.status,
        year: d.year ?? null,
        tags: d.tags,
        imageUrl: d.imageUrl || null,
        isActive: d.status === 'PUBLISHED',
      },
    });

    await tx.questionTranslation.upsert({
      where: { questionId_language: { questionId: id, language: 'en' } },
      create: {
        questionId: id,
        language: 'en',
        questionText: d.en.questionText,
        optionA: d.en.optionA,
        optionB: d.en.optionB,
        optionC: d.en.optionC,
        optionD: d.en.optionD,
        correctOption: d.correctOption,
        explanation: d.en.explanation || null,
        reviewed: true,
      },
      update: {
        questionText: d.en.questionText,
        optionA: d.en.optionA,
        optionB: d.en.optionB,
        optionC: d.en.optionC,
        optionD: d.en.optionD,
        correctOption: d.correctOption,
        explanation: d.en.explanation || null,
        reviewed: true,
      },
    });

    if (taComplete && d.ta) {
      await tx.questionTranslation.upsert({
        where: { questionId_language: { questionId: id, language: 'ta' } },
        create: {
          questionId: id,
          language: 'ta',
          questionText: d.ta.questionText,
          optionA: d.ta.optionA,
          optionB: d.ta.optionB,
          optionC: d.ta.optionC,
          optionD: d.ta.optionD,
          correctOption: d.correctOption,
          explanation: d.ta.explanation || null,
          reviewed: d.ta.reviewed,
        },
        update: {
          questionText: d.ta.questionText,
          optionA: d.ta.optionA,
          optionB: d.ta.optionB,
          optionC: d.ta.optionC,
          optionD: d.ta.optionD,
          correctOption: d.correctOption,
          explanation: d.ta.explanation || null,
          reviewed: d.ta.reviewed,
        },
      });
    } else {
      // Tamil cleared/incomplete → remove any existing TA translation.
      await tx.questionTranslation.deleteMany({ where: { questionId: id, language: 'ta' } });
    }

    await writeQuestionVersion(tx, id, 'updated', admin);
  });

  await logAudit(admin, {
    action: 'question.update',
    entityType: 'Question',
    entityId: id,
    details: { hasTa: taComplete },
  });

  return ok();
}

// DELETE /api/admin/questions/[id] — delete a question (blocked if used in a fixed test).
export async function DELETE(_req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const usedInTest = await prisma.testQuestion.count({ where: { questionId: id } });
  if (usedInTest > 0) return fail('questionInUse', 409, { count: usedInTest });

  const existing = await prisma.question.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return fail('notFound', 404);

  await prisma.question.delete({ where: { id } }); // translations cascade
  await logAudit(admin, { action: 'question.delete', entityType: 'Question', entityId: id });
  return ok();
}
