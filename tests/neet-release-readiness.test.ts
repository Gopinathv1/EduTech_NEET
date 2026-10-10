import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { neetValidatedCatalogue } from '@/lib/previous-year/neet-catalogue';
import { NEET_PYQ_YEARS, neetContentIssues, neetDuplicateOwners, neetProductionEligible,
  neetPracticeYear, neetYearAvailability, type NeetDatabaseRow } from '@/lib/previous-year/neet-release-readiness';
import { QUESTION_BANK_V1_TAXONOMY } from '@/lib/question-bank/taxonomy';

const q = neetValidatedCatalogue[0];
const row = (): NeetDatabaseRow => ({ id: 'db', externalId: q.externalId, exam: 'NEET', year: q.year,
  examYear: q.year, paperSession: q.paperSession, topic: q.topic, questionType: q.questionType,
  sourceType: q.sourceType, sourceName: q.sourceName, sourceUrl: q.sourceUrl,
  officialAnswerKeyReference: q.officialAnswerKeyReference, imageUrl: null,
  reviewState: 'APPROVED', status: 'PUBLISHED', isActive: true, contentClass: 'PRODUCTION', reviewer: 'reviewer', reviewedAt: new Date(),
  subject: { code: q.subjectCode }, chapter: { name: { en: QUESTION_BANK_V1_TAXONOMY.find(t => t.exam === 'NEET' && t.subjectCode === q.subjectCode && t.unitSlug === q.chapterSlug)!.unitName } },
  translations: [{ language: 'en', questionText: q.questionText, optionA: q.options[0], optionB: q.options[1],
    optionC: q.options[2], optionD: q.options[3], correctOption: q.correctOption }] });

describe('English NEET release gates', () => {
  it('seals the authenticated 2014 R final key without inventing answers for bonus questions', () => {
    const gate = JSON.parse(fs.readFileSync('data/previous-year/neet/2014/source-gate.json', 'utf8'));
    expect(gate).toMatchObject({ paperCode: 'R', authority: 'CBSE', answerKeyPage: 3, validated: 0, approved: 0 });
    expect(Object.keys(gate.printedKeyTokens)).toHaveLength(180);
    expect(Object.entries(gate.printedKeyTokens).filter(([, token]) => token === '9').map(([n]) => Number(n))).toEqual([28, 170, 175]);
    expect(gate.finalKeySha256).toBe(createHash('sha256').update(fs.readFileSync('data/previous-year/neet/2014/evidence/official-final-key.pdf')).digest('hex'));
    expect(gate.releaseGate).toMatchObject({ importReady: false, published: false });
  });
  it('keeps the 303 staged questions distinct from the 780 later candidates', () => {
    expect(neetValidatedCatalogue).toHaveLength(1083);
    expect(neetValidatedCatalogue.filter(q => q.year < 2021)).toHaveLength(303);
    expect(new Set(neetValidatedCatalogue.map(q => q.externalId)).size).toBe(1083);
    expect(neetValidatedCatalogue.every(q => q.exam === 'NEET' && q.validationState === 'VALIDATED')).toBe(true);
  });
  it('requires exact identity, answer, wording, symbols, options, taxonomy and provenance', () => {
    expect(neetContentIssues(q, row())).toEqual([]);
    const wrong = row(); wrong.translations[0].optionA += ' altered'; wrong.examYear = 2020;
    wrong.officialAnswerKeyReference = 'https://example.org/coaching-key'; wrong.topic = 'other';
    expect(neetContentIssues(q, wrong)).toEqual(expect.arrayContaining(['IDENTITY_MISMATCH', 'PROVENANCE_MISMATCH', 'TAXONOMY_MISMATCH', 'ENGLISH_CONTENT_OR_ANSWER_MISMATCH']));
    const symbols = row(); symbols.translations[0].questionText += ' −';
    expect(neetContentIssues(q, symbols)).toContain('ENGLISH_CONTENT_OR_ANSWER_MISMATCH');
  });
  it('never treats source validation as approval or a complete production gate', () => {
    expect(neetProductionEligible(row())).toBe(true);
    for (const patch of [{ reviewState: 'REVIEW_REQUIRED' }, { status: 'DRAFT' }, { isActive: false },
      { reviewer: null }, { reviewedAt: null }, { contentClass: 'SAMPLE' }, { translations: [] }]) {
      expect(neetProductionEligible({ ...row(), ...patch })).toBe(false);
    }
  });
  it('finds every normalized stem owner without merging historical identities', () => {
    const owners = neetDuplicateOwners([{ id: 'a', questionText: 'Same  Stem' }, { id: 'b', questionText: ' same stem ' }]);
    expect([...owners.values()][0]).toEqual(new Set(['a', 'b']));
  });
  it('shows all 2013–2025 years with coming soon for missing approval or missing usable practice', () => {
    const years = neetYearAvailability([{ id: 'a', year: 2025 }, { id: 'b', year: 2020 }], [
      { id: 'valid', year: 2025, totalQuestions: 1, questionIds: ['a'] },
      { id: 'empty', year: 2020, totalQuestions: 0, questionIds: [] },
      { id: 'unapproved', year: 2019, totalQuestions: 1, questionIds: ['draft'] },
      { id: 'incomplete', year: 2020, totalQuestions: 2, questionIds: ['b'] },
      { id: 'repeated', year: 2020, totalQuestions: 2, questionIds: ['b', 'b'] },
    ]);
    expect(years.map(y => y.year)).toEqual(NEET_PYQ_YEARS);
    expect(years.filter(y => !y.comingSoon).map(y => y.year)).toEqual([2025]);
    expect(years.find(y => y.year === 2025)?.visibleCount).toBe(1);
    expect(years.find(y => y.year === 2020)?.practices).toEqual([]);
  });
  it('binds existing year tests through their stored historical metadata and rejects conflicts', () => {
    expect(neetPracticeYear({ year: null, rules: { historical: { years: [2021] } } })).toBe(2021);
    expect(neetPracticeYear({ year: null, rules: { year: 2021 } })).toBe(2021);
    expect(neetPracticeYear({ year: null, rules: { year: 2021, historical: { years: [2022] } } })).toBeNull();
    expect(neetPracticeYear({ year: 2022, rules: { historical: { years: [2021] } } })).toBeNull();
    expect(neetPracticeYear({ year: null, rules: { historical: { years: [2021, 2022] } } })).toBeNull();
    expect(neetPracticeYear({ year: 2021, rules: {} })).toBeNull();
  });
  it('packages only exact repository candidates with live approved-production evidence', () => {
    const root = 'data/previous-year/neet/release-2013-2025';
    const manifest = JSON.parse(fs.readFileSync(`${root}/manifest.json`, 'utf8'));
    const packaged = JSON.parse(fs.readFileSync(`${root}/questions.json`, 'utf8'));
    expect(manifest.databaseEvidence).toBe('LIVE_SELECT_ONLY_READ_ONLY_TRANSACTION');
    expect(manifest.releaseGate).toMatchObject({ productionReleaseAuthorized: false, importReady: false, approvalWrites: 0, productionWrites: 0, published: false });
    expect(packaged.length).toBe(manifest.releaseReadyCount);
    expect(manifest.questionsSha256).toBe(createHash('sha256').update(fs.readFileSync(`${root}/questions.json`)).digest('hex'));
    for (const record of packaged) {
      const canonical = neetValidatedCatalogue.find(q => q.externalId === record.externalId)!;
      expect(canonical).toBeDefined();
      expect(record.questionText).toBe(canonical.questionText);
      expect(record.options).toEqual(canonical.options);
      expect(record.correctOption).toBe(canonical.correctOption);
      expect(record.approvalEvidence).toMatchObject({ reviewState: 'APPROVED', reviewerPresent: true, status: 'PUBLISHED', isActive: true });
    }
  });
});
