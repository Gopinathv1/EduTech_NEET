import type { AnswerOption, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { answerActionSchema } from '@/lib/validation/attempt';
import { loadAttemptContext, finalizeAttempt } from '@/lib/attempts/service';
import { computeRemainingSeconds, isPastGrace } from '@/lib/attempts/timer';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/attempts/[id]/answer — autosave a single answer action (select, clear,
// mark, unmark, visit) plus the time spent on that question. The server is the
// time authority: an answer that arrives past the deadline + grace window is
// refused and the attempt is auto-submitted.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);

  const parsed = answerActionSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const { questionId, action, selectedOption, timeSpentDelta } = parsed.data;

  const attempt = await loadAttemptContext(id, session.sub);
  if (!attempt) return fail('attemptNotFound', 404);

  if (attempt.status !== 'IN_PROGRESS') {
    return fail('attemptClosed', 409, { status: attempt.status, redirect: `/student/results/${id}` });
  }

  // The question must belong to this attempt's frozen set.
  if (!attempt.questionOrder.includes(questionId)) return fail('questionNotInAttempt', 400);

  // Time authority — refuse late answers and auto-submit.
  if (isPastGrace(attempt.startedAt, attempt.test.durationMinutes)) {
    await finalizeAttempt(id, { auto: true });
    return fail('timeUp', 409, { status: 'AUTO_SUBMITTED', redirect: `/student/results/${id}` });
  }

  const delta = timeSpentDelta ?? 0;
  const update: Prisma.AnswerUpdateInput = { visited: true };
  const create: Prisma.AnswerUncheckedCreateInput = {
    attemptId: id,
    questionId,
    visited: true,
    timeSpentSeconds: delta,
  };

  switch (action) {
    case 'answer':
      if (!selectedOption) return fail('validation', 400);
      update.selectedOption = selectedOption as AnswerOption;
      create.selectedOption = selectedOption as AnswerOption;
      break;
    case 'clear':
      update.selectedOption = null;
      create.selectedOption = null;
      break;
    case 'mark':
      update.isMarkedForReview = true;
      create.isMarkedForReview = true;
      break;
    case 'unmark':
      update.isMarkedForReview = false;
      create.isMarkedForReview = false;
      break;
    case 'visit':
      break;
  }
  if (delta > 0) update.timeSpentSeconds = { increment: delta };

  await prisma.answer.upsert({
    where: { attemptId_questionId: { attemptId: id, questionId } },
    create,
    update,
  });

  return ok({
    saved: true,
    remainingSeconds: computeRemainingSeconds(attempt.startedAt, attempt.test.durationMinutes),
  });
}
