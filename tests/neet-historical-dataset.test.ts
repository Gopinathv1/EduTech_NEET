import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { QUESTION_BANK_V1_TAXONOMY } from '@/lib/question-bank/taxonomy';

const root = path.join(process.cwd(), 'data', 'previous-year', 'neet');
const years = [2021, 2022, 2023, 2024, 2025] as const;

function read<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')) as T;
}

type Row = {
  externalId: string; exam: string; year: number; paperCode: string; originalQuestionNumber: number;
  questionText: string; options: string[]; correctOption: string; subjectCode: string; chapterSlug: string; topic: string;
  sourceType: string; sourceName: string; sourceUrl: string; officialAnswerKeyReference: string; source: { wordingArchiveUrl: string; officialFinalAnswerKeyUrl: string }; validationState: string;
};

describe('NEET 2021–2025 historical dataset', () => {
  it('matches release totals and has deterministic unique identities', () => {
    const manifest = read<{ totals: { expected: number; validated: number; quarantined: number } }>('release-manifest.json');
    const rows = years.flatMap((year) => read<Row[]>(`${year}/questions.json`));
    const quarantined = years.flatMap((year) => read<unknown[]>(`${year}/quarantine.json`));
    expect(manifest.totals).toEqual({ expected: 980, validated: 780, quarantined: 200 });
    expect(rows).toHaveLength(780);
    expect(new Set(rows.map((row) => row.externalId)).size).toBe(780);
    expect(new Set(rows.map((row) => `${row.year}:${row.paperCode}:${row.originalQuestionNumber}`)).size).toBe(780);
    expect(quarantined).toHaveLength(200);
  });

  it('retains only four-option, single-key rows mapped to canonical SIVORA taxonomy', () => {
    const rows = years.flatMap((year) => read<Row[]>(`${year}/questions.json`));
    for (const row of rows) {
      expect(row.externalId).toMatch(/^historical-verified:neet:(2021|2022|2023|2024|2025):[a-z0-9-]+:\d+$/);
      expect(row.exam).toBe('NEET');
      expect(row.options).toHaveLength(4);
      expect(['A', 'B', 'C', 'D']).toContain(row.correctOption);
      expect(row.questionText.trim().length).toBeGreaterThan(10);
      expect(row.sourceType).toBe('HISTORICAL_VERIFIED');
      expect(row.sourceName).toContain('historical paper');
      expect(row.sourceUrl).toMatch(/^https:\/\//);
      expect(row.officialAnswerKeyReference).toMatch(/^https:\/\//);
      expect(row.source.wordingArchiveUrl).toMatch(/^https:\/\//);
      expect(row.source.officialFinalAnswerKeyUrl).toMatch(/^https:\/\//);
      expect(row.validationState).toBe('VALIDATED');
      const taxonomy = QUESTION_BANK_V1_TAXONOMY.find((entry) => entry.exam === 'NEET' && entry.subjectCode === row.subjectCode && entry.unitSlug === row.chapterSlug);
      expect(taxonomy, `${row.year} Q${row.originalQuestionNumber} ${row.subjectCode} ${row.chapterSlug} ${row.topic}`).toBeDefined();
      expect(taxonomy?.topicSlugs, `${row.year} Q${row.originalQuestionNumber} ${row.subjectCode} ${row.chapterSlug} ${row.topic}`).toContain(row.topic);
    }
  });

  it('preserves subject coverage for mixed NEET practice', () => {
    const rows = years.flatMap((year) => read<Row[]>(`${year}/questions.json`));
    for (const subject of ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY']) {
      expect(rows.filter((row) => row.subjectCode === subject).length).toBeGreaterThanOrEqual(subject === 'PHYSICS' ? 45 : 45);
    }
  });
});
