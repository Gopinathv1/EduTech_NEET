/**
 * Central i18n configuration.
 *
 * ---------------------------------------------------------------------------
 * Adding a new language (e.g. Hindi, Telugu, Kannada, Malayalam) requires ONLY:
 *   1. Add its code to `ALL_LOCALES` below + a display name in `localeNames`.
 *   2. Create `messages/<code>.json` (copy `en.json` and translate the values).
 *   3. Add reviewed question translations (QuestionTranslation rows) as needed.
 *   4. Flip its flag in `localeEnabled` to `true` to switch it on.
 * No other code changes are required — the switcher, request config, cookie
 * handling, and validation all read from these lists.
 *
 * A language can be *scaffolded but hidden*: list it in `ALL_LOCALES` with a
 * `messages/<code>.json` file but leave `localeEnabled[code] = false`. It then
 * never appears in the switcher and its cookie value is ignored, so the file
 * can be translated over time and switched on with a single flag. `hi` (Hindi)
 * ships this way today as a ready scaffold.
 * ---------------------------------------------------------------------------
 */

// Every locale the codebase knows about (enabled or scaffolded/disabled).
export const ALL_LOCALES = ['en', 'ta', 'hi'] as const;

export type Locale = (typeof ALL_LOCALES)[number];

export const defaultLocale: Locale = 'en';

// Which locales are live. Flip a flag to true to enable a scaffolded language.
export const localeEnabled: Record<Locale, boolean> = {
  en: true,
  ta: true,
  hi: false, // scaffolded — messages/hi.json exists, awaiting Hindi translation
};

// Human-readable names shown in the language switcher (each in its own script).
export const localeNames: Record<Locale, string> = {
  en: 'English',
  ta: 'தமிழ்',
  hi: 'हिन्दी',
};

/**
 * The active (enabled) locales — this is what the UI, cookie validation, and
 * next-intl request config use. Scaffolded/disabled locales are excluded, so
 * they never load or appear to users until their flag is turned on.
 */
export const locales: Locale[] = ALL_LOCALES.filter((code) => localeEnabled[code]);
