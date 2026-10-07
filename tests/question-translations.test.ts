import { describe, expect, it } from 'vitest';
import { approvedTranslation, canonicalContentHash, protectedTokens, translationQa } from '@/lib/question-translations/content';
import { parseQuestionPreference } from '@/lib/question-translations/preference';
import { saveTranslationSchema } from '@/lib/question-translations/workflow';
import { applyDisplayOrder } from '@/lib/attempts/options';
import manifest from '@/data/question-translations-v1/proof-manifest.json';

const en = { questionText: 'Find x² in m/s²: H₂SO₄, NaCl, 9.8, 6.022 × 10²³, sin θ, ΔH, 10^-3, $x=2$.',
  optionA: '2', optionB: '3', optionC: '4', optionD: '5', explanation: null, correctOption: 'A', numericAnswer: null, numericTolerance: null };
const translated = { ...en, questionText: en.questionText.replace('Find', 'கண்டறிக').replace('in', 'அலகில்'),
  reviewState: 'APPROVED', translationSource: 'SIVORA_TRANSLATION', reviewedById: 'editor', reviewedAt: new Date(), canonicalContentHash: canonicalContentHash('SINGLE_CORRECT', en) };
describe('question translation integrity and visibility', () => {
  it('renders approved wording bound to the canonical revision', () => expect(approvedTranslation('SINGLE_CORRECT', en, translated)).toEqual(translated));
  it.each(['DRAFT', 'REVIEW_REQUIRED', 'REJECTED', 'NEEDS_CORRECTION', undefined])('falls back for %s even with legacy reviewed=true', reviewState => {
    expect(approvedTranslation('SINGLE_CORRECT', en, { ...translated, reviewState, reviewed: true } as typeof translated)).toBeNull();
  });
  it('falls back when missing or when canonical English or answer identity changes', () => {
    expect(approvedTranslation('SINGLE_CORRECT', en, undefined)).toBeNull();
    expect(approvedTranslation('SINGLE_CORRECT', { ...en, questionText: en.questionText + ' Changed' }, translated)).toBeNull();
    expect(approvedTranslation('SINGLE_CORRECT', { ...en, correctOption: 'B' }, translated)).toBeNull();
  });
  it.each(['translationSource', 'reviewedById', 'reviewedAt', 'canonicalContentHash'] as const)('fails closed without %s', key => {
    expect(approvedTranslation('SINGLE_CORRECT', en, { ...translated, [key]: null })).toBeNull();
  });
  it.each(['H₂SO₄', 'NaCl', '9.8', '6.022', '10²³', 'sin θ', 'ΔH', '$x=2$'])('detects corrupted protected token %s', token => {
    expect(translationQa('SINGLE_CORRECT', en, { ...translated, questionText: translated.questionText.replace(token, 'CORRUPTED') }).length).toBeGreaterThan(0);
  });
  it('preserves options in each canonical slot before and after existing presentation shuffle', () => {
    expect(translationQa('SINGLE_CORRECT', en, { ...translated, optionA: '3', optionB: '2' })).toContain('optionA: protected numbers, formulas, variables, units or renderer tokens differ.');
    const order = ['C', 'A', 'D', 'B'] as const;
    expect(applyDisplayOrder(translated, [...order]).optionB).toBe(en.optionA);
  });
  it('never accepts answer or numerical tolerance fields through the translation editor', () => {
    const body = { ...Object.fromEntries(['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'explanation'].map(key => [key, en[key as keyof typeof en]])), revision: 0,
      translationSource: 'SIVORA_TRANSLATION', sourceReference: 'Prepared here', submitForReview: true };
    expect(saveTranslationSchema.safeParse(body).success).toBe(true);
    for (const field of ['correctOption', 'numericAnswer', 'numericTolerance', 'questionType', 'questionNature', 'reviewed']) expect(saveTranslationSchema.safeParse({ ...body, [field]: 'forged' }).success).toBe(false);
  });
  it('rejects artificial options on numerical wording', () => expect(translationQa('NUMERICAL_VALUE', { ...en, optionA: null, optionB: null, optionC: null, optionD: null }, translated)).toContain('Numerical questions cannot have translated options.'));
  it('validates all twenty proof translations without approving them', () => {
    expect(manifest.records).toHaveLength(20);
    expect(manifest.records.every(row => row.reviewState === 'REVIEW_REQUIRED' && row.translationSource === 'SIVORA_TRANSLATION' && row.qa.mechanical === 'PASS')).toBe(true);
    expect(manifest.records.filter(row => row.language === 'ta')).toHaveLength(10);
    expect(manifest.records.filter(row => row.language === 'hi')).toHaveLength(10);
    expect(protectedTokens('H₂SO₄')).toContain('H₂SO₄');
  });
});
describe('local question preference', () => {
  it('restores Tamil/Hindi and a bounded position without answer/timer state', () => {
    for (const lang of ['ta', 'hi']) expect(parseQuestionPreference(JSON.stringify({ lang, index: 2 }), 5)).toEqual({ lang, index: 2 });
  });
  it.each([null, '{', '{"lang":"es","index":0}', '{"lang":"hi","index":9}', '{"lang":"ta","index":-1}', '{"lang":"en","index":0.5}'])('ignores malformed storage %s', value => expect(parseQuestionPreference(value, 3)).toBeNull());
});
