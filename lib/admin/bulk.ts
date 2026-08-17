import { createHash } from 'node:crypto';

export { BULK_COLUMNS, csvTemplate } from './bulk-columns';

/**
 * Bulk question import — normalisation, dedupe hashing, and a PURE row validator
 * (no DB access, so it's unit-testable). The API route builds the lookup context
 * from the database and commits valid rows in a transaction.
 *
 * Bulk import supports SINGLE_CORRECT text questions only. Image-based and
 * assertion-reason questions are created via the form.
 */

/** Collapse whitespace + lowercase, for hashing/dedupe and name lookups. */
export function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Stable dedupe key for a question's English text. */
export function questionTextHash(englishText: string): string {
  return createHash('sha256').update(normalizeText(englishText)).digest('hex');
}

export type BulkContext = {
  subjectIdByCode: Map<string, string>;
  // key: `${subjectId}::${normalizeText(chapterNameEn)}`
  chapterIdByKey: Map<string, string>;
  existingHashes: Set<string>;
};

export type NormalizedQuestion = {
  subjectId: string;
  chapterId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionType: 'SINGLE_CORRECT';
  year: number | null;
  tags: string[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  textHash: string;
  en: {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    explanation: string;
  };
  ta:
    | {
        questionText: string;
        optionA: string;
        optionB: string;
        optionC: string;
        optionD: string;
        explanation: string;
        reviewed: boolean;
      }
    | null;
};

export type BulkRowResult = {
  line: number; // 1-based CSV data row number (header excluded)
  status: 'valid' | 'error';
  errors: string[];
  preview: string;
  data?: NormalizedQuestion;
};

const DIFFICULTIES = new Set(['EASY', 'MEDIUM', 'HARD']);
const OPTIONS = new Set(['A', 'B', 'C', 'D']);
const TRUEISH = new Set(['true', '1', 'yes', 'y']);

function get(row: Record<string, string>, key: string): string {
  return (row[key] ?? '').trim();
}

/**
 * Validate parsed CSV rows against the lookup context. Returns one result per
 * row; valid rows carry a normalised `data` payload ready to insert. Duplicate
 * detection covers both existing DB rows and repeats within the same file.
 */
export function validateRows(
  rows: Record<string, string>[],
  ctx: BulkContext,
): BulkRowResult[] {
  const seenHashes = new Set<string>();
  const results: BulkRowResult[] = [];

  rows.forEach((row, i) => {
    const errors: string[] = [];
    const line = i + 1;
    const enText = get(row, 'en_questionText');
    const preview = enText.length > 80 ? `${enText.slice(0, 80)}…` : enText || '(empty)';

    // Subject
    const subjectCode = get(row, 'subjectCode').toUpperCase();
    const subjectId = ctx.subjectIdByCode.get(subjectCode);
    if (!subjectCode) errors.push('subjectCode is required');
    else if (!subjectId) errors.push(`Unknown subjectCode "${subjectCode}"`);

    // Chapter (by English name within the subject)
    const chapterName = get(row, 'chapterName');
    let chapterId: string | undefined;
    if (!chapterName) {
      errors.push('chapterName is required');
    } else if (subjectId) {
      chapterId = ctx.chapterIdByKey.get(`${subjectId}::${normalizeText(chapterName)}`);
      if (!chapterId) errors.push(`Chapter "${chapterName}" not found in ${subjectCode}`);
    }

    // Difficulty
    let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';
    const rawDiff = get(row, 'difficulty').toUpperCase();
    if (rawDiff) {
      if (!DIFFICULTIES.has(rawDiff)) errors.push(`Invalid difficulty "${rawDiff}"`);
      else difficulty = rawDiff as 'EASY' | 'MEDIUM' | 'HARD';
    }

    // Question type (bulk supports SINGLE_CORRECT only)
    const rawType = get(row, 'questionType').toUpperCase() || 'SINGLE_CORRECT';
    if (rawType !== 'SINGLE_CORRECT') {
      errors.push('Bulk upload supports SINGLE_CORRECT questions only');
    }

    // Year
    let year: number | null = null;
    const rawYear = get(row, 'year');
    if (rawYear) {
      const n = Number(rawYear);
      if (!Number.isInteger(n) || n < 1990 || n > 2100) errors.push(`Invalid year "${rawYear}"`);
      else year = n;
    }

    // Correct option
    const correctOption = get(row, 'correctOption').toUpperCase();
    if (!correctOption) errors.push('correctOption is required');
    else if (!OPTIONS.has(correctOption)) errors.push(`correctOption must be A/B/C/D (got "${correctOption}")`);

    // English content (all required)
    const en = {
      questionText: enText,
      optionA: get(row, 'en_optionA'),
      optionB: get(row, 'en_optionB'),
      optionC: get(row, 'en_optionC'),
      optionD: get(row, 'en_optionD'),
      explanation: get(row, 'en_explanation'),
    };
    for (const [field, val] of [
      ['en_questionText', en.questionText],
      ['en_optionA', en.optionA],
      ['en_optionB', en.optionB],
      ['en_optionC', en.optionC],
      ['en_optionD', en.optionD],
    ] as const) {
      if (!val) errors.push(`${field} is required`);
    }

    // Tamil content (optional; if any present, all core fields required)
    const taFields = {
      questionText: get(row, 'ta_questionText'),
      optionA: get(row, 'ta_optionA'),
      optionB: get(row, 'ta_optionB'),
      optionC: get(row, 'ta_optionC'),
      optionD: get(row, 'ta_optionD'),
      explanation: get(row, 'ta_explanation'),
    };
    const taCore = [taFields.questionText, taFields.optionA, taFields.optionB, taFields.optionC, taFields.optionD];
    const taAny = taCore.some((s) => s.length > 0);
    const taAll = taCore.every((s) => s.length > 0);
    const reviewed = TRUEISH.has(get(row, 'ta_reviewed').toLowerCase());
    if (taAny && !taAll) errors.push('Tamil translation is incomplete (fill all Tamil fields or none)');
    if (reviewed && !taAll) errors.push('ta_reviewed can only be true for a complete Tamil translation');

    // Dedupe
    let textHash = '';
    if (en.questionText) {
      textHash = questionTextHash(en.questionText);
      if (ctx.existingHashes.has(textHash)) errors.push('Duplicate of an existing question');
      else if (seenHashes.has(textHash)) errors.push('Duplicate of an earlier row in this file');
    }

    if (errors.length > 0 || !subjectId || !chapterId) {
      results.push({ line, status: 'error', errors, preview });
      return;
    }

    seenHashes.add(textHash);
    results.push({
      line,
      status: 'valid',
      errors: [],
      preview,
      data: {
        subjectId,
        chapterId,
        difficulty,
        questionType: 'SINGLE_CORRECT',
        year,
        tags: get(row, 'tags')
          .split(';')
          .map((t) => t.trim())
          .filter(Boolean),
        correctOption: correctOption as 'A' | 'B' | 'C' | 'D',
        textHash,
        en,
        ta: taAll
          ? { ...taFields, reviewed }
          : null,
      },
    });
  });

  return results;
}
