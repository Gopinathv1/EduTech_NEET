import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { switchLanguageSchema } from '@/lib/validation/attempt';
import { loadAttemptContext } from '@/lib/attempts/service';
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

  await prisma.testAttempt.update({ where: { id }, data: { selectedLanguage: parsed.data.language } });
  return ok({ language: parsed.data.language });
}
