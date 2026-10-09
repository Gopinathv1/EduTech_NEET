import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import Papa from 'papaparse';
import { QUESTION_BANK_V1_TAXONOMY } from '@/lib/question-bank/taxonomy';
import { questionTextHash } from '@/lib/admin/bulk';
import questions from '@/data/previous-year/neet/2020/questions.json';
import quarantine from '@/data/previous-year/neet/2020/quarantine.json';
import manifest from '@/data/previous-year/neet/2020/source-manifest.json';
import finalKey from '@/data/previous-year/neet/2020/final-answer-key.json';
import extraction from '@/data/previous-year/neet/2020/raw-extraction.json';

const digest = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const root = 'data/previous-year/neet/2020';

describe('unpublished English NEET 2020 E1 content', () => {
  it('accounts for the exact 180 source identities without overlap or pretending quarantine is usable', () => {
    const numbers = [...questions, ...quarantine].map(q => q.originalQuestionNumber);
    expect(numbers.sort((a, b) => a - b)).toEqual(Array.from({ length: 180 }, (_, i) => i + 1));
    expect(questions).toHaveLength(147);
    expect(quarantine).toHaveLength(33);
    expect(manifest.completeness).toMatchObject({ expected: 180, extractedSourceSlots: 180,
      completeManualTranscriptions: 152, validated: 147, quarantined: 33,
      missingUnaccountedSourceSlots: 0, missingValidatedQuestions: 33, status: 'PARTIAL_UNPUBLISHED' });
    expect(extraction.records).toHaveLength(180);
    expect(extraction.records.every(row => row.boundaryDetected && row.rawOcrText.trim())).toBe(true);
  });

  it('binds every answer to the exact official E1 main-exam key, never another booklet or re-exam', () => {
    expect(finalKey).toMatchObject({ paperCode: 'E1', examDate: '2020-09-13', authority: 'OFFICIAL_NTA_FINAL', page: 1 });
    expect(Object.keys(finalKey.answers)).toHaveLength(180);
    expect(finalKey.url).toBe('https://www.nta.ac.in/Download/Notice/Notice_20201016104324.pdf');
    expect(createHash('sha256').update(Array.from({ length: 180 }, (_, i) =>
      finalKey.answers[String(i + 1) as keyof typeof finalKey.answers]).join('')).digest('hex'))
      .toBe('5bc76e290614d1545b87f8cea0efd7b5937373456df89e8750d6915d25af199e');
    for (const q of questions) {
      expect(q.correctOption).toBe(finalKey.answers[String(q.originalQuestionNumber) as keyof typeof finalKey.answers]);
      expect(q.answerValidation.officialPrintedOption).toBe('ABCD'.indexOf(q.correctOption) + 1);
      expect(q).toMatchObject({ exam: 'NEET', year: 2020, examYear: 2020, language: 'en', paperCode: 'E1', examDate: '2020-09-13' });
      expect(q.source.paperSha256).toBe(manifest.sources.paperSha256);
      expect(q.source.answerKeySha256).toBe(finalKey.sha256);
      expect(q.source.sourcePage).toBe(extraction.records.find(row => row.originalQuestionNumber === q.originalQuestionNumber)?.sourcePage);
      expect(q.externalId).toBe(`historical-verified:neet:2020:e1:${q.originalQuestionNumber}`);
    }
  });

  it('has four complete options and canonical taxonomy while preserving original E1 subject order', () => {
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(q.options.every(option => option.trim().length > 0)).toBe(true);
      expect(q.questionType).toBe('SINGLE_CORRECT');
      expect([q.questionText, ...q.options].join(' ')).not.toMatch(/\uFFFD|<img|\[diagram\]|\bTODO\b/);
      const taxonomy = QUESTION_BANK_V1_TAXONOMY.find(t => t.exam === 'NEET' && t.subjectCode === q.subjectCode && t.unitSlug === q.chapterSlug);
      expect(taxonomy?.topicSlugs, `Q${q.originalQuestionNumber}`).toContain(q.topic);
      expect(q.originalQuestionNumber <= 90 ? ['BOTANY', 'ZOOLOGY'] : q.originalQuestionNumber <= 135 ? ['CHEMISTRY'] : ['PHYSICS']).toContain(q.subjectCode);
    }
    expect(manifest.subjectCounts).toEqual({ BOTANY: 42, ZOOLOGY: 30, CHEMISTRY: 36, PHYSICS: 39 });
  });

  it('keeps all records unpublished and excludes 2020 from the existing production release selection', () => {
    for (const q of questions) expect(q).toMatchObject({ validationState: 'VALIDATED', status: 'REVIEW', reviewState: 'REVIEW_REQUIRED', isActive: false });
    for (const q of quarantine) {
      expect(q).toMatchObject({ validationState: 'QUARANTINED', reviewState: 'DRAFT', isActive: false });
      expect(q.reasons.length).toBeGreaterThan(0);
    }
    expect(manifest.releaseGate).toMatchObject({ importReady: false, published: false, productionImportAuthorized: false });
    const release = JSON.parse(fs.readFileSync('data/previous-year/neet/release-manifest.json', 'utf8'));
    expect(release.years).not.toContain(2020);
    const batchIds = manifest.batches.flatMap(batch => batch.externalIds);
    expect(batchIds).toEqual(questions.map(q => q.externalId));
    expect(manifest.batches.every(batch => batch.externalIds.length <= 25 && batch.status === 'UNPUBLISHED_REVIEW_REQUIRED')).toBe(true);
  });

  it('has no retained normalized-stem collisions with existing repository question content', () => {
    const current = new Set(questions.map(q => questionTextHash(q.questionText)));
    expect(current.size).toBe(questions.length);
    const compare = (value: unknown) => {
      if (!value || typeof value !== 'object') return;
      const row = value as Record<string, unknown>;
      const text = row.questionText ?? row.en_questionText;
      if (typeof text === 'string') expect(current.has(questionTextHash(text)), text).toBe(false);
      Object.values(row).filter(child => child && typeof child === 'object').forEach(compare);
    };
    for (const exam of ['neet', 'jee']) for (const year of [2021, 2022, 2023, 2024, 2025]) {
      compare(JSON.parse(fs.readFileSync(`data/previous-year/${exam}/${year}/questions.json`, 'utf8')));
    }
    for (const file of fs.readdirSync('data/question-bank').filter(file => /\.(json|csv)$/.test(file))) {
      const text = fs.readFileSync(path.join('data/question-bank', file), 'utf8');
      compare(file.endsWith('.json') ? JSON.parse(text) : Papa.parse(text, { header: true }).data);
    }
    compare(JSON.parse(fs.readFileSync('data/neet-2025-template.json', 'utf8')));
    expect(quarantine.filter(q => q.reasons.includes('EXISTING_NORMALIZED_STEM_COLLISION_REQUIRES_REVIEW')).map(q => q.originalQuestionNumber)).toEqual([35, 77, 126]);
  });

  it('preserves notation and option ordering at known OCR failure points', () => {
    const find = (n: number) => questions.find(q => q.originalQuestionNumber === n)!;
    expect(find(21).options[0]).toBe('5′ - GAATTC - 3′\n3′ - CTTAAG - 5′');
    expect(find(94).options[0]).toBe('−8.314 J mol⁻¹ K⁻¹ × 300 K × ln(2 × 10¹³)');
    expect(find(116).options[0]).toBe('SCN⁻ < F⁻ < C₂O₄²⁻ < CN⁻');
    expect(find(124).questionText).toContain('¹⁷⁵₇₁Lu');
    expect(find(158).options[0]).toBe('¹⁴⁴₅₆Ba');
    expect(find(173).questionText).toContain('3 × 10⁻¹⁰ V m⁻¹');
    expect(find(173).correctOption).toBe('B');
    expect(find(54).correctOption).toBe('A'); // Preserve the final key; do not rewrite to an absent LH option.
    expect(quarantine.find(q => q.originalQuestionNumber === 13)?.reasons).toContain('CANONICAL_TAXONOMY_GAP');
    expect(quarantine.find(q => q.originalQuestionNumber === 180)?.reasons).toContain('DIAGRAM_OR_STRUCTURAL_OPTIONS_NOT_STAGED');
  });

  it('matches persisted content hashes so later edits require refreshed review metadata', () => {
    expect(digest(`${root}/questions.json`)).toBe(manifest.questionsSha256);
    expect(digest(`${root}/quarantine.json`)).toBe(manifest.quarantineSha256);
    expect(manifest.sources.paperSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.sources.answerKeySha256).toMatch(/^[a-f0-9]{64}$/);
  });
});
