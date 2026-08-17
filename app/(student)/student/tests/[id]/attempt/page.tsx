import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { buildExamPayload, finalizeAttempt } from '@/lib/attempts/service';
import { isTimeUp } from '@/lib/attempts/timer';
import type { ExamLanguage } from '@/lib/attempts/examState';
import ExamClient from '@/components/student/exam/ExamClient';

/**
 * The full-screen exam. Server component that loads the student's active attempt,
 * enforces the deadline on load (auto-submitting if time ran out while away), then
 * hands the frozen question set + saved answers to the client. Navigating here
 * with no active attempt sends the student back to the instructions page; a
 * finished attempt goes to its result.
 */
export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = (await getLocale()) as ExamLanguage;
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect(`/login?next=/student/tests/${id}/attempt`);

  const attempt = await prisma.testAttempt.findFirst({
    where: { studentId: session.sub, testId: id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      startedAt: true,
      selectedLanguage: true,
      remainingSeconds: true,
      questionOrder: true,
      seed: true,
      shuffleOptions: true,
      test: { select: { title: true, availableLanguages: true, durationMinutes: true } },
    },
  });

  if (!attempt) redirect(`/student/tests/${id}/start`);
  if (attempt.status !== 'IN_PROGRESS') redirect(`/student/results/${attempt.id}`);

  // Deadline check on load — if time expired while the student was away, auto-submit.
  if (isTimeUp(attempt.startedAt, attempt.test.durationMinutes)) {
    await finalizeAttempt(attempt.id, { auto: true });
    redirect(`/student/results/${attempt.id}`);
  }

  const payload = await buildExamPayload(attempt);
  const testTitle = localizedName(attempt.test.title, locale) || localizedName(attempt.test.title, 'en');

  return <ExamClient payload={payload} testTitle={testTitle} studentName={session.name ?? ''} />;
}
