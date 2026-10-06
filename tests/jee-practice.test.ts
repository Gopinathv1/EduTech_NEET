import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { JeeHistoricalQuestion } from '@/lib/previous-year/jee-dataset';
import { buildJeePracticePlans, JEE_SUBJECTS, JEE_YEARS, selectJeeHistoricalPool } from '@/lib/previous-year/jee-practice';
import { previousYearMode } from '@/lib/previous-year/modes';

const questions = JEE_YEARS.flatMap(year => JSON.parse(readFileSync(
  path.join(process.cwd(), 'data', 'previous-year', 'jee', String(year), 'questions.json'), 'utf8',
)) as JeeHistoricalQuestion[]);
const plans = buildJeePracticePlans(questions);
const pool = questions.map(row => ({ id: row.externalId, subjectId: row.subjectCode, chapterId: row.chapterSlug,
  difficulty: row.difficulty, year: row.year, hasReviewedTa: false, questionType: row.questionType, subjectCode: row.subjectCode }));

describe('canonical JEE V1 practice plans', () => {
  it('separates historical shifts from year aggregates and preserves source order', () => {
    const shifts = plans.filter(plan => previousYearMode(plan) === 'HISTORICAL_SHIFT');
    const years = plans.filter(plan => previousYearMode(plan) === 'YEAR_WISE');
    expect(shifts).toHaveLength(5);
    expect(years).toHaveLength(5);
    for (const year of JEE_YEARS) {
      const shift = shifts.find(plan => (plan.rules.paperIdentity as { year: number }).year === year)!;
      const aggregate = years.find(plan => plan.rules.year === year)!;
      const expected = questions.filter(row => row.year === year).sort((a, b) => a.sourceOrder - b.sourceOrder).map(row => row.externalId);
      expect(shift.id).not.toBe(aggregate.id);
      expect(shift.isRandom).toBe(false);
      expect(aggregate.isRandom).toBe(false);
      expect(shift.externalIds).toEqual(expected);
      expect(aggregate.externalIds).toEqual(expected);
      expect(shift.rules.completeness).toBe('PARTIAL_VERIFIED_PRACTICE');
      expect(aggregate.rules.completeness).toBe('PARTIAL_VERIFIED_PRACTICE');
    }
  });

  it('creates only populated subject and chapter practices with exact canonical membership', () => {
    const subjects = plans.filter(plan => plan.testType === 'SUBJECT_TEST');
    const chapters = plans.filter(plan => plan.testType === 'CHAPTER_TEST');
    expect(subjects).toHaveLength(18);
    expect(chapters).toHaveLength(198);
    expect(plans).toHaveLength(227);
    expect(new Set(plans.map(plan => plan.id)).size).toBe(plans.length);
    for (const plan of [...subjects, ...chapters]) {
      const period = String(plan.rules.practiceSource);
      const expected = questions.filter(row => row.subjectCode === plan.subjectCode
        && (!plan.chapterSlug || row.chapterSlug === plan.chapterSlug)
        && (period === 'MIXED_2021_2025' || row.year === Number(period.replace('YEAR_', ''))));
      expect(plan.externalIds).toEqual(expected.map(row => row.externalId));
      expect(plan.totalQuestions).toBe(expected.length);
      expect(plan.totalQuestions).toBeGreaterThan(0);
      expect(plan.isRandom).toBe(true);
      expect((plan.rules.historical as { externalIds: string[] }).externalIds).toEqual(plan.externalIds);
    }
    for (const plan of plans) {
      expect(plan.rules.exam).toBe('JEE');
      expect(plan.rules.sourceType).toBe('HISTORICAL_VERIFIED');
      expect(plan.rules.payment).toBe('NONE');
      expect(plan.rules.retake).toBe('FREE_UNLIMITED');
    }
  });

  it('rejects empty, duplicate, missing-year and insufficient typed pools', () => {
    expect(() => buildJeePracticePlans([])).toThrow('Invalid JEE practice selection');
    expect(() => buildJeePracticePlans([...questions, questions[0]])).toThrow('Invalid JEE practice selection');
    expect(() => buildJeePracticePlans(questions.filter(row => row.year !== 2022))).toThrow('Empty JEE practice');
    expect(() => buildJeePracticePlans(questions.filter(row => row.subjectCode !== 'JEE_PHYSICS'
      || row.questionType !== 'SINGLE_CORRECT'))).toThrow('Insufficient mixed JEE pool');
  });

  it('keeps every retained numerical answer compatible with the existing integer-response route', () => {
    const numerical = questions.filter(row => row.questionType === 'NUMERICAL_VALUE');
    expect(numerical).toHaveLength(82);
    expect(numerical.every(row => Number.isInteger(row.numericAnswer))).toBe(true);
  });
});

describe('JEE historical typed selection', () => {
  it('produces 75 unique questions with 20 MCQs and 5 numerical values per subject across all years', () => {
    for (const seed of ['v1-a', 'v1-b']) {
      const result = selectJeeHistoricalPool(pool, true, seed);
      expect(result.questionIds).toHaveLength(75);
      expect(new Set(result.questionIds).size).toBe(75);
      const selected = result.questionIds.map(id => pool.find(row => row.id === id)!);
      for (const subject of JEE_SUBJECTS) {
        const rows = selected.filter(row => row.subjectCode === subject);
        expect(rows.filter(row => row.questionType === 'SINGLE_CORRECT')).toHaveLength(20);
        expect(rows.filter(row => row.questionType === 'NUMERICAL_VALUE')).toHaveLength(5);
        for (const year of JEE_YEARS) {
          expect(rows.filter(row => row.year === year && row.questionType === 'SINGLE_CORRECT')).toHaveLength(4);
          expect(rows.filter(row => row.year === year && row.questionType === 'NUMERICAL_VALUE')).toHaveLength(1);
        }
      }
      expect(selectJeeHistoricalPool(pool, true, seed)).toEqual(result);
    }
  });

  it('retains exact subject/chapter membership when shuffling a partial practice', () => {
    const subset = pool.filter(row => row.subjectCode === 'JEE_CHEMISTRY' && row.year === 2024);
    const result = selectJeeHistoricalPool(subset, false, 'partial');
    expect([...result.questionIds].sort()).toEqual(subset.map(row => row.id).sort());
    expect(result.questionIds).toHaveLength(subset.length);
  });

  it('rejects empty selections and cannot fill a missing typed quota with another type', () => {
    expect(() => selectJeeHistoricalPool([], false, 'empty')).toThrow('No validated questions');
    expect(() => selectJeeHistoricalPool(pool.filter(row => row.subjectCode !== 'JEE_PHYSICS'
      || row.questionType !== 'NUMERICAL_VALUE'), true, 'unsafe')).toThrow('Insufficient verified JEE pool');
  });
});
