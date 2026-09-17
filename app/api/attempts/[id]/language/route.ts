import { isTimeUp } from '@/lib/attempts/timer';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { switchLanguageSchema } from '@/lib/validation/attempt';
import { loadAttemptContext, finalizeAttempt } from '@/lib/attempts/service';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/attempts/[id]/language — persist the attempt's display language when
// the student switches mid-test. Purely a rendering preference: it does not touch
// the timer, answers, palette, or the current question (those are all preserved
// client-side and in their own records). Persisting it means a resume reopens in
// the same language.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);

  const parsed = switchLanguageSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);

  const attempt = await loadAttemptContext(id, session.sub);
  if (!attempt) return fail('attemptNotFound', 404);
  if (attempt.status !== 'IN_PROGRESS') return fail('attemptClosed', 409);

  if (isTimeUp(attempt.startedAt, attempt.test.durationMinutes)) {
    await finalizeAttempt(id, { auto: true });
    return fail('timeUp', 409);
  }
  const missing = await prisma.question.count({ where: { id: { in: attempt.questionOrder },
    translations: { none: { language: parsed.data.language, ...(parsed.data.language === 'en' ? {} : { reviewed: true }) } } } });
  if (missing) return fail('languageUnavailable', 400);
  const updated = await prisma.testAttempt.updateMany({ where: { id, status: 'IN_PROGRESS' }, data: { selectedLanguage: parsed.data.language } });
  if (!updated.count) return fail('attemptClosed', 409);
  return ok({ language: parsed.data.language });
}
