'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { inputClass, selectClass } from '@/components/ui/Form';
import { btnSecondary } from '@/components/admin/ui';

export type AccessLogFilterValues = { adminId: string; action: string; from: string; to: string };

const EMPTY: AccessLogFilterValues = { adminId: '', action: '', from: '', to: '' };

export default function AccessLogFilters({
  initial,
  admins,
}: {
  initial: AccessLogFilterValues;
  admins: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);

  function toQuery(next: AccessLogFilterValues) {
    const params = new URLSearchParams();
    for (const [k, val] of Object.entries(next)) if (val) params.set(k, val);
    return params.toString();
  }
  function apply(next: AccessLogFilterValues) {
    const qs = toQuery(next);
    router.push(qs ? `/admin/access-logs?${qs}` : '/admin/access-logs');
  }
  function set<K extends keyof AccessLogFilterValues>(key: K, val: string) {
    const next = { ...v, [key]: val };
    setV(next);
    if (key !== 'action') apply(next);
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    apply(v);
  }

  const cls = `${selectClass} !mt-0 py-2 text-sm`;
  const dateCls = `${inputClass} !mt-0 py-1.5 text-sm`;

  return (
    <form onSubmit={onSubmit} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surfaceElevated p-4">
      <select className={cls} value={v.adminId} onChange={(e) => set('adminId', e.target.value)} aria-label="Admin">
        <option value="">All admins</option>
        {admins.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <input
        className={`${inputClass} !mt-0 py-2 text-sm`}
        value={v.action}
        onChange={(e) => setV((p) => ({ ...p, action: e.target.value }))}
        placeholder="Action contains… (e.g. login)"
        aria-label="Action"
      />
      <label className="text-xs text-textSecondary">
        From
        <input type="date" className={dateCls} value={v.from} onChange={(e) => set('from', e.target.value)} />
      </label>
      <label className="text-xs text-textSecondary">
        To
        <input type="date" className={dateCls} value={v.to} onChange={(e) => set('to', e.target.value)} />
      </label>
      <button type="submit" className={btnSecondary}>
        Search
      </button>
      <button type="button" className={btnSecondary} onClick={() => { setV(EMPTY); apply(EMPTY); }}>
        Clear
      </button>
    </form>
  );
}
