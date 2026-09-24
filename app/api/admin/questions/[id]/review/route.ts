import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { writeQuestionVersion } from '@/lib/admin/question-version';
import { isAllowedOfficialSource } from '@/lib/question-bank/official-sources';
import { logAudit } from '@/lib/audit';
import { fail, ok, readJson } from '@/lib/http';

export const runtime = 'nodejs';

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'NEEDS_CORRECTION']),
  note: z.string().trim().max(2000).optional().default(''),
});

type Ctx = { params: Promise<{ id: string }> };

function approvalIssues(question: Awaited<ReturnType<typeof loadQuestion>>): string[] {
  if (!question) return ['Question does not exist.'];
  const issues: string[] = [];
  const en = question.translations.find((translation) => translation.language === 'en');
  if (!question.externalId) issues.push('A deterministic external ID is required.');
  if (!question.exam || !['NEET', 'JEE'].includes(question.exam)) issues.push('Exam must be NEET or JEE.');
  if (!question.topic) issues.push('Topic is required.');
  if (!question.chapterId) issues.push('Chapter is required.');
  if (!question.sourceType || !question.sourceName) issues.push('Source type and source name are required.');
  if (!en?.questionText?.trim() || !en.explanation?.trim()) issues.push('English question text and explanation are required.');
  if (en) {
    if (question.questionType === 'NUMERICAL_VALUE') {
      if (en.numericAnswer === null) issues.push('A numerical answer is required.');
      if (en.numericTolerance !== null && en.numericTolerance.isNegative()) issues.push('Numerical tolerance cannot be negative.');
    } else {
      const options = [en.optionA, en.optionB, en.optionC, en.optionD].map((option) => option?.trim().toLocaleLowerCase() ?? '');
      if (options.some((option) => !option)) issues.push('All four answer options are required.');
      if (new Set(options).size !== options.length) issues.push('Answer options must be distinct.');
      if (!en.correctOption || !['A', 'B', 'C', 'D'].includes(en.correctOption)) issues.push('A valid correct option is required.');
    }
  }
  if (question.sourceType === 'OFFICIAL_NTA' || question.sourceType === 'OFFICIAL_PREVIOUS_YEAR') {
    if (!question.examYear) issues.push('Official questions require an exam year.');
    if (!question.sourceUrl || !isAllowedOfficialSource(question.sourceUrl)) issues.push('Official questions require an allowlisted NTA/NIC/NMC source URL.');
  }
  return issues;
}

function loadQuestion(id: string) {
  return prisma.question.findUnique({
    where: { id },
    include: { translations: true },
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const parsed = reviewSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400, { issues: parsed.error.flatten() });
  const { id } = await params;
  const { action, note } = parsed.data;
  const question = await loadQuestion(id);
  if (!question) return fail('notFound', 404);

  if (action === 'APPROVE') {
    if (question.reviewState !== 'REVIEW_REQUIRED') return fail('invalidReviewTransition', 409);
    const issues = approvalIssues(question);
    if (issues.length) return fail('approvalValidation', 400, { issues });
  } else if (!note) {
    return fail('reviewNoteRequired', 400);
  }

  if (action !== 'APPROVE' && !['REVIEW_REQUIRED', 'NEEDS_CORRECTION'].includes(question.reviewState)) {
    return fail('invalidReviewTransition', 409);
  }

  const now = new Date();
  const state = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'NEEDS_CORRECTION';
  await prisma.$transaction(async (tx) => {
    await tx.question.update({
      where: { id },
      data: action === 'APPROVE'
        ? {
            reviewState: state,
            reviewNote: note || null,
            reviewer: admin.name,
            reviewedAt: now,
            status: 'PUBLISHED',
            contentClass: 'PRODUCTION',
            isActive: true,
          }
        : {
            reviewState: state,
            reviewNote: note,
            reviewer: admin.name,
            reviewedAt: now,
            status: action === 'REJECT' ? 'DRAFT' : 'REVIEW',
            contentClass: 'SAMPLE',
            isActive: false,
          },
    });
    await writeQuestionVersion(tx, id, `review:${state}`, admin);
  });

  await logAudit(admin, {
    action: `question.review.${state.toLowerCase()}`,
    entityType: 'Question',
    entityId: id,
    details: { note: note || null },
  });
  return ok({ reviewState: state });
}
