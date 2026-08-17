'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { inputClass, selectClass } from '@/components/ui/Form';
import { btnSecondary } from '@/components/admin/ui';
import { SearchIcon } from '@/components/admin/icons';

export type SubjectOption = { id: string; name: string; chapters: { id: string; name: string }[] };
export type FilterValues = {
  subject: string;
  chapter: string;
  difficulty: string;
  type: string;
  year: string;
  lang: string;
  active: string;
  q: string;
};

const EMPTY: FilterValues = {
  subject: '',
  chapter: '',
  difficulty: '',
  type: '',
  year: '',
  lang: '',
  active: '',
  q: '',
};

export default function QuestionFilters({
  subjects,
  years,
  initial,
}: {
  subjects: SubjectOption[];
  years: number[];
  initial: FilterValues;
}) {
  const router = useRouter();
  const [v, setV] = useState<FilterValues>(initial);
  const chapters = subjects.find((s) => s.id === v.subject)?.chapters ?? [];

  function apply(next: FilterValues) {
    const params = new URLSearchParams();
    for (const [k, val] of Object.entries(next)) if (val) params.set(k, val);
    router.push(params.toString() ? `/admin/question-bank?${params}` : '/admin/question-bank');
  }

  function set<K extends keyof FilterValues>(key: K, val: string) {
    const next = { ...v, [key]: val };
    if (key === 'subject') next.chapter = ''; // dependent reset
    setV(next);
    if (key !== 'q') apply(next); // selects apply immediately; text search on submit
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    apply(v);
  }

  const cls = `${selectClass} !mt-0 py-2 text-sm`;

  return (
    <form onSubmit={onSubmit} className="mb-4 rounded-xl border border-border bg-surfaceElevated p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <select className={cls} value={v.subject} onChange={(e) => set('subject', e.target.value)} aria-label="Subject">
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className={cls}
          value={v.chapter}
          onChange={(e) => set('chapter', e.target.value)}
          disabled={!v.subject}
          aria-label="Chapter"
        >
          <option value="">All chapters</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select className={cls} value={v.difficulty} onChange={(e) => set('difficulty', e.target.value)} aria-label="Difficulty">
          <option value="">Any difficulty</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <select className={cls} value={v.type} onChange={(e) => set('type', e.target.value)} aria-label="Question type">
          <option value="">Any type</option>
          <option value="SINGLE_CORRECT">Single correct</option>
          <option value="IMAGE_BASED">Image based</option>
          <option value="ASSERTION_REASON">Assertion-reason</option>
        </select>

        <select className={cls} value={v.year} onChange={(e) => set('year', e.target.value)} aria-label="Year">
          <option value="">Any year</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>

        <select className={cls} value={v.lang} onChange={(e) => set('lang', e.target.value)} aria-label="Translation availability">
          <option value="">Any language</option>
          <option value="en">EN only</option>
          <option value="enta">EN + TA</option>
        </select>

        <select className={cls} value={v.active} onChange={(e) => set('active', e.target.value)} aria-label="Active status">
          <option value="">Any status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <div className="col-span-2 flex gap-2 sm:col-span-1 lg:col-span-1">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputClass} !mt-0 py-2 pl-8 text-sm`}
              value={v.q}
              onChange={(e) => setV((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Search text…"
              aria-label="Search question text"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" className={btnSecondary} onClick={() => { setV(EMPTY); apply(EMPTY); }}>
          Clear
        </button>
        <button type="submit" className={btnSecondary}>
          Search
        </button>
      </div>
    </form>
  );
}
