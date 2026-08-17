'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { inputClass } from '@/components/ui/Form';
import { btnSecondary } from '@/components/admin/ui';
import { DownloadIcon } from '@/components/admin/icons';

/**
 * Shared date-range filter + CSV export for report pages. `extra` carries any
 * report-specific params (e.g. a test id) so they survive Apply and the export.
 */
export default function DateRangeBar({
  basePath,
  exportPath,
  initial,
  extra = {},
  children,
}: {
  basePath: string;
  exportPath: string;
  initial: { from: string; to: string };
  extra?: Record<string, string>;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  function query(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams();
    const merged = { from, to, ...extra, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    return params.toString();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query();
    router.push(q ? `${basePath}?${q}` : basePath);
  }

  const cls = `${inputClass} !mt-0 py-1.5 text-sm`;

  return (
    <form onSubmit={onSubmit} className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <label className="text-xs font-medium text-slate-500">
        From
        <input type="date" className={cls} value={from} onChange={(e) => setFrom(e.target.value)} />
      </label>
      <label className="text-xs font-medium text-slate-500">
        To
        <input type="date" className={cls} value={to} onChange={(e) => setTo(e.target.value)} />
      </label>
      {children}
      <button type="submit" className={btnSecondary}>
        Apply
      </button>
      <a href={`${exportPath}?${query()}`} className={btnSecondary}>
        <DownloadIcon className="h-4 w-4" />
        Export CSV
      </a>
    </form>
  );
}
