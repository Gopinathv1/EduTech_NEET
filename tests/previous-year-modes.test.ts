import { describe, expect, it } from 'vitest';
import { previousYearExam, previousYearMode } from '@/lib/previous-year/modes';

describe('previous-year test modes', () => {
  it('recognizes only the three supported modes', () => {
    expect(previousYearMode({ testType: 'YEAR_PATTERN', rules: { exam: 'NEET', sourceType: 'OFFICIAL_NTA' } })).toBe('YEAR_WISE');
    expect(previousYearMode({ testType: 'FULL_TEST', rules: { previousYearMode: 'MIXED_FIVE_YEARS' } })).toBe('MIXED_FIVE_YEARS');
    expect(previousYearMode({ testType: 'SUBJECT_TEST', rules: { previousYearMode: 'SUBJECT_CHAPTER' } })).toBe('SUBJECT_CHAPTER');
    expect(previousYearMode({ testType: 'MINI_TEST', rules: { previousYearMode: 'WEEKLY' } })).toBeNull();
  });

  it('keeps NEET and JEE identities isolated', () => {
    expect(previousYearExam({ exam: 'NEET' })).toBe('NEET');
    expect(previousYearExam({ exam: 'JEE' })).toBe('JEE');
    expect(previousYearExam({ exam: 'OTHER' })).toBeNull();
  });
});
