'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { inputClass, selectClass } from '@/components/ui/Form';
import { btnSecondary } from '@/components/admin/ui';
import { SearchIcon, DownloadIcon } from '@/components/admin/icons';

export type PaymentFilterValues = { status: string; from: string; to: string; q: string };

const EMPTY: PaymentFilterValues = { status: '', from: '', to: '', q: '' };

export default function PaymentFilters({ initial }: { initial: PaymentFilterValues }) {
  const router = useRouter();
  const [v, setV] = useState<PaymentFilterValues>(initial);

  function toQuery(next: PaymentFilterValues) {
    const params = new URLSearchParams();
    for (const [k, val] of Object.entries(next)) if (val) params.set(k, val);
    return params.toString();
  }
  function apply(next: PaymentFilterValues) {
    const qs = toQuery(next);
    router.push(qs ? `/admin/payments?${qs}` : '/admin/payments');
  }
  function set<K extends keyof PaymentFilterValues>(key: K, val: string) {
    const next = { ...v, [key]: val };
    setV(next);
    if (key !== 'q') apply(next);
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    apply(v);
  }

  const cls = `${selectClass} !mt-0 py-2 text-sm`;
  const exportHref = `/api/admin/payments/export${toQuery(v) ? `?${toQuery(v)}` : ''}`;

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select className={cls} value={v.status} onChange={(e) => set('status', e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          <option value="CREATED">Pending</option>
          <option value="SUCCESS">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          From
          <input type="date" className={`${inputClass} !mt-0 py-1.5 text-sm`} value={v.from} onChange={(e) => set('from', e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          To
          <input type="date" className={`${inputClass} !mt-0 py-1.5 text-sm`} value={v.to} onChange={(e) => set('to', e.target.value)} />
        </label>
        <div className="relative lg:col-span-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} !mt-0 py-2 pl-8 text-sm`}
            value={v.q}
            onChange={(e) => setV((prev) => ({ ...prev, q: e.target.value }))}
            placeholder="Student / invoice…"
            aria-label="Search"
          />
        </div>
        <button type="submit" className={btnSecondary}>
          Search
        </button>
      </div>

      <div className="mt-3 flex justify-end gap-2">
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
