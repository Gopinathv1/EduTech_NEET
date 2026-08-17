import { getTranslations } from 'next-intl/server';

/**
 * Skip-to-content link — the first focusable element on every page. It is
 * visually hidden until it receives keyboard focus, then appears at the top-left
 * so keyboard and screen-reader users can jump past the header/nav straight to
 * the page's <main id="main-content">. Bilingual via the `a11y` namespace.
 */
export default async function SkipLink() {
  const t = await getTranslations('a11y');
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand"
    >
      {t('skipToContent')}
    </a>
  );
}
