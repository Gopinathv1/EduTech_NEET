import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

/**
 * Localized 404 page. Rendered inside the root layout, so next-intl and the
 * accessibility/locale <html> attributes all apply. Replaces Next.js's built-in
 * English-only "404 | This page could not be found" screen.
 */
export default async function NotFound() {
  const t = await getTranslations('errors.notFound');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-6xl font-black text-brand" aria-hidden="true">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">{t('title')}</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">{t('message')}</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {t('home')}
      </Link>
    </div>
  );
}
