import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import Papa from 'papaparse';
import { questionTextHash } from '@/lib/admin/bulk';
import { QUESTION_BANK_V1_TAXONOMY } from '@/lib/question-bank/taxonomy';
import manifest from '@/data/previous-year/neet/2018/source-manifest.json';
import key from '@/data/previous-year/neet/2018/candidate-answer-key.json';
import slots from '@/data/previous-year/neet/2018/slot-manifest.json';
import reviewed from '@/data/previous-year/neet/2018/reviewed-transcriptions.json';
import quarantine from '@/data/previous-year/neet/2018/quarantine.json';

const root = 'data/previous-year/neet/2018';
const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));
const digest = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

describe('English NEET 2018 AA quarantine staging', () => {
  it('accounts for all printed slots without claiming validated coverage', () => {
    expect(read(`${root}/questions.json`)).toEqual([]);
    expect(quarantine.map(q => q.originalQuestionNumber)).toEqual(Array.from({ length: 180 }, (_, i) => i + 1));
    expect(new Set(quarantine.map(q => q.identityKey)).size).toBe(180);
    expect(slots.records).toHaveLength(180);
    expect(reviewed.records).toHaveLength(167);
    expect(manifest.completeness).toMatchObject({ validated: 0, quarantined: 180, missingUnaccountedSourceSlots: 0,
      missingValidatedQuestions: 180, approved: 0, studentVisible: 0, status: 'BLOCKED_UNPUBLISHED' });
  });

  it('does not promote the mirrored key to official final authority', () => {
    expect(key).toMatchObject({ paperCode: 'AA', bookletCode: 'ACHLA', printedDate: '2018-05-30',
      authority: 'UNVERIFIED_ARCHIVE_CANDIDATE', officialFinalKeyAuthenticated: false, page: 1 });
    const tokens = key.printedKeyTokens as Record<string, string>;
    expect(Object.keys(tokens)).toHaveLength(180);
    expect(Object.values(tokens).every(t => /^[1-4]$/.test(t))).toBe(true);
    expect(createHash('sha256').update(Array.from({ length: 180 }, (_, i) => tokens[i + 1]).join('')).digest('hex'))
      .toBe('29e2c4fa066ac46fd5dca413a41215cbc0c4b920835976f1829bd1ed656a3893');
    for (const q of quarantine) {
      expect(q.candidatePrintedKeyToken).toBe(tokens[q.originalQuestionNumber]);
      expect(q.answerValidation).toEqual({ officialFinalKeyAuthenticated: false, correctAnswerVerified: false });
      expect(q).not.toHaveProperty('correctOption');
      expect(q).not.toHaveProperty('officialAcceptedOptions');
    }
    for (const n of [27, 50]) expect(quarantine[n - 1].reasons).toContain('CONFLICTING_CANDIDATE_AND_COACHING_ANSWER_KEYS');
  });

  it('keeps every record inactive behind the original approval/quarantine gates', () => {
    expect(manifest.releaseGate).toEqual({ importReady: false, published: false, approvalRequired: true, productionImportAuthorized: false });
    for (const q of quarantine) {
      expect(q).toMatchObject({ language: 'en', status: 'DRAFT', reviewState: 'DRAFT', validationState: 'QUARANTINED', isActive: false });
      expect(q.reasons).toContain('OFFICIAL_FINAL_ANSWER_KEY_PUBLICATION_CHAIN_NOT_AUTHENTICATED');
      expect(q.identityKey).toBe(`NEET:2018:2018-05-06:AA:${q.originalQuestionNumber}`);
    }
  });

  it('preserves checked English text, source numbering, option order and notation', () => {
    for (const q of quarantine.filter(q => q.recoveredOptions)) {
      expect(q.recoveredOptions).toHaveLength(4);
      expect(q.recoveredOptions?.every(o => o.trim())).toBe(true);
      expect([q.recoveredQuestionText, ...q.recoveredOptions!].join(' ')).not.toMatch(/[\u0900-\u097F\uE000-\uF8FF\uFFFD]/);
      const s = slots.records[q.originalQuestionNumber - 1];
      expect(q.sourcePage).toBe(s.sourcePage);
      expect(q.sourceColumn).toBe(s.sourceColumn);
    }
    expect(quarantine[36].recoveredOptions).toEqual(['0·053 cm', '0·525 cm', '0·521 cm', '0·529 cm']);
    expect(quarantine[11].recoveredOptions?.[2]).toBe('λ₀/(1 + (eE₀/(mV₀))t)');
    expect(quarantine[76].recoveredOptions?.[2]).toBe('1·08 × 10⁻¹⁰ mol² L⁻²');
    expect(quarantine[160].recoveredOptions).toEqual(['ACCUAUGCGAU', 'UGGTUTCGCAT', 'AGGUAUCGCAU', 'UCCAUAGCGUA']);
  });

  it('flags unsupported classification and preserves original subject sections', () => {
    expect(manifest.taxonomyGapNumbers).toEqual([95, 97]);
    expect(manifest.notationRenderingIssueNumbers).toEqual([12, 18, 34, 36]);
    for (const n of manifest.notationRenderingIssueNumbers) expect(quarantine[n - 1].reasons).toContain('VECTOR_ARROW_GLYPH_RENDERING_REQUIRES_REVIEW');
    for (const q of quarantine) {
      expect(q.originalSection).toBe(q.originalQuestionNumber <= 45 ? 'PHYSICS' : q.originalQuestionNumber <= 90 ? 'CHEMISTRY' : 'BIOLOGY');
      const valid = QUESTION_BANK_V1_TAXONOMY.some(t => t.exam === 'NEET' && t.subjectCode === q.proposedSubjectCode
        && t.unitSlug === q.proposedChapterSlug && t.topicSlugs.includes(q.proposedTopic));
      expect(valid).toBe(!q.reasons.includes('CANONICAL_TAXONOMY_GAP'));
    }
  });

  it('checks all transcribed stems against protected content and within the paper', () => {
    const stems = new Map<string, string[]>();
    function collect(value: unknown, file: string) {
      if (!value || typeof value !== 'object') return;
      const row = value as Record<string, unknown>; const text = row.questionText ?? row.en_questionText;
      if (typeof text === 'string') {
        const hash = questionTextHash(text); stems.set(hash, [...(stems.get(hash) ?? []), file]);
      }
      for (const child of Object.values(row)) if (typeof child === 'object') collect(child, file);
    }
    for (const exam of ['neet', 'jee']) for (const year of [2021, 2022, 2023, 2024, 2025]) {
      const file = `data/previous-year/${exam}/${year}/questions.json`; collect(read(file), file);
    }
    for (const year of [2019, 2020]) { const file = `data/previous-year/neet/${year}/questions.json`; collect(read(file), file); }
    for (const name of fs.readdirSync('data/question-bank').filter(f => /\.(json|csv)$/.test(f))) {
      const file = `data/question-bank/${name}`;
      collect(name.endsWith('.json') ? read(file) : Papa.parse(fs.readFileSync(file, 'utf8'), { header: true }).data, file);
    }
    collect(read('data/neet-2025-template.json'), 'data/neet-2025-template.json');
    for (const q of quarantine.filter(q => q.recoveredQuestionText)) {
      const hash = questionTextHash(q.recoveredQuestionText!);
      expect(q.duplicateMatches.map(m => m.file)).toEqual(stems.get(hash) ?? []);
      stems.set(hash, [...(stems.get(hash) ?? []), `${root}/reviewed-transcriptions.json`]);
    }
    expect(manifest.duplicateCollisionNumbers).toEqual([109, 130]);
  });

  it('pins reproducible inputs and retains every incomplete diagram as original evidence', () => {
    expect(digest(`${root}/questions.json`)).toBe(manifest.questionsSha256);
    expect(digest(`${root}/quarantine.json`)).toBe(manifest.quarantineSha256);
    expect(digest(`${root}/reviewed-transcriptions.json`)).toBe(manifest.reviewedTranscriptionsSha256);
    expect(digest(`${root}/slot-manifest.json`)).toBe(manifest.slotManifestSha256);
    expect(digest(`${root}/candidate-answer-key.json`)).toBe(manifest.candidateKeySha256);
    expect(manifest.diagramIncompleteNumbers).toEqual([1, 7, 15, 17, 30, 35, 39, 52, 64, 66, 68, 81, 90]);
    for (const q of quarantine.filter(q => q.sourceEvidence)) {
      expect(fs.readFileSync(q.sourceEvidence!).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    }
    expect(manifest.batches.every(b => b.originalQuestionNumbers.length <= 25)).toBe(true);
    expect(manifest.batches.flatMap(b => b.originalQuestionNumbers)).toEqual(Array.from({ length: 180 }, (_, i) => i + 1));
  });
});
