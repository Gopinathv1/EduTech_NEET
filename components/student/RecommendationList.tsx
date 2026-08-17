import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { ExamLanguage } from '@/lib/attempts/examState';
import type { MatchedRecommendation } from '@/lib/reports/performance';
import { L } from '@/components/student/results/localize';

const KIND_ACCENT: Record<string, string> = {
  weakChapter: 'border-l-red-400',
  decliningChapter: 'border-l-amber-400',
  slowAccurate: 'border-l-brand',
};

/**
 * Renders the rule-based recommendations with a bilingual reason and a link to a
 * matching catalogue test. Shared by the student dashboard (top 3) and the
 * performance page.
 */
export default async function RecommendationList({
  recs,
  locale,
}: {
  recs: MatchedRecommendation[];
  locale: ExamLanguage;
}) {
  const t = await getTranslations('recommendations');
  if (recs.length === 0) {
    return <p className="mt-2 text-sm text-textSecondary">{t('empty')}</p>;
  }

  return (
    <ul className="mt-3 space-y-3">
      {recs.map((rec) => {
        const reason = t(`reason.${rec.reason.code}`, {
          chapter: L(rec.name, locale),
          accuracy: rec.reason.accuracy,
          tests: rec.reason.tests,
        });
        return (
          <li
            key={rec.chapterId}
            className={`rounded-xl border border-border border-l-4 bg-surfaceElevated p-4 ${KIND_ACCENT[rec.kind] ?? 'border-l-brand'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-textPrimary">{L(rec.name, locale)}</p>
                <p className="mt-1 text-sm text-textSecondary">{reason}</p>
              </div>
              {rec.test ? (
                <Link
                  href={`/student/tests/${rec.test.id}`}
                  className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                >
                  {t('practise')}
                </Link>
              ) : (
                <span className="shrink-0 rounded-lg bg-surfaceElevated px-3 py-1.5 text-xs font-medium text-slate-400">
                  {t('noTest')}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
