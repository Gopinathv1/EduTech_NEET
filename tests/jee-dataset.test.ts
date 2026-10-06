import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assertValidJeeDataset, type JeeHistoricalQuestion, type JeeInventoryEntry, type JeeQuarantineRecord } from '@/lib/previous-year/jee-dataset';
import type { JeeKeyQuestion } from '@/lib/previous-year/jee-validation';

const load = <T>(file: string): T => JSON.parse(readFileSync(`data/previous-year/jee/${file}`, 'utf8'));
const years = [2021, 2022, 2023, 2024, 2025];
const questions = years.flatMap(year => load<JeeHistoricalQuestion[]>(`${year}/questions.json`));
const quarantine = years.flatMap(year => load<JeeQuarantineRecord[]>(`${year}/quarantine.json`));
const inventory = load<{ entries: JeeInventoryEntry[] }>('acquisition-manifest.json').entries;
const keys = load<{ entries: { paperId: string; questions: JeeKeyQuestion[] }[] }>('final-answer-keys.json').entries;
const check = (rows = questions, excluded = quarantine) => assertValidJeeDataset(rows, inventory, keys, excluded);

describe('reviewed five-year JEE canonical dataset', () => {
  it('validates every retained question against its applicable final key and source', () => {
    expect(questions).toHaveLength(218);
    expect(quarantine).toHaveLength(67);
    expect(() => check()).not.toThrow();
    expect(years.map(year => questions.filter(row => row.year === year).length)).toEqual([66, 33, 46, 37, 36]);
  });

  it('preserves null printed numbers and independent source order for all 2022 rows', () => {
    const rows = questions.filter(row => row.year === 2022);
    expect(rows).toHaveLength(33);
    for (const row of rows) {
      expect(row.originalQuestionNumber).toBeNull();
      expect(row.externalId).toBe(`${row.paperId}-nta-${row.questionId}`);
      expect(row.sourceOrder).toBeGreaterThan(0);
      expect(row.session).toBe(2);
    }
    expect(new Set(rows.map(row => row.sourceOrder)).size).toBe(rows.length);
  });

  it('rejects fabricated original numbers and changed source identity', () => {
    const row = questions.find(question => question.year === 2022)!;
    expect(() => check([{ ...row, originalQuestionNumber: row.sourceOrder }])).toThrow('Noncanonical external ID');
    expect(() => check([{ ...row, shift: 2 }])).toThrow('Unlisted historical paper identity');
    expect(() => check([{ ...row, regionVariant: 'DOMESTIC' }])).toThrow('Region variant');
  });

  it('rejects wrong final answers and retained quarantine identities', () => {
    const row = questions.find(question => question.year === 2022 && question.questionType === 'SINGLE_CORRECT')!;
    expect(() => check([{ ...row, correctOption: row.correctOption === 'A' ? 'B' : 'A' }])).toThrow('Invalid MCQ representation');
    expect(() => check([row], [{ paperId: row.paperId, questionId: row.questionId, reason: 'UNSAFE', detail: 'Test exclusion' }])).toThrow('Quarantined question');
    expect(() => check([{ ...row, answerValidation: { ...row.answerValidation, rawAnswer: 'invented' } }])).toThrow('Raw answer differs');
  });

  it('covers all three subjects and both nature categories in every year', () => {
    for (const year of years) {
      const rows = questions.filter(row => row.year === year);
      expect(new Set(rows.map(row => row.subjectCode)).size).toBe(3);
      expect(new Set(rows.map(row => row.questionNature)).size).toBe(2);
    }
  });
});
