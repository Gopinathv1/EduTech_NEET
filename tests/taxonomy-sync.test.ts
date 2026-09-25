import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  PRODUCTION_SYNC_CONFIRMATION,
  assertSafeSyncTarget,
  canonicalNeetChapters,
  planCanonicalTaxonomySync,
  type ExistingSubject,
} from '@/lib/question-bank/taxonomy-sync';
import { validateQuestionBank, type BankQuestion } from '@/lib/question-bank/validator';
import { QUESTION_BANK_V1_TAXONOMY } from '@/lib/question-bank/taxonomy';

const localUrl = 'postgresql://user:pass@127.0.0.1:5433/sivora_test';
const productionPooled = 'postgresql://user:pass@prod-pooler.example.test/NEET';
const productionDirect = 'postgresql://user:pass@prod.example.test/NEET';

function completeInventory(): ExistingSubject[] {
  return ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'].map((code) => ({
    id: `subject-${code}`,
    code,
    chapters: canonicalNeetChapters().filter((chapter) => chapter.subjectCode === code).map((chapter, index) => ({ id: `${code}-${index}`, name: chapter.name })),
  }));
}

function loadSelection(): BankQuestion[] {
  const bankDir = path.resolve(process.cwd(), 'data/question-bank');
  const selection = JSON.parse(readFileSync(path.join(bankDir, 'sivora-neet-full-mock-1-selection.json'), 'utf8')) as {
    sources: { includeAll: string[]; selected: Record<string, string[]> };
  };
  const load = (file: string) => JSON.parse(readFileSync(path.join(bankDir, file), 'utf8')) as BankQuestion[];
  const rows = selection.sources.includeAll.flatMap(load);
  for (const [file, ids] of Object.entries(selection.sources.selected)) {
    const byId = new Map(load(file).map((question) => [question.externalId, question]));
    for (const id of ids) rows.push(byId.get(id)!);
  }
  return rows;
}

describe('canonical NEET taxonomy sync', () => {
  it('defines exactly 57 canonical chapters with the expected subject totals', () => {
    const canonical = canonicalNeetChapters();
    expect(canonical).toHaveLength(57);
    expect(Object.fromEntries(['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'].map((code) => [code, canonical.filter((chapter) => chapter.subjectCode === code).length]))).toEqual({ PHYSICS: 20, CHEMISTRY: 20, BOTANY: 9, ZOOLOGY: 8 });
  });

  it('adds missing chapters, reuses normalized matches, and preserves legacy records', () => {
    const existing: ExistingSubject[] = [{ id: 'physics', code: 'PHYSICS', chapters: [
      { id: 'matched', name: '  laws   OF motion ' },
      { id: 'legacy', name: 'Modern Physics' },
    ] }];
    const plan = planCanonicalTaxonomySync(existing);
    expect(plan.chaptersMatched).toContainEqual(expect.objectContaining({ id: 'matched', name: 'Laws of Motion' }));
    expect(plan.legacyPreserved).toContainEqual({ subjectCode: 'PHYSICS', id: 'legacy', name: 'Modern Physics' });
    expect(plan.subjectsMissing.map((subject) => subject.code)).toEqual(['CHEMISTRY', 'BOTANY', 'ZOOLOGY']);
    expect(plan.chaptersMissing.length).toBeGreaterThan(0);
  });

  it('is idempotent for a complete inventory and leaves unrelated data outside the plan', () => {
    const plan = planCanonicalTaxonomySync([...completeInventory(), { id: 'jee', code: 'JEE_PHYSICS', chapters: [{ id: 'unrelated', name: 'Kinematics' }] }]);
    expect(plan.subjectsMissing).toEqual([]);
    expect(plan.chaptersMissing).toEqual([]);
    expect(plan.writesRequired).toBe(0);
    expect(plan.chaptersMatched).toHaveLength(57);
    expect(plan.legacyPreserved).toEqual([]);
  });

  it('allows dry-run with zero write authorization and guards production writes', () => {
    expect(assertSafeSyncTarget({ databaseUrl: productionPooled, directUrl: productionDirect, dryRun: true }).direct.classification).toBe('PRODUCTION');
    expect(() => assertSafeSyncTarget({ databaseUrl: productionPooled, directUrl: productionDirect, dryRun: false })).toThrow('Production write refused');
    expect(assertSafeSyncTarget({ databaseUrl: productionPooled, directUrl: productionDirect, dryRun: false, confirmation: PRODUCTION_SYNC_CONFIRMATION }).direct.classification).toBe('PRODUCTION');
    expect(assertSafeSyncTarget({ databaseUrl: localUrl, directUrl: localUrl, dryRun: false }).direct.classification).toBe('LOCAL_TEST');
  });

  it('keeps the complete 180-question selection structurally valid against canonical taxonomy', () => {
    const questions = loadSelection();
    expect(questions).toHaveLength(180);
    expect(new Set(questions.map((question) => question.externalId))).toHaveLength(180);
    expect(validateQuestionBank(questions)).toEqual([]);
    const canonicalUnits = new Set(
      QUESTION_BANK_V1_TAXONOMY
        .filter((entry) => entry.exam === 'NEET')
        .map((entry) => `${entry.subjectCode}:${entry.unitSlug}`),
    );
    expect(questions.every((question) => canonicalUnits.has(`${question.subjectCode}:${question.chapterSlug}`))).toBe(true);
  });
});
