import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { buildPerformance, MIN_QUALIFY, type ChapterListRow } from '@/lib/reports/performance';
import { round1, formatDuration, type Strength } from '@/lib/attempts/analysis';
import type { ExamLanguage } from '@/lib/attempts/examState';
import StudentHeader from '@/components/student/StudentHeader';
import PerformanceCharts from '@/components/student/performance/PerformanceCharts';
import RecommendationList from '@/components/student/RecommendationList';
import { L } from '@/components/student/results/localize';

const STRENGTH_TEXT: Record<Strength, string> = {
  strong: 'text-green-700',
  average: 'text-amber-700',
  weak: 'text-red-700',
};

/** Cross-attempt performance analytics: trends, subject accuracy, strong/weak
 *  chapters, attempt history and recommendations. Bilingual. */
export default async function PerformancePage() {
  const locale = (await getLocale()) as ExamLanguage;
  const t = await getTranslations('performance');
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect('/login?next=/student/performance');

  const perf = await buildPerformance(session.sub);

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-600">{t('subtitle')}</p>

        {perf.attemptsCount === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-900">{t('noData')}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{t('noDataHint')}</p>
            <Link
              href="/student/tests"
              className="mt-5 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {t('browseTests')}
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {/* Charts */}
            <PerformanceCharts
              scoreTrend={perf.trend.map((p) => ({ label: p.label, score: p.score }))}
              subjectAccuracy={perf.subjectAccuracy.map((s) => ({ name: L(s.name, locale), accuracy: round1(s.accuracy) }))}
              timeTrend={perf.trend.map((p) => ({ label: p.label, avgSeconds: p.avgSeconds }))}
            />

            {/* Recommendations */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900">
                {(await getTranslations('recommendations'))('heading')}
              </h2>
              <RecommendationList recs={perf.recommendations} locale={locale} />
            </section>

            {/* Strong / weak chapters */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ChapterColumn heading={t('strong.heading')} rows={perf.strongChapters} empty={t('strong.empty', { min: MIN_QUALIFY })} locale={locale} />
              <ChapterColumn heading={t('weak.heading')} rows={perf.weakChapters} empty={t('weak.empty')} locale={locale} />
            </section>
            <p className="text-xs text-slate-400">{t('minNote', { min: MIN_QUALIFY })}</p>

            {/* Attempt history */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900">{t('history.heading')}</h2>
              <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">{t('history.test')}</th>
                      <th className="px-4 py-3">{t('history.date')}</th>
                      <th className="px-4 py-3 text-right">{t('history.score')}</th>
                      <th className="px-4 py-3 text-right">{t('history.accuracy')}</th>
                      <th className="px-4 py-3 text-right">{t('history.avgTime')}</th>
                      <th className="px-4 py-3 text-right">{t('history.view')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perf.history.map((a) => (
                      <tr key={a.attemptId} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {L(a.testTitle, locale)}
                          {a.status === 'AUTO_SUBMITTED' ? (
                            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                              {t('history.auto')}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {a.submittedAt
                            ? new Date(a.submittedAt).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-GB', {
                                day: '2-digit',
                                month: 'short',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-800">{a.score}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{round1(a.accuracy)}%</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">{round1(a.avgSecondsPerQuestion)}s</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/student/results/${a.attemptId}`} className="font-semibold text-brand hover:text-brand-dark">
                            {t('history.view')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function ChapterColumn({
  heading,
  rows,
  empty,
  locale,
}: {
  heading: string;
  rows: ChapterListRow[];
  empty: string;
  locale: ExamLanguage;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-800">{heading}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((c) => (
            <li key={c.chapterId} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-700">
                {L(c.name, locale)}
                <span className="ml-1.5 text-[11px] uppercase tracking-wide text-slate-400">{c.subjectCode}</span>
              </span>
              <span className={`shrink-0 font-bold tabular-nums ${STRENGTH_TEXT[c.strength]}`}>{round1(c.accuracy)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
