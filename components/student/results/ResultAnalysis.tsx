import { getTranslations } from 'next-intl/server';
import type { ExamLanguage } from '@/lib/attempts/examState';
import { formatDuration, round1, type Strength } from '@/lib/attempts/analysis';
import type { ResultReport } from '@/lib/reports/result-report';
import { L } from './localize';

/**
 * Analysis tab of the result page (server component): score summary + subject,
 * chapter and time breakdowns. Percentile & rank are shown as "coming soon"
 * placeholders for a future release.
 */

const STRENGTH_STYLE: Record<Strength, { bar: string; text: string; dot: string }> = {
  strong: { bar: 'bg-green-950/300', text: 'text-green-200', dot: 'bg-green-950/300' },
  average: { bar: 'bg-amber-950/300', text: 'text-amber-200', dot: 'bg-amber-950/300' },
  weak: { bar: 'bg-red-950/300', text: 'text-red-200', dot: 'bg-red-950/300' },
};

function Pct({ value }: { value: number }) {
  return <>{round1(value)}%</>;
}

export default async function ResultAnalysis({
  report,
  locale,
}: {
  report: ResultReport;
  locale: ExamLanguage;
}) {
  const t = await getTranslations('results');
  const s = report.summary;

  const summaryCards = [
    { label: t('summary.total'), value: s.totalQuestions, tone: 'text-textPrimary' },
    { label: t('summary.correct'), value: s.correct, tone: 'text-green-200' },
    { label: t('summary.wrong'), value: s.wrong, tone: 'text-red-200' },
    { label: t('summary.skipped'), value: s.skipped, tone: 'text-textSecondary' },
    { label: t('summary.accuracy'), value: `${round1(s.accuracy)}%`, tone: 'text-brand' },
    { label: t('summary.timeTaken'), value: formatDuration(s.timeTakenSeconds), tone: 'text-textPrimary' },
  ];

  return (
    <div className="space-y-8">
      {/* Score summary */}
      <section>
        <div className="rounded-2xl border border-border bg-surfaceElevated p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">{t('summary.score')}</p>
              <p className="mt-1 text-5xl font-extrabold text-brand">{s.score}</p>
              <p className="mt-1 text-sm text-textSecondary">{t('summary.outOf', { max: s.maxScore })}</p>
              <p className="mt-2 inline-block rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
                {t('summary.overallPercentage', { pct: s.percentage })}
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-3 sm:grid-cols-3">
              {summaryCards.map((c) => (
                <div key={c.label} className="rounded-xl border border-border px-3 py-2 text-center">
                  <dt className="text-[11px] text-textSecondary">{c.label}</dt>
                  <dd className={`mt-0.5 text-lg font-bold ${c.tone}`}>{c.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Future metrics */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[t('summary.percentile'), t('summary.rank')].map((label) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-dashed border-border bg-surface px-4 py-3">
                <span className="text-sm font-medium text-textSecondary">{label}</span>
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-textSecondary">
                  {t('summary.comingSoon')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subject analysis */}
      <section>
        <h2 className="text-lg font-semibold text-textPrimary">{t('subject.heading')}</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-surfaceElevated">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-textSecondary">
                <th className="px-4 py-3">{t('subject.subject')}</th>
                <th className="px-4 py-3 text-right">{t('subject.attempted')}</th>
                <th className="px-4 py-3 text-right">{t('subject.correct')}</th>
                <th className="px-4 py-3">{t('subject.accuracy')}</th>
                <th className="px-4 py-3 text-right">{t('subject.marks')}</th>
                <th className="px-4 py-3 text-right">{t('subject.time')}</th>
              </tr>
            </thead>
            <tbody>
              {report.subjects.map((row) => (
                <tr key={row.code} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-textPrimary">{L(row.name, locale)}</td>
                  <td className="px-4 py-3 text-right text-textSecondary">{row.attempted}</td>
                  <td className="px-4 py-3 text-right text-textSecondary">{row.correct}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surfaceElevated">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round(row.accuracy)}%` }} />
                      </div>
                      <span className="tabular-nums text-textSecondary">
                        <Pct value={row.accuracy} />
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-textPrimary">{row.marks}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-textSecondary">{formatDuration(row.timeSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Chapter analysis */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-textPrimary">{t('chapter.heading')}</h2>
          <p className="text-xs text-textSecondary">{t('chapter.legend')}</p>
        </div>
        {report.chapters.length === 0 ? (
          <p className="mt-3 text-sm text-textSecondary">{t('chapter.empty')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {report.chapters.map((c) => {
              const st = STRENGTH_STYLE[c.strength];
              return (
                <li key={c.chapterId} className="rounded-xl border border-border bg-surfaceElevated p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${st.dot}`} />
                      <span className="text-sm font-medium text-textPrimary">{L(c.name, locale)}</span>
                      <span className="text-[11px] uppercase tracking-wide text-slate-400">{c.subjectCode}</span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${st.text}`}>
                      <Pct value={c.accuracy} />
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surfaceElevated">
                    <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${Math.round(c.accuracy)}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {c.correct}/{c.attempted} · {t(`chapter.${c.strength}`)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Time analysis */}
      <section>
        <h2 className="text-lg font-semibold text-textPrimary">{t('time.heading')}</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-surfaceElevated p-3 text-center">
            <p className="text-[11px] text-textSecondary">{t('time.taken')}</p>
            <p className="mt-0.5 text-base font-bold text-textPrimary">{formatDuration(report.time.totalSeconds)}</p>
          </div>
          <div className="rounded-xl border border-border bg-surfaceElevated p-3 text-center">
            <p className="text-[11px] text-textSecondary">{t('time.allotted')}</p>
            <p className="mt-0.5 text-base font-bold text-textPrimary">{formatDuration(report.time.allottedSeconds)}</p>
          </div>
          <div className="rounded-xl border border-border bg-surfaceElevated p-3 text-center">
            <p className="text-[11px] text-textSecondary">{t('time.avgPerQuestion')}</p>
            <p className="mt-0.5 text-base font-bold text-textPrimary">{round1(report.time.avgSecondsPerQuestion)}s</p>
          </div>
        </div>

        {report.time.bySubject.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-border bg-surfaceElevated p-4">
            <p className="text-sm font-semibold text-textSecondary">{t('time.perSubject')}</p>
            <ul className="mt-3 space-y-2">
              {report.time.bySubject.map((r) => {
                const max = Math.max(...report.time.bySubject.map((x) => x.seconds));
                return (
                  <li key={r.code} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-textSecondary">{L(r.name, locale)}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surfaceElevated">
                      <div className="h-full rounded-full bg-brand/70" style={{ width: `${max > 0 ? Math.round((r.seconds / max) * 100) : 0}%` }} />
                    </div>
                    <span className="w-16 shrink-0 text-right tabular-nums text-textSecondary">{formatDuration(r.seconds)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-border bg-surfaceElevated p-4">
          <p className="text-sm font-semibold text-textSecondary">{t('time.slowest')}</p>
          {report.time.slowest.length === 0 ? (
            <p className="mt-2 text-sm text-textSecondary">{t('time.noSlowest')}</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {report.time.slowest.map((q) => (
                <li key={q.number} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md bg-surfaceElevated px-1.5 text-xs font-semibold text-textSecondary">
                      {t('time.question', { number: q.number })}
                    </span>
                    <span className="text-textSecondary">{L(q.chapterName, locale)}</span>
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">{q.subjectCode}</span>
                  </span>
                  <span className="tabular-nums font-medium text-textSecondary">{formatDuration(q.seconds)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
