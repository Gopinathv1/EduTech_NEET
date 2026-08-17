import { getRequestConfig } from 'next-intl/server';
import { getUserLocale } from '@/lib/locale';

/**
 * next-intl request configuration (cookie-based, no URL locale prefix).
 * The active locale is resolved from a cookie on every request and the
 * matching message file is loaded dynamically.
 */
export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
