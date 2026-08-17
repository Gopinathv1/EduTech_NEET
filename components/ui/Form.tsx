import type { ReactNode } from 'react';

/**
 * Small presentational form primitives shared across the auth screens.
 * Mobile-first: full-width controls, large tap targets, clear error text.
 */

export const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:bg-slate-50';

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
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600" role="alert">
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
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-green-200 bg-green-50 text-green-700';
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
