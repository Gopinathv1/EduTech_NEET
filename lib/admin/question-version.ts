import type { Prisma } from '@prisma/client';

/**
 * Append an immutable version-history entry for a question. Reads the question's
 * current state (fields + all translations) and stores it as `snapshot` with the
 * next sequential version number, recording who made the change and what action
 * it was. Call this inside the same transaction that created/edited the question,
 * AFTER the write, so the snapshot reflects the new state.
 */
export async function writeQuestionVersion(
  tx: Prisma.TransactionClient,
  questionId: string,
  action: string,
  admin: { sub: string; name: string },
): Promise<void> {
  const q = await tx.question.findUnique({
    where: { id: questionId },
    include: { translations: true },
  });
  if (!q) return;

  const last = await tx.questionVersion.findFirst({
    where: { questionId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const version = (last?.version ?? 0) + 1;

  const snapshot = {
    topic: q.topic,
    difficulty: q.difficulty,
    questionType: q.questionType,
    status: q.status,
    isActive: q.isActive,
    year: q.year,
    tags: q.tags,
    imageUrl: q.imageUrl,
    translations: q.translations
      .sort((a, b) => a.language.localeCompare(b.language))
      .map((t) => ({
        language: t.language,
        questionText: t.questionText,
        optionA: t.optionA,
        optionB: t.optionB,
        optionC: t.optionC,
        optionD: t.optionD,
        correctOption: t.correctOption,
        explanation: t.explanation,
        reviewed: t.reviewed,
      })),
  };

  await tx.questionVersion.create({
    data: {
      questionId,
      version,
      action,
      editedById: admin.sub,
      editedByName: admin.name,
      snapshot: snapshot as unknown as Prisma.InputJsonValue,
    },
  });
}
