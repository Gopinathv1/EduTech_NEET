import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import type { ExamLanguage } from '@/lib/attempts/examState';
import { buildResultReport } from '@/lib/reports/result-report';
import { buildAnswerReview } from '@/lib/reports/answer-review';
import StudentHeader from '@/components/student/StudentHeader';
import ResultTabs from '@/components/student/results/ResultTabs';
import ResultAnalysis from '@/components/student/results/ResultAnalysis';
import AnswerReview from '@/components/student/results/AnswerReview';
import DownloadReportButton from '@/components/student/results/DownloadReportButton';
import { L } from '@/components/student/results/localize';
import { shouldShowAdmissionBanner } from '@/lib/admission/config';
import { getSettings } from '@/lib/settings/service';
import AdmissionBanner from '@/components/student/admission/AdmissionBanner';

/**
 * Result page: score summary + subject/chapter/time analysis (Analysis tab) and a
 * full per-question answer review (Review tab), plus a PDF download. Bilingual.
 */
export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const locale = (await getLocale()) as ExamLanguage;
  const t = await getTranslations('results');
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect(`/login?next=/student/results/${attemptId}`);

  // If the attempt is still running, send the student back to it.
  const state = await prisma.testAttempt.findFirst({
    where: { id: attemptId, studentId: session.sub },
    select: { status: true, testId: true, test: { select: { testType: true } } },
  });
  if (!state) notFound();
  if (state.status === 'IN_PROGRESS') redirect(`/student/tests/${state.testId}/attempt`);

  const [report, review] = await Promise.all([
    buildResultReport(attemptId, session.sub),
    buildAnswerReview(attemptId, session.sub),
  ]);
  if (!report || !review) notFound();

  const dateStr = report.submittedAt
    ? report.submittedAt.toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-surface">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/student" className="text-sm font-medium text-brand hover:text-red-200">
              ← {t('backToDashboard')}
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-textPrimary">{L(report.testTitle, locale)}</h1>
            <p className="mt-1 text-sm text-textSecondary">
              {t('submittedOn', { date: dateStr })}
              {report.status === 'AUTO_SUBMITTED' ? ` · ${t('autoSubmitted')}` : ''}
            </p>
          </div>
          <DownloadReportButton attemptId={report.attemptId} />
        </div>

        {shouldShowAdmissionBanner({
          testType: state.test.testType,
          score: report.summary.score,
          cutoff: (await getSettings()).admissionScoreCutoff,
        }) ? (
          <AdmissionBanner />
        ) : null}

        <ResultTabs
          analysis={<ResultAnalysis report={report} locale={locale} />}
          review={<AnswerReview items={review} locale={locale} />}
        />
      </main>
    </div>
  );
}
