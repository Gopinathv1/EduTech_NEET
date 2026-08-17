import Link from 'next/link';
import type { ReactNode } from 'react';

/** Presentational primitives for the admin portal (English-only). */

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary">{title}</h1>
        {description ? <p className="mt-1 text-sm text-textSecondary">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surfaceElevated p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  slate: 'bg-surfaceElevated text-textSecondary',
  green: 'bg-green-950/40 text-green-200',
  amber: 'bg-amber-100 text-amber-100',
  blue: 'bg-brand-soft text-brand',
  red: 'bg-red-950/40 text-red-200',
};

export function Badge({ color = 'slate', children }: { color?: keyof typeof badgeColors | string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeColors[color] ?? badgeColors.slate}`}>
      {children}
    </span>
  );
}

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export const btnPrimary = `${btnBase} bg-brand text-white hover:bg-brand-dark`;
export const btnSecondary = `${btnBase} border border-border text-textSecondary hover:bg-surfaceElevated`;
export const btnDanger = `${btnBase} border border-red-500/50 text-red-200 hover:bg-red-950/30`;

export function PrimaryButtonLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={btnPrimary}>
      {children}
    </Link>
  );
}

export function SecondaryButtonLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={btnSecondary}>
      {children}
    </Link>
  );
}

/** Simple placeholder for not-yet-built admin sections. */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <AdminPageHeader title={title} />
      <AdminCard className="text-center">
        <p className="mx-auto max-w-md text-textSecondary">{description}</p>
        <span className="mt-4 inline-block rounded-full bg-surfaceElevated px-3 py-1 text-xs font-semibold uppercase tracking-wide text-textSecondary">
          Coming soon
        </span>
      </AdminCard>
    </div>
  );
}
