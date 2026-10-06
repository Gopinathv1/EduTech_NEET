import { describe, expect, it } from 'vitest';
import { assertUniqueJeeQuestions, isCanonicalJeeChapter, jeeExternalId, jeePaperId, validateJeeAnswer, type JeePaperIdentity } from '@/lib/previous-year/jee-validation';

const paper: JeePaperIdentity = { exam: 'JEE_MAIN', paper: 'PAPER_1', year: 2025, session: 1, examDate: '2025-01-22', shift: 1, regionVariant: 'DOMESTIC' };

describe('exact JEE historical identity and final-key mapping', () => {
  it('keeps sessions, shifts, dates and international variants separate', () => {
    const id = jeeExternalId(paper, 1, '65644594');
    expect(id).toBe('jee-main-2025-s1-2025-01-22-shift-1-q1-nta-65644594');
    expect(jeeExternalId({ ...paper, shift: 2 }, 1, '65644594')).not.toBe(id);
    expect(jeeExternalId({ ...paper, regionVariant: 'INTERNATIONAL' }, 1, '65644594')).not.toBe(id);
    expect(() => jeePaperId({ ...paper, examDate: '2025-02-30' })).toThrow();
    expect(() => jeeExternalId(paper, 0, '65644594')).toThrow();
  });

  it('uses actual shuffled option IDs, never their numerical order', () => {
    expect(validateJeeAnswer({ paper, questionId: '65644594', questionType: 'SINGLE_CORRECT', optionIds: ['656445331', '656445330', '656445328', '656445329'] }, [{ questionId: '65644594', rawAnswer: '656445331' }])).toEqual({ valid: true, correctOption: 'A' });
    expect(validateJeeAnswer({ paper, questionId: '65644594', questionType: 'SINGLE_CORRECT' }, [{ questionId: '65644594', rawAnswer: '656445331' }])).toEqual({ valid: false, reason: 'OPTION_ID_MAPPING_UNCERTAIN' });
  });

  it('preserves an absent 2022 printed number with exact NTA identity', () => {
    const unnumberedPaper = { ...paper, year: 2022, session: 2, examDate: '2022-07-25', regionVariant: 'UNSPECIFIED' as const };
    expect(jeeExternalId(unnumberedPaper, null, '100001')).toBe('jee-main-2022-s2-2022-07-25-shift-1-nta-100001');
    expect(() => jeeExternalId(paper, null, '100001')).toThrow();
    expect(() => jeeExternalId(unnumberedPaper, null, 'unknown')).toThrow();
    expect(jeeExternalId({ ...unnumberedPaper, shift: 2 }, null, '100001')).not.toBe(jeeExternalId(unnumberedPaper, null, '100001'));
  });

  it('requires one matching question ID in the applicable key', () => {
    const evidence = { paper, questionId: '1', questionType: 'NUMERICAL_VALUE' as const };
    expect(validateJeeAnswer(evidence, [{ questionId: '2', rawAnswer: '34' }]).valid).toBe(false);
    expect(validateJeeAnswer(evidence, [{ questionId: '1', rawAnswer: '34' }, { questionId: '1', rawAnswer: '34' }]).valid).toBe(false);
  });

  it('retains numerical answers including zero without synthesizing MCQs', () => {
    expect(validateJeeAnswer({ paper, questionId: '1', questionType: 'NUMERICAL_VALUE' }, [{ questionId: '1', rawAnswer: '0' }])).toEqual({ valid: true, numericAnswer: 0 });
    expect(validateJeeAnswer({ paper, questionId: '1', questionType: 'NUMERICAL_VALUE' }, [{ questionId: '1', rawAnswer: '-2.5' }])).toEqual({ valid: true, numericAnswer: -2.5 });
  });

  it('quarantines drops, multiple accepted values and unsupported annotations', () => {
    for (const rawAnswer of ['Drop', '4 or 16 or 64', '123,124', '123 (for all medium) & 125 (Hindi)']) {
      expect(validateJeeAnswer({ paper, questionId: '1', questionType: 'NUMERICAL_VALUE' }, [{ questionId: '1', rawAnswer }]).valid).toBe(false);
    }
    expect(validateJeeAnswer({ paper, questionId: '1', questionType: 'NUMERICAL_VALUE' }, [{ questionId: '1', rawAnswer: '1 to 2' }])).toEqual({ valid: false, reason: 'UNSUPPORTED_KEY_SEMANTICS' });
  });

  it('handles NTA 2022 letter/index keys only with labelled source options', () => {
    const p = { ...paper, year: 2022, examDate: '2022-07-25' };
    expect(validateJeeAnswer({ paper: p, questionId: '100001', questionType: 'SINGLE_CORRECT', labelledOptions: true }, [{ questionId: '100001', rawAnswer: 'D' }])).toEqual({ valid: true, correctOption: 'D' });
    expect(validateJeeAnswer({ paper: p, questionId: '100001', questionType: 'SINGLE_CORRECT', labelledOptions: true }, [{ questionId: '100001', rawAnswer: '3' }])).toEqual({ valid: true, correctOption: 'C' });
    expect(validateJeeAnswer({ paper: p, questionId: '100001', questionType: 'SINGLE_CORRECT' }, [{ questionId: '100001', rawAnswer: '3' }]).valid).toBe(false);
  });

  it('allows identical wording across shifts but rejects an exact source duplicate', () => {
    expect(() => assertUniqueJeeQuestions([{ externalId: 'a', paperId: 'shift1', questionId: '1' }, { externalId: 'b', paperId: 'shift2', questionId: '1' }])).not.toThrow();
    expect(() => assertUniqueJeeQuestions([{ externalId: 'a', paperId: 'shift1', questionId: '1' }, { externalId: 'b', paperId: 'shift1', questionId: '1' }])).toThrow();
  });

  it('uses the existing canonical JEE taxonomy without altering NEET', () => {
    expect(isCanonicalJeeChapter('JEE_MATHEMATICS', 'jee-mathematics-sequence-series')).toBe(true);
    expect(isCanonicalJeeChapter('PHYSICS', 'physics-kinematics')).toBe(false);
    expect(isCanonicalJeeChapter('JEE_MATHEMATICS', 'invented-chapter')).toBe(false);
  });
});
