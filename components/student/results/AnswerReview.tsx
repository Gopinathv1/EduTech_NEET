'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ExamLanguage } from '@/lib/attempts/examState';
import type { ReviewItem, ReviewStatus } from '@/lib/reports/answer-review';
import type { ScoredOption } from '@/lib/attempts/result';
import { L } from './localize';

const OPTIONS: ScoredOption[] = ['A', 'B', 'C', 'D'];
type Filter = 'all' | 'wrong' | 'skipped' | 'marked';

const STATUS_BADGE: Record<ReviewStatus, string> = {
  correct: 'bg-green-950/40 text-green-200',
  wrong: 'bg-red-950/40 text-red-200',
  skipped: 'bg-surfaceElevated text-textSecondary',
};

/**
 * Answer review: every question with the student's choice, the correct option and
 * the explanation, in the preferred language (English fallback + notice when a
 * reviewed Tamil translation is missing). Filterable by wrong / skipped / marked.
 */
export default function AnswerReview({ items, locale }: { items: ReviewItem[]; locale: ExamLanguage }) {
  const t = useTranslations('results.review');
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(
    () => ({
      all: items.length,
      wrong: items.filter((i) => i.status === 'wrong').length,
      skipped: items.filter((i) => i.status === 'skipped').length,
      marked: items.filter((i) => i.marked).length,
    }),
    [items],
  );

  const filtered = items.filter((i) =>
    filter === 'all' ? true : filter === 'marked' ? i.marked : i.status === filter,
  );

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'wrong', label: t('filterWrong') },
    { key: 'skipped', label: t('filterSkipped') },
    { key: 'marked', label: t('filterMarked') },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="sticky top-16 z-10 -mx-1 flex flex-wrap gap-2 bg-surface/90 px-1 py-2 backdrop-blur">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                active ? 'bg-brand text-white' : 'border border-border bg-surfaceElevated text-textSecondary hover:bg-surfaceElevated'
              }`}
            >
              {f.label} <span className={active ? 'opacity-80' : 'text-slate-400'}>({counts[f.key]})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surfaceElevated p-6 text-center text-sm text-textSecondary">
          {t('empty')}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {filtered.map((item) => {
            const content = locale === 'ta' && item.ta ? item.ta : item.en;
            const taNotice = locale === 'ta' && !item.ta;
            return (
              <li key={item.questionId} className="rounded-2xl border border-border bg-surfaceElevated p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md bg-surfaceElevated px-1.5 text-xs font-bold text-textSecondary">
                    {item.number}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[item.status]}`}>
                    {t(`badge${item.status[0].toUpperCase()}${item.status.slice(1)}` as 'badgeCorrect' | 'badgeWrong' | 'badgeSkipped')}
                  </span>
                  {item.marked ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                      {t('badgeMarked')}
                    </span>
                  ) : null}
                  <span className="ml-auto text-[11px] uppercase tracking-wide text-slate-400">
                    {L(item.chapterName, locale)} · {item.subjectCode}
                  </span>
                </div>

                {taNotice ? (
                  <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">
                    {t('taNotice')}
                  </p>
                ) : null}

                <p className="mt-3 whitespace-pre-line text-sm font-medium text-textPrimary">{content.questionText}</p>

                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="mt-3 max-h-56 w-auto rounded-lg border border-border" />
                ) : null}

                <ul className="mt-3 space-y-2">
                  {OPTIONS.map((opt) => {
                    const isCorrect = opt === item.correctOption;
                    const isChosen = opt === item.selectedOption;
                    const isWrongChoice = isChosen && !isCorrect;
                    const style = isCorrect
                      ? 'border-green-500/50 bg-green-950/30'
                      : isWrongChoice
                        ? 'border-red-500/50 bg-red-950/30'
                        : 'border-border bg-surfaceElevated';
                    return (
                      <li key={opt} className={`flex items-start gap-3 rounded-lg border p-2.5 ${style}`}>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            isCorrect
                              ? 'border-green-500 bg-green-950/300 text-white'
                              : isWrongChoice
                                ? 'border-red-500 bg-red-950/300 text-white'
                                : 'border-border text-textSecondary'
                          }`}
                        >
                          {opt}
                        </span>
                        <span className="pt-0.5 text-sm text-textPrimary">{content.options[opt]}</span>
                        <span className="ml-auto flex shrink-0 gap-1.5 pt-0.5">
                          {isChosen ? (
                            <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-textSecondary">
                              {t('yourAnswer')}
                            </span>
                          ) : null}
                          {isCorrect ? (
                            <span className="rounded bg-green-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-green-100">
                              {t('correctAnswer')}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {item.status === 'skipped' ? (
                  <p className="mt-2 text-xs italic text-slate-400">{t('notAnswered')}</p>
                ) : null}

                <div className="mt-3 rounded-lg bg-surface p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-textSecondary">{t('explanation')}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-textSecondary">
                    {content.explanation || t('noExplanation')}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
