/** Read a localized value from a `{ en, ta }` Json column (falls back to ''). */
export function localizedName(name: unknown, lang: 'en' | 'ta' = 'en'): string {
  if (name && typeof name === 'object') {
    const value = (name as Record<string, unknown>)[lang];
    if (typeof value === 'string') return value;
  }
  return '';
}
