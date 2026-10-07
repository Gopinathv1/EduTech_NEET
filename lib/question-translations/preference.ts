import type { ExamLanguage } from '@/lib/attempts/examState';
export const questionPreferenceKey = (attemptId: string) => `sivora-question-content:v1:${attemptId}`;
export function parseQuestionPreference(value: string | null, count: number): { lang: ExamLanguage; index: number } | null {
  try {
    const parsed = JSON.parse(value ?? 'null');
    if (!parsed || !['en', 'ta', 'hi'].includes(parsed.lang) || !Number.isInteger(parsed.index) || parsed.index < 0 || parsed.index >= count) return null;
    return { lang: parsed.lang, index: parsed.index };
  } catch { return null; }
}
