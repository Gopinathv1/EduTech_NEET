export const PRACTICE_CATEGORIES = ['FULL_MOCK', 'QUARTER', 'WEEKLY', 'SUBJECT', 'CHAPTER', 'MIXED', 'PREVIOUS_YEAR'] as const;
export type PracticeCategory = (typeof PRACTICE_CATEGORIES)[number];

/** Presentation taxonomy only: every category continues to use the existing Test and attempt engine. */
export function practiceCategory(test: { testType: string; rules: unknown }): PracticeCategory {
  const rules = test.rules && typeof test.rules === 'object' ? test.rules as { practiceType?: unknown } : {};
  if (rules.practiceType === 'QUARTER') return 'QUARTER';
  if (rules.practiceType === 'WEEKLY') return 'WEEKLY';
  if (test.testType === 'FULL_TEST') return 'FULL_MOCK';
  if (test.testType === 'SUBJECT_TEST') return 'SUBJECT';
  if (test.testType === 'CHAPTER_TEST') return 'CHAPTER';
  if (test.testType === 'YEAR_PATTERN') return 'PREVIOUS_YEAR';
  return 'MIXED';
}
