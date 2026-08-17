'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { inputClass, selectClass } from '@/components/ui/Form';

export type CatalogueFilterValues = {
  year: string;
  difficulty: string;
  subject: string;
  chapter: string;
  type: string;
  q: string;
};

const EMPTY: CatalogueFilterValues = { year: '', difficulty: '', subject: '', chapter: '', type: '', q: '' };
const TYPES = ['FULL_TEST', 'MINI_TEST', 'CHAPTER_TEST', 'SUBJECT_TEST', 'YEAR_PATTERN'];

export default function CatalogueFilters({
  years,
  chapters,
  initial,
}: {
  years: number[];
  chapters: { id: string; name: string }[];
  initial: CatalogueFilterValues;
}) {
  const t = useTranslations('catalogue');
  const router = useRouter();
  const [v, setV] = useState<CatalogueFilterValues>(initial);

  function apply(next: CatalogueFilterValues) {
    const params = new URLSearchParams();
    for (const [k, val] of Object.entries(next)) if (val) params.set(k, val);
    router.push(params.toString() ? `/student/tests?${params}` : '/student/tests');
  }
  function set<K extends keyof CatalogueFilterValues>(key: K, val: string) {
    const next = { ...v, [key]: val };
    setV(next);
    if (key !== 'q') apply(next);
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    apply(v);
  }

  const cls = `${selectClass} !mt-0 py-2 text-sm`;

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <select className={cls} value={v.subject} onChange={(e) => set('subject', e.target.value)} aria-label={t('filterSubject')}>
          <option value="">{t('anySubject')}</option>
          <option value="physics">{t('subjectPhysics')}</option>
          <option value="chemistry">{t('subjectChemistry')}</option>
          <option value="biology">{t('subjectBiology')}</option>
        </select>

        <select className={cls} value={v.chapter} onChange={(e) => set('chapter', e.target.value)} aria-label={t('filterChapter')}>
          <option value="">{t('anyChapter')}</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select className={cls} value={v.type} onChange={(e) => set('type', e.target.value)} aria-label={t('filterType')}>
          <option value="">{t('anyType')}</option>
          {TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t(`types.${ty}`)}
            </option>
          ))}
        </select>

        <select className={cls} value={v.difficulty} onChange={(e) => set('difficulty', e.target.value)} aria-label={t('filterDifficulty')}>
          <option value="">{t('anyDifficulty')}</option>
          <option value="EASY">{t('difficulty.EASY')}</option>
          <option value="MEDIUM">{t('difficulty.MEDIUM')}</option>
          <option value="HARD">{t('difficulty.HARD')}</option>
        </select>

        <select className={cls} value={v.year} onChange={(e) => set('year', e.target.value)} aria-label={t('filterYear')}>
          <option value="">{t('anyYear')}</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>

        <input
          className={`${inputClass} !mt-0 py-2 text-sm`}
          value={v.q}
          onChange={(e) => setV((prev) => ({ ...prev, q: e.target.value }))}
          placeholder={t('searchPlaceholder')}
          aria-label={t('search')}
        />
      </div>

      <div className="mt-3 flex justify-end gap-2 text-sm">
        <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100" onClick={() => { setV(EMPTY); apply(EMPTY); }}>
          {t('clear')}
        </button>
        <button type="submit" className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100">
          {t('search')}
        </button>
      </div>
    </form>
  );
}
