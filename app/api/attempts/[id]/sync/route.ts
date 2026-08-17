import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { loadAttemptContext, finalizeAttempt } from '@/lib/attempts/service';
import { computeRemainingSeconds, isTimeUp } from '@/lib/attempts/timer';
import { ok, fail } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/attempts/[id]/sync — the client's periodic (every 30s) re-sync with
// the authoritative timer. Returns the server's remaining seconds; if time is up
// it auto-submits and tells the client to redirect to the result.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);

  const attempt = await loadAttemptContext(id, session.sub);
  if (!attempt) return fail('attemptNotFound', 404);

  if (attempt.status !== 'IN_PROGRESS') {
    return ok({ status: attempt.status, remainingSeconds: 0, redirect: `/student/results/${id}` });
  }

  const remainingSeconds = computeRemainingSeconds(attempt.startedAt, attempt.test.durationMinutes);

  if (isTimeUp(attempt.startedAt, attempt.test.durationMinutes)) {
    await finalizeAttempt(id, { auto: true });
    return ok({ status: 'AUTO_SUBMITTED', remainingSeconds: 0, redirect: `/student/results/${id}` });
  }

  // Refresh the cached value used for a fast resume.
  await prisma.testAttempt.update({ where: { id }, data: { remainingSeconds } });

  return ok({ status: 'IN_PROGRESS', remainingSeconds });
}
