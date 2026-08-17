'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { inputClass, selectClass } from '@/components/ui/Form';
import { btnSecondary } from '@/components/admin/ui';
import { SearchIcon, DownloadIcon } from '@/components/admin/icons';
import { BUDGET_RANGES, LEAD_STATUSES, BUDGET_LABEL_EN } from '@/lib/admission/config';

export type LeadFilterValues = {
  status: string;
  countryId: string;
  budget: string;
  scoreMin: string;
  scoreMax: string;
  from: string;
  to: string;
  q: string;
};

const EMPTY: LeadFilterValues = {
  status: '',
  countryId: '',
  budget: '',
  scoreMin: '',
  scoreMax: '',
  from: '',
  to: '',
  q: '',
};

const STATUS_LABEL: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  IN_PROGRESS: 'In progress',
  CONVERTED: 'Converted',
  CLOSED: 'Closed',
};
export default function LeadFilters({
  initial,
  countries,
}: {
  initial: LeadFilterValues;
  countries: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [v, setV] = useState<LeadFilterValues>(initial);

  function toQuery(next: LeadFilterValues) {
    const params = new URLSearchParams();
    for (const [k, val] of Object.entries(next)) if (val) params.set(k, val);
    return params.toString();
  }
  function apply(next: LeadFilterValues) {
    const qs = toQuery(next);
    router.push(qs ? `/admin/leads?${qs}` : '/admin/leads');
  }
  function set<K extends keyof LeadFilterValues>(key: K, val: string) {
    const next = { ...v, [key]: val };
    setV(next);
    if (key !== 'q' && key !== 'scoreMin' && key !== 'scoreMax') apply(next);
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    apply(v);
  }

  const cls = `${selectClass} !mt-0 py-2 text-sm`;
  const num = `${inputClass} !mt-0 py-1.5 text-sm`;
  const exportHref = `/api/admin/leads/export${toQuery(v) ? `?${toQuery(v)}` : ''}`;

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-xl border border-border bg-surfaceElevated p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select className={cls} value={v.status} onChange={(e) => set('status', e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select className={cls} value={v.countryId} onChange={(e) => set('countryId', e.target.value)} aria-label="Country">
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className={cls} value={v.budget} onChange={(e) => set('budget', e.target.value)} aria-label="Budget">
          <option value="">All budgets</option>
          {BUDGET_RANGES.map((b) => (
            <option key={b} value={b}>
              {BUDGET_LABEL_EN[b]}
            </option>
          ))}
        </select>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} !mt-0 py-2 pl-8 text-sm`}
            value={v.q}
            onChange={(e) => setV((prev) => ({ ...prev, q: e.target.value }))}
            placeholder="Student / mobile…"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex items-center gap-2 text-xs text-textSecondary">
          Score ≥
          <input type="number" min={0} max={720} className={num} value={v.scoreMin} onChange={(e) => setV((p) => ({ ...p, scoreMin: e.target.value }))} />
        </label>
        <label className="flex items-center gap-2 text-xs text-textSecondary">
          Score ≤
          <input type="number" min={0} max={720} className={num} value={v.scoreMax} onChange={(e) => setV((p) => ({ ...p, scoreMax: e.target.value }))} />
        </label>
        <label className="flex items-center gap-2 text-xs text-textSecondary">
          From
          <input type="date" className={num} value={v.from} onChange={(e) => set('from', e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-xs text-textSecondary">
          To
          <input type="date" className={num} value={v.to} onChange={(e) => set('to', e.target.value)} />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button type="submit" className={btnSecondary}>
          Apply
        </button>
        <button type="button" className={btnSecondary} onClick={() => { setV(EMPTY); apply(EMPTY); }}>
          Clear
        </button>
        <a href={exportHref} className={btnSecondary}>
          <DownloadIcon className="h-4 w-4" />
          Export CSV
        </a>
      </div>
    </form>
  );
}
