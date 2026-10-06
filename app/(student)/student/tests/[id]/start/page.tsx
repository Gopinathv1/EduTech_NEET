import { JEE_MAIN_CONFIG, NEET_CONFIG } from '@/lib/attempts/config';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { FREE_ATTEMPT_LIMIT, getFreeAttemptSummary } from '@/lib/attempts/service';
import { examPaidRetriesEnabled } from '@/lib/attempts/paid-retries';
import type { ExamLanguage } from '@/lib/attempts/examState';
import StudentHeader from '@/components/student/StudentHeader';
import StartAttemptClient from '@/components/student/exam/StartAttemptClient';
import { studentTestWhere } from '@/lib/content/eligibility';
import { withReturnParam } from '@/lib/auth/redirect';
import { examEmailVerificationGateEnabled } from '@/lib/attempts/verification';
import { ClockIcon, BookIcon } from '@/components/public/icons';
import { studentExamFromRules, studentExamHeadingKey } from '@/lib/attempts/presentation';
import { natureCounts, supportsNature } from '@/lib/previous-year/nature-pool';
import { questionNatureSchema, QUESTION_NATURES, QUESTION_NATURE_LABELS, natureStartUrl } from '@/lib/previous-year/question-nature';

/**
 * Instructions page: marking scheme, navigation help and a per-attempt language
 * choice before the timer begins. Authenticated students get three free starts
 * per test. An in-progress attempt can be resumed without consuming another.
 */
export default async function StartTestPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ nature?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const requestedNature = query.nature ? questionNatureSchema.safeParse(query.nature) : null;
  if (requestedNature && !requestedNature.success) notFound();
  const selectedNature = requestedNature?.success ? requestedNature.data : undefined;
  const returnPath = natureStartUrl(id, selectedNature);
  const locale = (await getLocale()) as ExamLanguage;
  const t = await getTranslations('exam.instructions');
  const tn = await getTranslations('neetPractice');
  const tp = await getTranslations('examPresentation');
  const tc = await getTranslations('catalogue');
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect(withReturnParam('/login', returnPath));
  if (examEmailVerificationGateEnabled()) {
    const identity = await prisma.student.findUnique({ where: { id: session.sub }, select: { isEmailVerified: true, isMobileVerified: true } });
    if (!identity || (!identity.isEmailVerified && !identity.isMobileVerified)) {
      redirect(withReturnParam('/verify-email', returnPath));
    }
  }

  const test = await prisma.test.findUnique({
    where: { ...studentTestWhere, id },
    select: {
      id: true,
      title: true,
      durationMinutes: true,
      totalQuestions: true,
      testType: true,
      availableLanguages: true,
      rules: true,
      isRandom: true,
    },
  });
  if (!test) notFound();
  const natureSupported = supportsNature(test);
  if (selectedNature && !natureSupported) notFound();
  const counts = natureSupported ? await natureCounts(test) : {};

  const [summary, inProgress, latestCompleted] = await Promise.all([
    getFreeAttemptSummary(session.sub, id),
    prisma.testAttempt.findFirst({
      where: { studentId: session.sub, testId: id, status: 'IN_PROGRESS' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, questionNature: true, questionOrder: true },
    }),
    prisma.testAttempt.findFirst({
      where: { studentId: session.sub, testId: id, status: { not: 'IN_PROGRESS' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    }),
  ]);
  const paidRetriesEnabled = examPaidRetriesEnabled();
  const nature = inProgress ? inProgress.questionNature ?? undefined : selectedNature;
  const questionCount = inProgress ? inProgress.questionOrder.length
    : nature ? Math.min(test.totalQuestions, counts[nature] ?? 0) : test.totalQuestions;
  const limitReached = paidRetriesEnabled && !inProgress && (summary.remaining ?? 0) <= 0;

  const title = localizedName(test.title, locale) || localizedName(test.title, 'en');
  const languages = (test.availableLanguages.length ? test.availableLanguages : ['en']) as ExamLanguage[];
  const defaultLanguage: ExamLanguage = languages.includes(locale) ? locale : 'en';

  const marking = [t('markCorrect'), t('markWrong'), t('markSkipped')];
  const exam = studentExamFromRules(test.rules);
  const examConfig = exam === 'JEE' ? JEE_MAIN_CONFIG : NEET_CONFIG;

  return (
    <div className="min-h-screen bg-surface">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href={`/student/tests/${id}`} className="text-sm font-medium text-brand hover:text-red-200">
          ← {t('back')}
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-textPrimary">{tp(studentExamHeadingKey(exam))}</h1><p className="mt-1 text-textSecondary">{title}</p>
        <p className="mt-3 text-xs text-textSecondary">{tn('disclaimer')}</p>
        {natureSupported ? (
          <section className="mt-5 rounded-xl border border-border p-4" aria-label="Question Nature">
            <h2 className="text-sm font-bold">Question Nature</h2>
            {inProgress ? <p className="mt-2 text-sm">Resume preserves the saved question selection: {nature ? QUESTION_NATURE_LABELS[nature] : 'All Questions'}.</p> : (
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={natureStartUrl(id)} aria-current={!nature ? 'page' : undefined} className="rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">All Questions ({test.totalQuestions})</Link>
                {QUESTION_NATURES.map(value => (counts[value] ?? 0) > 0 ? (
                  <Link key={value} href={natureStartUrl(id, value)} aria-current={nature === value ? 'page' : undefined} className="rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">
                    {QUESTION_NATURE_LABELS[value]} ({counts[value]})
                  </Link>
                ) : null)}
              </div>
            )}
            <p className="mt-3 text-xs text-textSecondary">{nature ? 'Filtered practice using validated questions; this is not the original historical paper. The published practice duration applies.' : 'All Questions preserves the published practice format, including the historical partial paper for year-wise practice.'}</p>
            {!inProgress && nature && questionCount === 0 ? <p role="status" className="mt-3 text-sm">No validated questions available for this filter.</p> : null}
          </section>
        ) : null}

        {paidRetriesEnabled ? (
          <p className="mt-4 rounded-xl border border-border bg-surfaceElevated px-4 py-3 text-sm font-semibold text-textPrimary">
            {t('attemptsRemaining', { count: summary.remaining ?? 0 })} / {FREE_ATTEMPT_LIMIT}
          </p>
        ) : (
          <p className="mt-4 rounded-xl border border-brand/30 bg-surfaceElevated px-4 py-3 text-sm font-semibold text-textPrimary">
            Unlimited practice access is available for this test.
          </p>
        )}

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
            <div className="mt-4">
              <StartAttemptClient
                testId={id}
                languages={languages}
                defaultLanguage={defaultLanguage}
                resume={false}
                testType={test.testType}
                  questionNature={nature}
                  disabled={!inProgress && questionCount === 0}
              />
            </div>
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
                  <dd className="text-sm font-bold text-textPrimary">{questionCount}</dd>
                </div>
              </div>
            </dl>

            <div className="mt-4 space-y-2 text-sm text-textSecondary">
              <p>{tn('maximumMarks')}: <strong>{questionCount * examConfig.correct}</strong></p>
              <p>{exam === 'JEE' ? 'Paper 1 includes multiple-choice and numerical-value questions.' : tn('questionType')}</p>
              {test.testType === 'FULL_TEST' && !nature ? <p>{exam === 'JEE' ? 'Each subject has 20 multiple-choice and 5 numerical-value questions.' : tn('distribution')}</p> : null}
              <p>{tn('languageUnavailable')}</p>
              <a href={examConfig.source} target="_blank" rel="noreferrer" className="text-brand underline">{tn('source')}</a>
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
                    testType={test.testType}
                  questionNature={nature}
                  disabled={!inProgress && questionCount === 0}
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
                  testType={test.testType}
                  questionNature={nature}
                  disabled={!inProgress && questionCount === 0}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
