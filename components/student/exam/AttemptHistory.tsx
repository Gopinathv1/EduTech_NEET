import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { FREE_ATTEMPT_LIMIT, NEET_CONFIG } from '@/lib/attempts/config';
import { examPaidRetriesEnabled } from '@/lib/attempts/paid-retries';
import { attemptHistoryAction } from '@/lib/attempts/history-action';

export default async function AttemptHistory({
  studentId,
  testId,
  canStartAnotherAttempt = true,
}: {
  studentId: string;
  testId: string;
  canStartAnotherAttempt?: boolean;
}) {
  const t = await getTranslations('neetPractice');
  const locale = await getLocale();
  const attempts = await prisma.testAttempt.findMany({
    where: { studentId, testId }, orderBy: { createdAt: 'asc' },
    select: { id: true, status: true, startedAt: true, result: { select: { score: true, totalQuestions: true } } },
  });
  const paidRetriesEnabled = examPaidRetriesEnabled();
  const completedCount = attempts.filter((attempt) => attempt.status !== 'IN_PROGRESS').length;
  const nextAction = attemptHistoryAction({
    canStartAnotherAttempt,
    paidRetriesEnabled,
    attemptCount: attempts.length,
    freeAttemptLimit: FREE_ATTEMPT_LIMIT,
    hasActiveAttempt: attempts.some((attempt) => attempt.status === 'IN_PROGRESS'),
  });
  return <section className="mt-8 rounded-2xl border border-border p-5">
    <h2 className="text-lg font-bold">{t('history')}</h2>
    <p className="mt-1 text-sm text-textSecondary">{paidRetriesEnabled ? t('used', { count: attempts.length, limit: FREE_ATTEMPT_LIMIT }) : `${completedCount} completed · Unlimited practice attempts are available.`}</p>
    <ul className="mt-3 divide-y divide-border">
      {attempts.map((a, i) => <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <Link className="font-semibold text-brand underline" href={a.status === 'IN_PROGRESS' ? `/student/tests/${testId}/attempt` : `/student/results/${a.id}`}>
          {t('attempt', { number: i + 1 })}
        </Link>
        <span>{a.startedAt.toLocaleDateString(locale)}</span>
        <span>{a.result ? `${a.result.score} / ${a.result.totalQuestions * NEET_CONFIG.correct}` : '—'}</span>
        <span>{t(a.status === 'IN_PROGRESS' ? 'inProgress' : 'completed')}</span>
      </li>)}
    </ul>
    {nextAction === 'practice-again' ?
      <Link className="mt-4 inline-block rounded-lg bg-brand px-4 py-3 font-semibold text-white" href={`/student/tests/${testId}/start`}>Take Another Attempt</Link> : null}
    {nextAction === 'choose-another' ? (
      <div className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-textSecondary">
        <p>This previous practice set is no longer available for a new attempt. Your result remains available above.</p>
        <Link className="mt-2 inline-block font-semibold text-brand underline" href="/student/tests">Choose another practice test</Link>
      </div>
    ) : null}
  </section>;
}
