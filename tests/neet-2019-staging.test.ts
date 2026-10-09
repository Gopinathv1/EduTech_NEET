import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import Papa from 'papaparse';
import { QUESTION_BANK_V1_TAXONOMY } from '@/lib/question-bank/taxonomy';
import { questionTextHash } from '@/lib/admin/bulk';
import questions from '@/data/previous-year/neet/2019/questions.json';
import quarantine from '@/data/previous-year/neet/2019/quarantine.json';
import manifest from '@/data/previous-year/neet/2019/source-manifest.json';
import key from '@/data/previous-year/neet/2019/final-answer-key.json';
import extraction from '@/data/previous-year/neet/2019/raw-extraction.json';
import reviewed from '@/data/previous-year/neet/2019/reviewed-transcriptions.json';

const root = 'data/previous-year/neet/2019';
const digest = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));

describe('unpublished English NEET 2019 P1 staging', () => {
  it('partitions all 180 printed identities and reports incomplete coverage honestly', () => {
    expect([...questions, ...quarantine].map(q => q.originalQuestionNumber).sort((a, b) => a - b))
      .toEqual(Array.from({ length: 180 }, (_, i) => i + 1));
    expect(questions).toHaveLength(156);
    expect(quarantine).toHaveLength(24);
    expect(extraction.records).toHaveLength(180);
    expect(extraction.records.every(q => q.boundaryDetected && q.rawOcrText.trim() && q.sourceColumn === 2)).toBe(true);
    expect(reviewed.records).toHaveLength(166);
    expect(manifest.completeness).toMatchObject({ expected: 180, extractedSourceSlots: 180,
      completeManualTranscriptions: 166, validated: 156, quarantined: 24,
      missingUnaccountedSourceSlots: 0, missingValidatedQuestions: 24, approved: 0, studentVisible: 0,
      status: 'PARTIAL_UNPUBLISHED' });
  });

  it('uses only the 5 May P1 official final key and preserves both multi-answer exceptions', () => {
    expect(key).toMatchObject({ paperCode: 'P1', examDate: '2019-05-05', authority: 'OFFICIAL_NTA_FINAL', page: 1 });
    expect(key.url).toBe('https://www.nta.ac.in/Download/Notice/20190605125750.pdf');
    const tokens = key.printedKeyTokens as Record<string, string>;
    expect(createHash('sha256').update(Array.from({ length: 180 }, (_, i) => tokens[i + 1]).join('')).digest('hex'))
      .toBe('2091c67d7ee31c9f153cb4d1cbcb981efd3f46b8f970a3e77011073a651ded8c');
    expect(key.answers['6']).toEqual(['C', 'D']);
    expect(key.answers['72']).toEqual(['A', 'B']);
    for (const n of [6, 72]) {
      expect(questions.some(q => q.originalQuestionNumber === n)).toBe(false);
      const q = quarantine.find(q => q.originalQuestionNumber === n)!;
      expect(q.reasons).toContain('OFFICIAL_MULTIPLE_ACCEPTED_ANSWERS_UNSUPPORTED_BY_SINGLE_CORRECT_STAGING');
      expect(q.officialAcceptedOptions).toEqual(key.answers[String(n) as keyof typeof key.answers]);
    }
    for (const q of questions) {
      expect(key.answers[String(q.originalQuestionNumber) as keyof typeof key.answers]).toEqual([q.correctOption]);
      expect(q.answerValidation.officialPrintedOption).toBe('ABCD'.indexOf(q.correctOption) + 1);
    }
  });

  it('binds exact English transcriptions, numbering, source pages, subjects and canonical chapters', () => {
    for (const q of questions) {
      const row = reviewed.records.find(r => r[0] === q.originalQuestionNumber)!;
      expect(q.questionText).toBe(row[5]);
      expect(q.options).toEqual(row[6]);
      expect(q.options).toHaveLength(4);
      expect(q.options.every(o => o.trim())).toBe(true);
      expect([q.questionText, ...q.options].join(' ')).not.toMatch(/[\u0900-\u097F\uFFFD]|\bTODO\b|\[diagram\]/);
      expect(q).toMatchObject({ exam: 'NEET', year: 2019, examYear: 2019, language: 'en', paperCode: 'P1', examDate: '2019-05-05' });
      expect(q.externalId).toBe(`historical-verified:neet:2019:p1:${q.originalQuestionNumber}`);
      expect(q.source.sourcePage).toBe(extraction.records.find(r => r.originalQuestionNumber === q.originalQuestionNumber)?.sourcePage);
      expect(q.originalSection).toBe(q.originalQuestionNumber <= 45 ? 'PHYSICS' : q.originalQuestionNumber <= 90 ? 'CHEMISTRY' : 'BIOLOGY');
      expect(q.subjectCode).toBe(q.originalQuestionNumber <= 45 ? 'PHYSICS' : q.originalQuestionNumber <= 90 ? 'CHEMISTRY' : q.subjectCode);
      expect(QUESTION_BANK_V1_TAXONOMY.find(t => t.exam === 'NEET' && t.subjectCode === q.subjectCode && t.unitSlug === q.chapterSlug)?.topicSlugs).toContain(q.topic);
      expect(q.source.paperHosting).toBe('THIRD_PARTY_ARCHIVE_OF_ORIGINAL_BOOKLET');
    }
    expect(manifest.sources.officialHostedPaperLocated).toBe(false);
  });

  it('keeps every record unpublished and batches review work into at most 25 questions', () => {
    expect(manifest.releaseGate).toMatchObject({ importReady: false, published: false, productionImportAuthorized: false });
    for (const q of questions) expect(q).toMatchObject({ status: 'REVIEW', reviewState: 'REVIEW_REQUIRED', isActive: false, validationState: 'VALIDATED' });
    for (const q of quarantine) expect(q).toMatchObject({ reviewState: 'DRAFT', isActive: false, validationState: 'QUARANTINED' });
    expect(manifest.batches.every(b => b.externalIds.length <= 25 && b.status === 'UNPUBLISHED_REVIEW_REQUIRED')).toBe(true);
    expect(manifest.batches.flatMap(b => b.externalIds)).toEqual(questions.map(q => q.externalId));
  });

  it('has no retained stem collision against repository PYQs, 2020 staging or question-bank content', () => {
    const existing = new Set<string>();
    function collect(value: unknown) {
      if (!value || typeof value !== 'object') return;
      const row = value as Record<string, unknown>;
      const text = row.questionText ?? row.en_questionText;
      if (typeof text === 'string') existing.add(questionTextHash(text));
      for (const child of Object.values(row)) if (typeof child === 'object') collect(child);
    }
    for (const exam of ['neet', 'jee']) for (const year of [2021, 2022, 2023, 2024, 2025]) collect(read(`data/previous-year/${exam}/${year}/questions.json`));
    collect(read('data/previous-year/neet/2020/questions.json'));
    collect(read('data/neet-2025-template.json'));
    for (const file of fs.readdirSync('data/question-bank').filter(f => /\.(json|csv)$/.test(f))) {
      collect(file.endsWith('.json') ? read(`data/question-bank/${file}`) : Papa.parse(fs.readFileSync(`data/question-bank/${file}`, 'utf8'), { header: true }).data);
    }
    for (const q of questions) {
      expect(existing.has(questionTextHash(q.questionText)), `P1 Q${q.originalQuestionNumber}`).toBe(false);
      existing.add(questionTextHash(q.questionText));
    }
    expect(quarantine.filter(q => q.reasons.includes('EXISTING_NORMALIZED_STEM_COLLISION_REQUIRES_REVIEW')).map(q => q.originalQuestionNumber)).toEqual([110, 124, 156, 159, 164]);
  });

  it('preserves difficult notation and quarantines original diagrams/typography with source evidence', () => {
    expect(questions.find(q => q.originalQuestionNumber === 44)?.questionText).toContain('(A² B^(1/2))/(C^(1/3) D³)');
    expect(questions.find(q => q.originalQuestionNumber === 49)?.questionText).toContain('4d, 5p, 5f and 6p');
    expect(questions.find(q => q.originalQuestionNumber === 172)?.questionText).toContain('5′ AACAGCGGUGCUAUU 3′');
    expect(questions.find(q => q.originalQuestionNumber === 75)?.options[1]).toBe('(t₂g)⁶ (e_g)⁰');
    expect(questions.find(q => q.originalQuestionNumber === 58)?.options[3]).toBe('(iv) (iii) (ii) (i)');
    for (const n of [17, 24, 33, 39, 42, 45, 47, 48, 55, 65, 69, 74, 78, 144]) {
      const q = quarantine.find(q => q.originalQuestionNumber === n)!;
      expect(q.sourceEvidence && fs.existsSync(q.sourceEvidence)).toBe(true);
      expect(q.proposedSubjectCode).toBeTruthy();
      expect(q.proposedChapterSlug).toBeTruthy();
    }
  });

  it('pins content hashes and source provenance', () => {
    expect(digest(`${root}/questions.json`)).toBe(manifest.questionsSha256);
    expect(digest(`${root}/quarantine.json`)).toBe(manifest.quarantineSha256);
    expect(manifest.sources.paperSha256).toBe('8b10964cf8bd9f11a31b86edc480094951d65aa37e10c650290f89a2630c8f42');
    expect(key.sha256).toBe('fdb593f365502c8e1aff61901eafbb2ddd235879d0ca651eb7ecd481b0275769');
    for (const q of questions) {
      expect(q.source.paperSha256).toBe(manifest.sources.paperSha256);
      expect(q.source.answerKeySha256).toBe(key.sha256);
    }
  });
});
