/**
 * Structural (non-text) data for the admission countries. All display copy —
 * name, tagline, "why study" bullets, cost range, eligibility note — lives in
 * the locale files under `countries.items.<code>`. This keeps the marketing
 * text fully bilingual while the code list / flag / accent stay in one place.
 */
export const COUNTRY_CODES = ['ru', 'ge', 'kz', 'kg', 'uz', 'ph'] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

// Unicode flag emoji (render as text — zero image requests).
export const COUNTRY_FLAG: Record<CountryCode, string> = {
  ru: '🇷🇺',
  ge: '🇬🇪',
  kz: '🇰🇿',
  kg: '🇰🇬',
  uz: '🇺🇿',
  ph: '🇵🇭',
};
