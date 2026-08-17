import Link from 'next/link';

/**
 * Simple Prev/Next pager for admin lists. `baseQuery` is the current query string
 * (without `page`); the pager appends `page=N`.
 */
export default function Pager({
  basePath,
  baseQuery,
  page,
  totalPages,
  total,
}: {
  basePath: string;
  baseQuery: string;
  page: number;
  totalPages: number;
  total: number;
}) {
  if (totalPages <= 1) {
    return <p className="mt-3 text-xs text-slate-400">{total} result{total === 1 ? '' : 's'}</p>;
  }
  const href = (p: number) => {
    const params = new URLSearchParams(baseQuery);
    params.set('page', String(p));
    return `${basePath}?${params.toString()}`;
  };
  const cls = 'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100';
  const disabled = 'pointer-events-none rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-300';

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        Page {page} of {totalPages} · {total} result{total === 1 ? '' : 's'}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={cls}>
            ← Prev
          </Link>
        ) : (
          <span className={disabled}>← Prev</span>
        )}
        {page < totalPages ? (
          <Link href={href(page + 1)} className={cls}>
            Next →
          </Link>
        ) : (
          <span className={disabled}>Next →</span>
        )}
      </div>
    </div>
  );
}
