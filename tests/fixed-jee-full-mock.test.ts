import { describe, expect, it } from 'vitest';
import { isExactFixedJeeSelection, summarizeFixedJeeSelection } from '@/lib/admin/fixed-jee-full-mock';

describe('fixed JEE full mock selection', () => {
  it('requires 20 MCQ and 5 numerical questions in each of the three subjects', () => {
    const rows = ['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS'].flatMap((subjectCode) => [
      ...Array.from({ length: 20 }, (_, index) => ({ id: `${subjectCode}-m-${index}`, subjectCode, questionType: 'SINGLE_CORRECT', approved: true, activeEligible: true })),
      ...Array.from({ length: 5 }, (_, index) => ({ id: `${subjectCode}-n-${index}`, subjectCode, questionType: 'NUMERICAL_VALUE', approved: true, activeEligible: true })),
    ]);
    const summary = summarizeFixedJeeSelection(rows);
    expect(summary).toMatchObject({ total: 75, unique: 75, physics: 25, chemistry: 25, mathematics: 25, mcq: 60, numerical: 15 });
    expect(isExactFixedJeeSelection(summary)).toBe(true);
  });
});
