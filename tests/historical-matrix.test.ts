import { describe, expect, it } from 'vitest';
import matrix from '@/data/previous-year/historical-matrix.json';
import { PREVIOUS_YEAR_WINDOW } from '@/lib/previous-year/source-inventory';

describe('2013-2025 historical examination matrix', () => {
  it('covers every target year exactly once for NEET and JEE', () => {
    expect(matrix).toHaveLength(PREVIOUS_YEAR_WINDOW.length * 2);
    for (const exam of ['NEET', 'JEE']) {
      const records = matrix.filter((record) => record.exam === exam);
      expect(records.map((record) => record.year).sort()).toEqual([...PREVIOUS_YEAR_WINDOW]);
      expect(new Set(records.map((record) => record.year)).size).toBe(PREVIOUS_YEAR_WINDOW.length);
    }
  });

  it('records only explicitly validated partial rows and excludes quarantine', () => {
    expect(matrix.reduce((sum, record) => sum + record.validatedQuestionCount, 0)).toBe(780);
    expect(matrix.every((record) => record.validatedQuestionCount <= record.expectedRecoverableQuestionCount)).toBe(true);
    expect(matrix.filter((record) => record.exam === 'NEET' && record.year >= 2021).every((record) => record.status === 'PARTIAL')).toBe(true);
    expect(matrix.filter((record) => record.exam === 'JEE').every((record) => record.validatedQuestionCount === 0)).toBe(true);
  });

  it('records the one durable official paper corpus without pretending it is extracted', () => {
    const neet2020 = matrix.find((record) => record.exam === 'NEET' && record.year === 2020);
    expect(neet2020).toMatchObject({
      historicalExamName: 'NEET (UG) 2020',
      officialPaperAvailability: 'AVAILABLE',
      answerKeyAvailability: 'AVAILABLE',
      expectedRecoverableQuestionCount: 180,
      validatedQuestionCount: 0,
      status: 'EXTRACTION_REQUIRED',
    });
  });

  it('preserves exceptional historical identities instead of rewriting them as modern NEET', () => {
    expect(matrix.find((record) => record.exam === 'NEET' && record.year === 2014)?.historicalExamName).toBe('AIPMT 2014');
    expect(matrix.find((record) => record.exam === 'NEET' && record.year === 2016)?.sessions).toHaveLength(2);
    expect(matrix.find((record) => record.exam === 'JEE' && record.year === 2021)?.sessions).toHaveLength(4);
  });
});
