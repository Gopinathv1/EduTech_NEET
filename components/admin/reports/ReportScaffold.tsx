import Link from 'next/link';
import type { ReactNode } from 'react';
import { AdminPageHeader } from '@/components/admin/ui';
import DateRangeBar from './DateRangeBar';

/** Common chrome for a report page: back link, header, date-range filter + CSV
 *  export, then the report body (chart + table). */
export default function ReportScaffold({
  title,
  description,
  basePath,
  exportPath,
  initial,
  extra,
  filterSlot,
  children,
}: {
  title: string;
  description?: string;
  basePath: string;
  exportPath: string;
  initial: { from: string; to: string };
  extra?: Record<string, string>;
  filterSlot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <Link href="/admin/reports" className="text-sm font-medium text-brand hover:text-red-200">
        ← All reports
      </Link>
      <div className="mt-2">
        <AdminPageHeader title={title} description={description} />
      </div>
      <DateRangeBar basePath={basePath} exportPath={exportPath} initial={initial} extra={extra}>
        {filterSlot}
      </DateRangeBar>
      {children}
    </div>
  );
}

/** A plain report table. */
export function ReportTable({
  columns,
  rows,
  empty = 'No data for this range.',
}: {
  columns: { label: string; align?: 'right'; className?: string }[];
  rows: ReactNode[][];
  empty?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surfaceElevated shadow-sm">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-textSecondary">
            {columns.map((c, i) => (
              <th key={i} className={`px-4 py-3 font-medium ${c.align === 'right' ? 'text-right' : ''} ${c.className ?? ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-textSecondary">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr key={ri} className="border-b border-border last:border-0">
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-4 py-3 ${columns[ci]?.align === 'right' ? 'text-right tabular-nums' : ''}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-border bg-surfaceElevated p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-textPrimary">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
