import { describe, expect, it } from 'vitest';
import {
  orderAttemptSubjectCodes,
  studentExamFromRules,
  studentExamFromSubjectCodes,
  studentExamHeadingKey,
  studentSubjectLabelKey,
} from '@/lib/attempts/presentation';

describe('student exam presentation', () => {
  it('uses JEE-specific headings and canonical JEE subject labels', () => {
    expect(studentExamFromRules({ exam: 'JEE' })).toBe('JEE');
    expect(studentExamFromSubjectCodes(['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS'])).toBe('JEE');
    expect(studentExamHeadingKey('JEE')).toBe('titles.JEE');
    expect(studentExamHeadingKey('JEE', true)).toBe('resultTitles.JEE');
    expect(studentSubjectLabelKey('JEE_MATHEMATICS')).toBe('subjects.JEE_MATHEMATICS');
  });

  it('limits result analysis to subjects actually present in the attempt', () => {
    expect(orderAttemptSubjectCodes('JEE', ['JEE_MATHEMATICS', 'JEE_PHYSICS', 'JEE_CHEMISTRY'])).toEqual([
      'JEE_PHYSICS',
      'JEE_CHEMISTRY',
      'JEE_MATHEMATICS',
    ]);
    expect(orderAttemptSubjectCodes('NEET', ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'])).toEqual([
      'PHYSICS',
      'CHEMISTRY',
      'BOTANY',
      'ZOOLOGY',
    ]);
  });
});
