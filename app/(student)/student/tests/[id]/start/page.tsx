import { NEET_CONFIG } from '@/lib/attempts/config';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { FREE_ATTEMPT_LIMIT, getFreeAttemptSummary } from '@/lib/attempts/service';
import type { ExamLanguage } from '@/lib/attempts/examState';
import StudentHeader from '@/components/student/StudentHeader';
import StartAttemptClient from '@/components/student/exam/StartAttemptClient';
import { productionTestWhere } from '@/lib/content/eligibility';
import { ClockIcon, BookIcon } from '@/components/public/icons';

/**
 * Instructions page: marking scheme, navigation help and a per-attempt language
 * choice before the timer begins. Authenticated students get three free starts
 * per test. An in-progress attempt can be resumed without consuming another.
 */
export default async function StartTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = (await getLocale()) as ExamLanguage;
  const t = await getTranslations('exam.instructions');
  const tn = await getTranslations('neetPractice');
  const tc = await getTranslations('catalogue');
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect(`/login?next=/student/tests/${id}/start`);

  const test = await prisma.test.findUnique({
    where: { ...productionTestWhere, id },
    select: {
      id: true,
      title: true,
      durationMinutes: true,
      totalQuestions: true,
      testType: true,
      availableLanguages: true,
    },
  });
  if (!test) notFound();

  const [summary, inProgress, latestCompleted] = await Promise.all([
    getFreeAttemptSummary(session.sub, id),
    prisma.testAttempt.findFirst({
      where: { studentId: session.sub, testId: id, status: 'IN_PROGRESS' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    }),
    prisma.testAttempt.findFirst({
      where: { studentId: session.sub, testId: id, status: { not: 'IN_PROGRESS' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    }),
  ]);
  const limitReached = !inProgress && summary.remaining <= 0;

  const title = localizedName(test.title, locale) || localizedName(test.title, 'en');
  const languages = (test.availableLanguages.length ? test.availableLanguages : ['en']) as ExamLanguage[];
  const defaultLanguage: ExamLanguage = languages.includes(locale) ? locale : 'en';

  const marking = [t('markCorrect'), t('markWrong'), t('markSkipped')];

  return (
    <div className="min-h-screen bg-surface">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href={`/student/tests/${id}`} className="text-sm font-medium text-brand hover:text-red-200">
          ← {t('back')}
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-textPrimary">{tn('title')}</h1><p className="mt-1 text-textSecondary">{title}</p>
        <p className="mt-3 text-xs text-textSecondary">{tn('disclaimer')}</p>

        <p className="mt-4 rounded-xl border border-border bg-surfaceElevated px-4 py-3 text-sm font-semibold text-textPrimary">
          {t('attemptsRemaining', { count: summary.remaining })} / {FREE_ATTEMPT_LIMIT}
        </p>

        {limitReached ? (
          <div className="mt-6 rounded-2xl border border-border bg-surfaceElevated p-6">
            <h2 className="text-lg font-semibold text-textPrimary">{t('limitReachedTitle')}</h2>
            <p className="mt-2 text-sm text-textSecondary">{t('limitReachedNote', { count: FREE_ATTEMPT_LIMIT })}</p>
            {latestCompleted ? (
              <Link
                href={`/student/results/${latestCompleted.id}`}
                className="mt-5 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark"
              >
                {t('viewResult')}
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <p className="mt-2 text-textSecondary">{t('subtitle')}</p>

            <dl className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surfaceElevated p-4">
                <ClockIcon className="h-6 w-6 text-brand" />
                <div>
                  <dt className="text-xs font-medium text-textSecondary">{t('durationLabel')}</dt>
                  <dd className="text-sm font-bold text-textPrimary">
                    {tc('minutes', { count: test.durationMinutes })}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surfaceElevated p-4">
                <BookIcon className="h-6 w-6 text-brand" />
                <div>
                  <dt className="text-xs font-medium text-textSecondary">{t('questionsLabel')}</dt>
                  <dd className="text-sm font-bold text-textPrimary">{test.totalQuestions}</dd>
                </div>
              </div>
            </dl>

            <div className="mt-4 space-y-2 text-sm text-textSecondary">
              <p>{tn('maximumMarks')}: <strong>{test.totalQuestions * NEET_CONFIG.correct}</strong></p>
              <p>{tn('questionType')}</p>
              {test.testType === 'FULL_TEST' ? <p>{tn('distribution')}</p> : null}
              <p>{tn('languageUnavailable')}</p>
              <a href={NEET_CONFIG.source} target="_blank" rel="noreferrer" className="text-brand underline">{tn('source')}</a>
            </div>
            <section className="mt-6 rounded-2xl border border-border bg-surfaceElevated p-5">
              <h2 className="text-sm font-semibold text-textPrimary">{t('marking')}</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-textSecondary">
                {marking.map((m) => (
                  <li key={m} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    {m}
                  </li>
                ))}
              </ul>

              <h2 className="mt-5 text-sm font-semibold text-textPrimary">{t('navigation')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('navHelp')}</p>

              <p className="mt-4 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-textSecondary">
                {t('timerNote')}
              </p>
            </section>

            {inProgress ? (
              <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-950/30 p-5">
                <h2 className="text-sm font-semibold text-amber-900">{t('resumeTitle')}</h2>
                <div className="mt-3">
                  <StartAttemptClient
                    testId={id}
                    languages={languages}
                    defaultLanguage={defaultLanguage}
                    resume
                  />
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-border bg-surfaceElevated p-5">
                <StartAttemptClient
                  testId={id}
                  languages={languages}
                  defaultLanguage={defaultLanguage}
                  resume={false}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
