import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import type { ExamLanguage } from '@/lib/attempts/examState';
import StudentHeader from '@/components/student/StudentHeader';
import StartAttemptClient from '@/components/student/exam/StartAttemptClient';
import { ClockIcon, BookIcon } from '@/components/public/icons';

/**
 * Instructions page: marking scheme, navigation help and a per-attempt language
 * choice before the timer begins. Owners only. Behaviour depends on any prior
 * attempt — start fresh, resume an in-progress one, or view the result of a
 * completed one (a test can be attempted only once).
 */
export default async function StartTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = (await getLocale()) as ExamLanguage;
  const t = await getTranslations('exam.instructions');
  const tc = await getTranslations('catalogue');
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect(`/login?next=/student/tests/${id}/start`);

  const test = await prisma.test.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      isPublished: true,
      durationMinutes: true,
      totalQuestions: true,
      availableLanguages: true,
      price: true,
    },
  });
  if (!test || !test.isPublished) notFound();

  const owned = (await prisma.testEntitlement.count({ where: { studentId: session.sub, testId: id } })) > 0;
  if (!owned && test.price > 0) redirect(`/student/tests/${id}`);

  const existing = await prisma.testAttempt.findFirst({
    where: { studentId: session.sub, testId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true },
  });
  const completed = existing && existing.status !== 'IN_PROGRESS';
  const inProgress = existing && existing.status === 'IN_PROGRESS';

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

        <h1 className="mt-3 text-2xl font-bold text-textPrimary">{title}</h1>

        {completed ? (
          <div className="mt-6 rounded-2xl border border-border bg-surfaceElevated p-6">
            <h2 className="text-lg font-semibold text-textPrimary">{t('completedTitle')}</h2>
            <p className="mt-2 text-sm text-textSecondary">{t('completedNote')}</p>
            <Link
              href={`/student/results/${existing!.id}`}
              className="mt-5 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark"
            >
              {t('viewResult')}
            </Link>
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
