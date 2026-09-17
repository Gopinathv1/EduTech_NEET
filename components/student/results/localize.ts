import type { LocalizedText } from '@/lib/recommendations/types';
import type { ExamLanguage } from '@/lib/attempts/examState';

/** Pick the localized string from a {en, ta} value, falling back to English. */
export function L(text: LocalizedText | undefined, locale: ExamLanguage): string {
  if (!text) return '';
  return text[locale] || text.en;
}
