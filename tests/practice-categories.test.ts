import { describe, expect, it } from 'vitest';
import { practiceCategory } from '@/lib/student/practice-categories';
import { computeCoverage } from '@/lib/student/catalogue';

describe('student practice categories', () => {
  it.each([
    ['FULL_TEST', {}, 'FULL_MOCK'], ['MINI_TEST', { practiceType: 'QUARTER' }, 'QUARTER'],
    ['MINI_TEST', { practiceType: 'WEEKLY' }, 'WEEKLY'], ['SUBJECT_TEST', {}, 'SUBJECT'],
    ['CHAPTER_TEST', {}, 'CHAPTER'], ['MINI_TEST', {}, 'MIXED'], ['YEAR_PATTERN', {}, 'PREVIOUS_YEAR'],
  ])('maps %s with rules %j to %s', (testType, rules, expected) => {
    expect(practiceCategory({ testType, rules })).toBe(expected);
  });
});

it('keeps NEET and JEE full-test catalogue coverage separate', () => {
  const subjects = new Map([
    ['p', { id: 'p', code: 'PHYSICS' }], ['jp', { id: 'jp', code: 'JEE_PHYSICS' }],
    ['jm', { id: 'jm', code: 'JEE_MATHEMATICS' }],
  ]);
  const base = { testType: 'FULL_TEST', isRandom: false, subjectId: null, chapterId: null, testQuestions: [] };
  expect(computeCoverage({ ...base, rules: { exam: 'NEET' } }, subjects, new Map(), ['PHYSICS', 'JEE_PHYSICS', 'JEE_MATHEMATICS']).subjectCodes).toEqual(new Set(['PHYSICS']));
  expect(computeCoverage({ ...base, rules: { exam: 'JEE' } }, subjects, new Map(), ['PHYSICS', 'JEE_PHYSICS', 'JEE_MATHEMATICS']).subjectCodes).toEqual(new Set(['JEE_PHYSICS', 'JEE_MATHEMATICS']));
});
