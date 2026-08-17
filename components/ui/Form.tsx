import type { ReactNode } from 'react';

/**
 * Small presentational form primitives shared across the auth screens.
 * Mobile-first: full-width controls, large tap targets, clear error text.
 */

export const inputClass =
  'mt-1 w-full rounded-lg border border-border bg-surfaceElevated px-3 py-2.5 text-base text-textPrimary shadow-sm outline-none placeholder:text-textSecondary focus:border-brand focus:ring-2 focus:ring-brand/40 disabled:bg-surface disabled:text-textSecondary';

export const selectClass = `${inputClass} appearance-none`;

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-textPrimary">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-textSecondary">{hint}</p> : null}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** A page-level error/success banner. */
export function Banner({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  const styles =
    kind === 'error'
      ? 'border-red-500/40 bg-red-950/50 text-red-100'
      : 'border-green-500/40 bg-green-950/40 text-green-100';
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles}`} role="alert">
      {children}
    </div>
  );
}

/** Full-width primary submit button with a busy state. */
export function SubmitButton({
  children,
  busy,
  busyLabel,
}: {
  children: ReactNode;
  busy?: boolean;
  busyLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-lg bg-brand px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
    >
      {busy && busyLabel ? busyLabel : children}
    </button>
  );
}
