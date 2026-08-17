'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { setUserLocale } from '@/lib/locale';

/**
 * UI language switcher. Setting the locale writes a cookie via a server
 * action; the surrounding transition re-renders the tree with the new
 * language. Adding a new language needs no change here — it renders whatever
 * is listed in i18n/config.
 */
export default function LanguageSwitcher({ variant = 'segmented' }: { variant?: 'segmented' | 'select' }) {
  const activeLocale = useLocale();
  const t = useTranslations('nav');
  const [isPending, startTransition] = useTransition();

  function onSelect(next: Locale) {
    if (next === activeLocale) return;
    startTransition(() => {
      setUserLocale(next);
    });
  }

  if (variant === 'select') {
    return (
      <label className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-textPrimary">
        <span className="sr-only">{t('language')}</span>
        <select
          value={activeLocale}
          disabled={isPending}
          onChange={(event) => onSelect(event.target.value as Locale)}
          className="max-w-[8.5rem] bg-transparent text-sm font-medium text-textPrimary outline-none disabled:opacity-60"
          aria-label={t('language')}
        >
          {locales.map((code) => (
            <option key={code} value={code} className="bg-surface text-textPrimary">
              {localeNames[code]}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div
      className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-border bg-surface p-1"
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
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 sm:px-3 sm:text-sm ${
              isActive
                ? 'bg-brand text-white'
                : 'text-textSecondary hover:bg-surfaceElevated hover:text-white'
            }`}
          >
            {localeNames[code]}
          </button>
        );
      })}
    </div>
  );
}
