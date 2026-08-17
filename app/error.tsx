'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

/**
 * Localized runtime-error boundary. Must be a client component (App Router
 * contract) and receives `reset` to retry the failed render. It sits inside the
 * root layout, so next-intl is available. For a catastrophic root-layout crash
 * see `global-error.tsx`.
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors.generic');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <span className="text-5xl" aria-hidden="true">
        ⚠️
      </span>
      <h1 className="mt-4 text-2xl font-bold text-textPrimary">{t('title')}</h1>
      <p className="mt-2 max-w-md text-sm text-textSecondary">{t('message')}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {t('retry')}
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-textSecondary hover:bg-surfaceElevated"
        >
          {t('home')}
        </Link>
      </div>
    </div>
  );
}
