'use client';

import { useTranslations } from 'next-intl';
import type { PaletteCounts } from '@/lib/attempts/examState';

/** Confirmation dialog summarising answered/unanswered/marked/not-visited counts. */
export default function SubmitDialog({
  counts,
  total,
  submitting,
  onConfirm,
  onCancel,
}: {
  counts: PaletteCounts;
  total: number;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('exam.submitDialog');

  const rows = [
    { label: t('answered'), value: counts.answered, tone: 'text-green-700' },
    { label: t('unanswered'), value: counts.unanswered, tone: 'text-slate-700' },
    { label: t('marked'), value: counts.marked, tone: 'text-amber-700' },
    { label: t('notVisited'), value: counts.notVisited, tone: 'text-slate-500' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="submit-dialog-title" className="text-lg font-bold text-slate-900">
          {t('title')}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{t('intro')}</p>

        <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
              <dt className="text-sm text-slate-600">{r.label}</dt>
              <dd className={`text-sm font-bold ${r.tone}`}>
                {r.value} / {total}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t('warning')}
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
