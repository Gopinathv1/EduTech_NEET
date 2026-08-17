'use server';

import { cookies } from 'next/headers';

/**
 * Accessibility preferences (large-font + high-contrast modes).
 *
 * These follow the same cookie-based pattern as the locale (`lib/locale.ts`):
 * the root layout reads them on every request and stamps them as data-
 * attributes on <html>, so the correct font size / contrast theme is present in
 * the server-rendered HTML (no flash of the default theme). The toggles in the
 * header/settings page write the cookie via a server action and refresh, which
 * re-renders the root layout with the new attributes — identical to how the
 * language switcher works.
 *
 * Cookies (not DB columns) are used deliberately: they take effect before login
 * (public site, auth screens), need no schema migration, and persist for a year
 * per device — which is what a rural student on a shared/low-end device needs.
 */

const FONT_SCALE_COOKIE = 'a11y-font-scale';
const CONTRAST_COOKIE = 'a11y-contrast';

const YEAR = 60 * 60 * 24 * 365;

export type FontScale = 'normal' | 'large';
export type Contrast = 'normal' | 'high';

export interface A11yPrefs {
  fontScale: FontScale;
  contrast: Contrast;
}

/** Read both accessibility preferences from cookies (defaults when unset). */
export async function getA11yPrefs(): Promise<A11yPrefs> {
  const store = await cookies();
  const fontScale = store.get(FONT_SCALE_COOKIE)?.value === 'large' ? 'large' : 'normal';
  const contrast = store.get(CONTRAST_COOKIE)?.value === 'high' ? 'high' : 'normal';
  return { fontScale, contrast };
}

/** Persist the large-font preference. Called from the accessibility toggle. */
export async function setFontScale(value: FontScale): Promise<void> {
  const store = await cookies();
  store.set(FONT_SCALE_COOKIE, value, { path: '/', maxAge: YEAR, sameSite: 'lax' });
}

/** Persist the high-contrast preference. Called from the accessibility toggle. */
export async function setContrast(value: Contrast): Promise<void> {
  const store = await cookies();
  store.set(CONTRAST_COOKIE, value, { path: '/', maxAge: YEAR, sameSite: 'lax' });
}
