'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { setUserLocale } from '@/lib/locale';

/**
 * English/Tamil switcher. Setting the locale writes a cookie via a server
 * action; the surrounding transition re-renders the tree with the new
 * language. Adding a new language needs no change here — it renders whatever
 * is listed in i18n/config.
 */
export default function LanguageSwitcher() {
  const activeLocale = useLocale();
  const t = useTranslations('nav');
  const [isPending, startTransition] = useTransition();

  function onSelect(next: Locale) {
    if (next === activeLocale) return;
    startTransition(() => {
      setUserLocale(next);
    });
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 p-1"
      role="group"
      aria-label={t('language')}
    >
      {locales.map((code) => {
        const isActive = code === activeLocale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            disabled={isPending}
            aria-pressed={isActive}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-60 ${
              isActive
                ? 'bg-brand text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {localeNames[code]}
          </button>
        );
      })}
    </div>
  );
}
