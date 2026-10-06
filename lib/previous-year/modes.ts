import type { PreviousYearExam } from './source-inventory';

export type PreviousYearMode = 'HISTORICAL_SHIFT' | 'YEAR_WISE' | 'MIXED_FIVE_YEARS' | 'SUBJECT_CHAPTER';

export type PreviousYearTestDescriptor = {
  testType: string;
  rules: unknown;
};

export function previousYearMode(test: PreviousYearTestDescriptor): PreviousYearMode | null {
  const rules = test.rules && typeof test.rules === 'object'
    ? test.rules as { previousYearMode?: unknown; sourceType?: unknown }
    : {};
  if (rules.previousYearMode === 'HISTORICAL_SHIFT' && previousYearExam(test.rules) === 'JEE' && rules.sourceType === 'HISTORICAL_VERIFIED') return 'HISTORICAL_SHIFT';
  if (test.testType === 'YEAR_PATTERN' && (rules.sourceType === undefined || rules.sourceType === 'OFFICIAL_NTA' || rules.sourceType === 'HISTORICAL_VERIFIED')) return 'YEAR_WISE';
  if (rules.previousYearMode === 'MIXED_FIVE_YEARS') return 'MIXED_FIVE_YEARS';
  if (rules.previousYearMode === 'SUBJECT_CHAPTER') return 'SUBJECT_CHAPTER';
  return null;
}

export function previousYearExam(rules: unknown): PreviousYearExam | null {
  if (!rules || typeof rules !== 'object') return null;
  const exam = (rules as { exam?: unknown }).exam;
  return exam === 'NEET' || exam === 'JEE' ? exam : null;
}
