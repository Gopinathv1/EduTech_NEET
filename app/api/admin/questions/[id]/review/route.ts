import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { approveQuestion, QuestionApprovalError } from '@/lib/admin/question-approval';
import { writeQuestionVersion } from '@/lib/admin/question-version';
import { logAudit } from '@/lib/audit';
import { fail, ok, readJson } from '@/lib/http';

export const runtime = 'nodejs';

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'NEEDS_CORRECTION']),
  note: z.string().trim().max(2000).optional().default(''),
});

type Ctx = { params: Promise<{ id: string }> };

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
    try {
      const approved = await approveQuestion(id, admin, { note });
      return ok({ reviewState: approved.reviewState });
    } catch (error) {
      if (!(error instanceof QuestionApprovalError)) throw error;
      if (error.code === 'notFound') return fail('notFound', 404);
      if (error.code === 'invalidReviewTransition') return fail('invalidReviewTransition', 409);
      return fail('approvalValidation', 400, { issues: error.issues });
    }
  } else if (!note) {
    return fail('reviewNoteRequired', 400);
  }

  if (!['REVIEW_REQUIRED', 'NEEDS_CORRECTION'].includes(question.reviewState)) {
    return fail('invalidReviewTransition', 409);
  }

  const now = new Date();
  const state = action === 'REJECT' ? 'REJECTED' : 'NEEDS_CORRECTION';
  await prisma.$transaction(async (tx) => {
    await tx.question.update({
      where: { id },
      data: {
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
