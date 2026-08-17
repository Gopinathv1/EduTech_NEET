import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { questionSchema, isTaComplete, type QuestionInput } from '@/lib/validation/admin';
import { writeQuestionVersion } from '@/lib/admin/question-version';
import { logAudit } from '@/lib/audit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// GET /api/admin/questions — lightweight search for the fixed-test question
// picker. Returns active questions (EN preview + translation flag).
export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const url = new URL(req.url);
  const subject = url.searchParams.get('subject') ?? '';
  const chapter = url.searchParams.get('chapter') ?? '';
  const difficulty = url.searchParams.get('difficulty') ?? '';
  const q = url.searchParams.get('q') ?? '';
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '25', 10) || 25));

  const where: Prisma.QuestionWhereInput = { isActive: true };
  if (subject) where.subjectId = subject;
  if (chapter) where.chapterId = chapter;
  if (['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
    where.difficulty = difficulty as 'EASY' | 'MEDIUM' | 'HARD';
  }
  if (q) {
    where.translations = { some: { language: 'en', questionText: { contains: q, mode: 'insensitive' } } };
  }

  const questions = await prisma.question.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      subject: true,
      chapter: true,
      translations: { select: { language: true, questionText: true, reviewed: true } },
    },
  });

  const rows = questions.map((qn) => {
    const en = qn.translations.find((t) => t.language === 'en');
    const ta = qn.translations.find((t) => t.language === 'ta');
    return {
      id: qn.id,
      preview: (en?.questionText ?? '').slice(0, 120),
      subjectName: (qn.subject.name as { en?: string })?.en ?? '',
      chapterName: (qn.chapter.name as { en?: string })?.en ?? '',
      difficulty: qn.difficulty,
      hasTa: Boolean(ta?.reviewed),
    };
  });

  return ok({ questions: rows });
}

/** Build the nested translation rows. English is always reviewed/authoritative. */
function buildTranslations(d: QuestionInput): Prisma.QuestionTranslationCreateWithoutQuestionInput[] {
  const rows: Prisma.QuestionTranslationCreateWithoutQuestionInput[] = [
    {
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
  ];
  if (isTaComplete(d.ta) && d.ta) {
    rows.push({
      language: 'ta',
      questionText: d.ta.questionText,
      optionA: d.ta.optionA,
      optionB: d.ta.optionB,
      optionC: d.ta.optionC,
      optionD: d.ta.optionD,
      correctOption: d.correctOption, // correct option is language-independent
      explanation: d.ta.explanation || null,
      reviewed: d.ta.reviewed,
    });
  }
  return rows;
}

// POST /api/admin/questions — create a question with EN (+ optional TA) content.
export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const parsed = questionSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400, { issues: parsed.error.flatten() });
  const d = parsed.data;

  const chapter = await prisma.chapter.findUnique({ where: { id: d.chapterId }, select: { subjectId: true } });
  if (!chapter) return fail('chapterNotFound', 404);
  if (chapter.subjectId !== d.subjectId) return fail('chapterSubjectMismatch', 400);

  const question = await prisma.$transaction(async (tx) => {
    const created = await tx.question.create({
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
        // isActive mirrors the PUBLISHED status (the generator/catalogue gate).
        isActive: d.status === 'PUBLISHED',
        translations: { create: buildTranslations(d) },
      },
    });
    await writeQuestionVersion(tx, created.id, 'created', admin);
    return created;
  });

  await logAudit(admin, {
    action: 'question.create',
    entityType: 'Question',
    entityId: question.id,
    details: { subjectId: d.subjectId, chapterId: d.chapterId, status: d.status, hasTa: isTaComplete(d.ta) },
  });

  return ok({ id: question.id });
}
