import { getSession } from '@/lib/auth/session';
import { startAttemptSchema } from '@/lib/validation/attempt';
import { startOrResumeAttempt } from '@/lib/attempts/service';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/attempts — start a new attempt (or resume the active one) for a test.
// Generates and freezes the question set on first start; enforces one attempt per
// test and blocks re-attempting a completed test.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);

  const parsed = startAttemptSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);

  const outcome = await startOrResumeAttempt(session.sub, parsed.data.testId, parsed.data.language);
  if (!outcome.ok) {
    const status =
      outcome.code === 'notOwned' ? 403 : outcome.code === 'notFound' ? 404 : outcome.code === 'alreadyCompleted' ? 409 : 400;
    return fail(outcome.code, status, outcome.attemptId ? { attemptId: outcome.attemptId } : undefined);
  }

  return ok({
    attemptId: outcome.attemptId,
    resumed: outcome.resumed,
    redirect: `/student/tests/${parsed.data.testId}/attempt`,
  });
}
