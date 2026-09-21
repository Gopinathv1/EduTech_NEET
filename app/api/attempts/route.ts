import { getSession } from '@/lib/auth/session';
import { startAttemptSchema } from '@/lib/validation/attempt';
import { startOrResumeAttempt } from '@/lib/attempts/service';
import { ok, fail, readJson } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { withReturnParam } from '@/lib/auth/redirect';

export const runtime = 'nodejs';

// POST /api/attempts — start a new attempt (or resume the active one) for a test.
// Generates and freezes the question set on first start; the server enforces the
// per-student, per-test free-attempt quota.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);

  const parsed = startAttemptSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);

  const student = await prisma.student.findUnique({ where: { id: session.sub }, select: { isEmailVerified: true, isMobileVerified: true } });
  if (!student || (!student.isEmailVerified && !student.isMobileVerified)) {
    return fail('verificationRequired', 403, { redirect: withReturnParam('/verify-email', `/student/tests/${parsed.data.testId}/start`) });
  }

  const outcome = await startOrResumeAttempt(session.sub, parsed.data.testId, parsed.data.language);
  if (!outcome.ok) {
    const status =
      outcome.code === 'paymentRequired' ? 402 : outcome.code === 'notFound' ? 404 : 400;
    return fail(outcome.code, status, outcome.attemptId ? { attemptId: outcome.attemptId } : undefined);
  }

  return ok({
    attemptId: outcome.attemptId,
    resumed: outcome.resumed,
    redirect: `/student/tests/${parsed.data.testId}/attempt`,
  });
}
