'use server';

import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from '@/i18n/config';

// Standard cookie name understood by next-intl tooling.
const COOKIE_NAME = 'NEXT_LOCALE';

/** Read the visitor's chosen locale from the cookie (falls back to default). */
export async function getUserLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (value && locales.includes(value as Locale)) {
    return value as Locale;
  }
  return defaultLocale;
}

/** Persist the visitor's locale choice. Called by the language switcher. */
export async function setUserLocale(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
}

/**
 * Restore a returning/registering student's saved UI language as the active
 * locale. `Student.preferredLanguage` is a plain string, so it is validated
 * against the supported `locales` before being written (unknown/disabled
 * languages are ignored, leaving the current cookie untouched). Called from the
 * login and OTP-verify routes so a student's chosen language follows them onto
 * any device without a manual switch.
 */
export async function syncLocaleFromProfile(preferred: string | null | undefined): Promise<void> {
  if (preferred && locales.includes(preferred as Locale)) {
    await setUserLocale(preferred as Locale);
  }
}
