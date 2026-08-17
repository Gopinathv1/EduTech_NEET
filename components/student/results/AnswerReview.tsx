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
  correct: 'bg-green-100 text-green-700',
  wrong: 'bg-red-100 text-red-700',
  skipped: 'bg-slate-100 text-slate-500',
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
      <div className="sticky top-16 z-10 -mx-1 flex flex-wrap gap-2 bg-slate-50/90 px-1 py-2 backdrop-blur">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                active ? 'bg-brand text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {f.label} <span className={active ? 'opacity-80' : 'text-slate-400'}>({counts[f.key]})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          {t('empty')}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {filtered.map((item) => {
            const content = locale === 'ta' && item.ta ? item.ta : item.en;
            const taNotice = locale === 'ta' && !item.ta;
            return (
              <li key={item.questionId} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md bg-slate-100 px-1.5 text-xs font-bold text-slate-600">
                    {item.number}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[item.status]}`}>
                    {t(`badge${item.status[0].toUpperCase()}${item.status.slice(1)}` as 'badgeCorrect' | 'badgeWrong' | 'badgeSkipped')}
                  </span>
                  {item.marked ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      {t('badgeMarked')}
                    </span>
                  ) : null}
                  <span className="ml-auto text-[11px] uppercase tracking-wide text-slate-400">
                    {L(item.chapterName, locale)} · {item.subjectCode}
                  </span>
                </div>

                {taNotice ? (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {t('taNotice')}
                  </p>
                ) : null}

                <p className="mt-3 whitespace-pre-line text-sm font-medium text-slate-900">{content.questionText}</p>

                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="mt-3 max-h-56 w-auto rounded-lg border border-slate-200" />
                ) : null}

                <ul className="mt-3 space-y-2">
                  {OPTIONS.map((opt) => {
                    const isCorrect = opt === item.correctOption;
                    const isChosen = opt === item.selectedOption;
                    const isWrongChoice = isChosen && !isCorrect;
                    const style = isCorrect
                      ? 'border-green-300 bg-green-50'
                      : isWrongChoice
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-200 bg-white';
                    return (
                      <li key={opt} className={`flex items-start gap-3 rounded-lg border p-2.5 ${style}`}>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            isCorrect
                              ? 'border-green-500 bg-green-500 text-white'
                              : isWrongChoice
                                ? 'border-red-500 bg-red-500 text-white'
                                : 'border-slate-300 text-slate-500'
                          }`}
                        >
                          {opt}
                        </span>
                        <span className="pt-0.5 text-sm text-slate-800">{content.options[opt]}</span>
                        <span className="ml-auto flex shrink-0 gap-1.5 pt-0.5">
                          {isChosen ? (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              {t('yourAnswer')}
                            </span>
                          ) : null}
                          {isCorrect ? (
                            <span className="rounded bg-green-200 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
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

                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('explanation')}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
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
