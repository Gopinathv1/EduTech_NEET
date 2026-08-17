import { getSession } from '@/lib/auth/session';
import { loadAttemptContext, finalizeAttempt } from '@/lib/attempts/service';
import { isTimeUp } from '@/lib/attempts/timer';
import { ok, fail } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/attempts/[id]/submit — finalise an attempt. A manual submit records
// SUBMITTED; if the deadline has already passed it is recorded as AUTO_SUBMITTED.
// Idempotent: submitting an already-finalised attempt just returns the redirect.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);

  const attempt = await loadAttemptContext(id, session.sub);
  if (!attempt) return fail('attemptNotFound', 404);

  const redirect = `/student/results/${id}`;
  if (attempt.status !== 'IN_PROGRESS') return ok({ status: attempt.status, redirect });

  const auto = isTimeUp(attempt.startedAt, attempt.test.durationMinutes);
  const outcome = await finalizeAttempt(id, { auto });
  if (!outcome.ok) return fail('submitFailed', 500);

  return ok({ status: outcome.status, redirect });
}
