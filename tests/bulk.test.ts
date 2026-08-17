import { describe, it, expect } from 'vitest';
import { validateRows, questionTextHash, type BulkContext } from '@/lib/admin/bulk';

function makeCtx(overrides: Partial<BulkContext> = {}): BulkContext {
  return {
    subjectIdByCode: new Map([['PHYSICS', 'subj-phy']]),
    chapterIdByKey: new Map([['subj-phy::laws of motion', 'chap-1']]),
    existingHashes: new Set<string>(),
    ...overrides,
  };
}

const baseRow: Record<string, string> = {
  subjectCode: 'PHYSICS',
  chapterName: 'Laws of Motion',
  difficulty: 'EASY',
  questionType: 'SINGLE_CORRECT',
  year: '2021',
  tags: 'units;force',
  correctOption: 'A',
  en_questionText: 'What is the SI unit of force?',
  en_optionA: 'Newton',
  en_optionB: 'Joule',
  en_optionC: 'Pascal',
  en_optionD: 'Watt',
  en_explanation: 'Force is measured in newtons.',
  ta_questionText: '',
  ta_optionA: '',
  ta_optionB: '',
  ta_optionC: '',
  ta_optionD: '',
  ta_explanation: '',
  ta_reviewed: '',
};

describe('validateRows', () => {
  it('accepts a well-formed row and normalises it', () => {
    const [r] = validateRows([{ ...baseRow }], makeCtx());
    expect(r.status).toBe('valid');
    expect(r.data?.subjectId).toBe('subj-phy');
    expect(r.data?.chapterId).toBe('chap-1');
    expect(r.data?.tags).toEqual(['units', 'force']);
    expect(r.data?.year).toBe(2021);
    expect(r.data?.ta).toBeNull();
  });

  it('flags unknown subject and chapter', () => {
    const [r] = validateRows(
      [{ ...baseRow, subjectCode: 'NOPE', chapterName: 'Ghost' }],
      makeCtx(),
    );
    expect(r.status).toBe('error');
    expect(r.errors.join(' ')).toMatch(/Unknown subjectCode/);
  });

  it('requires a valid correct option and English fields', () => {
    const [r] = validateRows([{ ...baseRow, correctOption: 'E', en_optionB: '' }], makeCtx());
    expect(r.status).toBe('error');
    expect(r.errors.some((e) => e.includes('correctOption'))).toBe(true);
    expect(r.errors.some((e) => e.includes('en_optionB'))).toBe(true);
  });

  it('rejects non-single-correct types', () => {
    const [r] = validateRows([{ ...baseRow, questionType: 'IMAGE_BASED' }], makeCtx());
    expect(r.status).toBe('error');
    expect(r.errors.join(' ')).toMatch(/SINGLE_CORRECT/);
  });

  it('detects duplicates against existing questions and within the file', () => {
    const ctx = makeCtx({ existingHashes: new Set([questionTextHash(baseRow.en_questionText)]) });
    const [existing] = validateRows([{ ...baseRow }], ctx);
    expect(existing.errors.join(' ')).toMatch(/Duplicate of an existing/);

    const rows = validateRows([{ ...baseRow }, { ...baseRow }], makeCtx());
    expect(rows[0].status).toBe('valid');
    expect(rows[1].errors.join(' ')).toMatch(/Duplicate of an earlier row/);
  });

  it('requires complete Tamil when any Tamil field is present', () => {
    const [r] = validateRows([{ ...baseRow, ta_questionText: 'கேள்வி' }], makeCtx());
    expect(r.status).toBe('error');
    expect(r.errors.join(' ')).toMatch(/Tamil translation is incomplete/);
  });

  it('accepts a complete Tamil translation and reviewed flag', () => {
    const [r] = validateRows(
      [
        {
          ...baseRow,
          ta_questionText: 'விசையின் SI அலகு எது?',
          ta_optionA: 'நியூட்டன்',
          ta_optionB: 'ஜூல்',
          ta_optionC: 'பாஸ்கல்',
          ta_optionD: 'வாட்',
          ta_reviewed: 'true',
        },
      ],
      makeCtx(),
    );
    expect(r.status).toBe('valid');
    expect(r.data?.ta?.reviewed).toBe(true);
  });
});
