import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { FREE_ATTEMPT_LIMIT, NEET_CONFIG } from '@/lib/attempts/config';
import { examPaidRetriesEnabled } from '@/lib/attempts/paid-retries';

export default async function AttemptHistory({ studentId, testId }: { studentId: string; testId: string }) {
  const t = await getTranslations('neetPractice');
  const locale = await getLocale();
  const attempts = await prisma.testAttempt.findMany({
    where: { studentId, testId }, orderBy: { createdAt: 'asc' },
    select: { id: true, status: true, startedAt: true, result: { select: { score: true, totalQuestions: true } } },
  });
  const paidRetriesEnabled = examPaidRetriesEnabled();
  return <section className="mt-8 rounded-2xl border border-border p-5">
    <h2 className="text-lg font-bold">{t('history')}</h2>
    <p className="mt-1 text-sm text-textSecondary">{paidRetriesEnabled ? t('used', { count: attempts.length, limit: FREE_ATTEMPT_LIMIT }) : `${attempts.length} practice attempts completed — unlimited access.`}</p>
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
    {(!paidRetriesEnabled || attempts.length < FREE_ATTEMPT_LIMIT) && !attempts.some(a => a.status === 'IN_PROGRESS') ?
      <Link className="mt-4 inline-block rounded-lg bg-brand px-4 py-3 font-semibold text-white" href={`/student/tests/${testId}/start`}>{t('another')}</Link> : null}
  </section>;
}
