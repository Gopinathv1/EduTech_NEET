'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { inputClass, selectClass } from '@/components/ui/Form';
import { btnSecondary } from '@/components/admin/ui';
import { SearchIcon, DownloadIcon } from '@/components/admin/icons';
import { TN_DISTRICTS, BOARD_OPTIONS, CLASS_OPTIONS } from '@/lib/data/locations';

export type StudentFilterValues = { q: string; district: string; board: string; class: string; from: string; to: string };

const EMPTY: StudentFilterValues = { q: '', district: '', board: '', class: '', from: '', to: '' };

export default function StudentFilters({ initial }: { initial: StudentFilterValues }) {
  const router = useRouter();
  const [v, setV] = useState<StudentFilterValues>(initial);

  function toQuery(next: StudentFilterValues) {
    const params = new URLSearchParams();
    for (const [k, val] of Object.entries(next)) if (val) params.set(k, val);
    return params.toString();
  }
  function apply(next: StudentFilterValues) {
    const qs = toQuery(next);
    router.push(qs ? `/admin/students?${qs}` : '/admin/students');
  }
  function set<K extends keyof StudentFilterValues>(key: K, val: string) {
    const next = { ...v, [key]: val };
    setV(next);
    if (key !== 'q') apply(next);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    apply(v);
  }

  const cls = `${selectClass} !mt-0 py-2 text-sm`;
  const dateCls = `${inputClass} !mt-0 py-1.5 text-sm`;
  const exportHref = `/api/admin/students/export${toQuery(v) ? `?${toQuery(v)}` : ''}`;

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-xl border border-border bg-surfaceElevated p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} !mt-0 py-2 pl-8 text-sm`}
            value={v.q}
            onChange={(e) => setV((p) => ({ ...p, q: e.target.value }))}
            placeholder="Name / mobile / school…"
            aria-label="Search"
          />
        </div>
        <select className={cls} value={v.district} onChange={(e) => set('district', e.target.value)} aria-label="District">
          <option value="">All districts</option>
          {TN_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select className={cls} value={v.board} onChange={(e) => set('board', e.target.value)} aria-label="Board">
          <option value="">All boards</option>
          {BOARD_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select className={cls} value={v.class} onChange={(e) => set('class', e.target.value)} aria-label="Class">
          <option value="">All classes</option>
          {CLASS_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs text-textSecondary">
          From
          <input type="date" className={dateCls} value={v.from} onChange={(e) => set('from', e.target.value)} />
        </label>
        <label className="text-xs text-textSecondary">
          To
          <input type="date" className={dateCls} value={v.to} onChange={(e) => set('to', e.target.value)} />
        </label>
        <div className="ml-auto flex gap-2">
          <button type="submit" className={btnSecondary}>
            Search
          </button>
          <button type="button" className={btnSecondary} onClick={() => { setV(EMPTY); apply(EMPTY); }}>
            Clear
          </button>
          <a href={exportHref} className={btnSecondary}>
            <DownloadIcon className="h-4 w-4" />
            Export Student Data
          </a>
        </div>
      </div>
    </form>
  );
}
