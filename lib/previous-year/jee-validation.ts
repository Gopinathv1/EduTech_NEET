import { QUESTION_BANK_V1_TAXONOMY } from '@/lib/question-bank/taxonomy';

export type JeePaperIdentity = {
  exam: 'JEE_MAIN'; paper: 'PAPER_1'; year: number; session: number;
  examDate: string; shift: 1 | 2; regionVariant: 'UNSPECIFIED' | 'DOMESTIC' | 'INTERNATIONAL';
};

export type JeeKeyQuestion = { questionId: string; rawAnswer: string };
export type JeeAnswerEvidence = {
  paper: JeePaperIdentity; questionId: string; questionType: 'SINGLE_CORRECT' | 'NUMERICAL_VALUE';
  /** Exact IDs in displayed A/B/C/D order. Never derive these from arithmetic. */
  optionIds?: string[];
  /** NTA's 2022 index/letter keys require a source with labelled A/B/C/D options. */
  labelledOptions?: boolean;
};

export type JeeAnswerValidation =
  | { valid: true; correctOption: 'A' | 'B' | 'C' | 'D'; numericAnswer?: never }
  | { valid: true; numericAnswer: number; correctOption?: never }
  | { valid: false; reason: 'MISSING_EXACT_KEY' | 'DROPPED_BY_NTA' | 'MULTIPLE_ACCEPTED_ANSWERS' | 'UNSUPPORTED_KEY_SEMANTICS' | 'OPTION_ID_MAPPING_UNCERTAIN' };

export function jeePaperId(paper: JeePaperIdentity) {
  if (paper.exam !== 'JEE_MAIN' || paper.paper !== 'PAPER_1'
    || ![2021, 2022, 2023, 2024, 2025].includes(paper.year)
    || !Number.isInteger(paper.session) || paper.session < 1 || paper.session > (paper.year === 2021 ? 4 : 2)
    || !/^\d{4}-\d{2}-\d{2}$/.test(paper.examDate) || Number(paper.examDate.slice(0, 4)) !== paper.year
    || new Date(`${paper.examDate}T00:00:00Z`).toISOString().slice(0, 10) !== paper.examDate
    || ![1, 2].includes(paper.shift)
    || !['UNSPECIFIED', 'DOMESTIC', 'INTERNATIONAL'].includes(paper.regionVariant)) {
    throw new Error('Invalid JEE Paper-1 historical identity.');
  }
  return `jee-main-${paper.year}-s${paper.session}-${paper.examDate}-shift-${paper.shift}${paper.regionVariant === 'INTERNATIONAL' ? '-international' : ''}`;
}

export function jeeExternalId(paper: JeePaperIdentity, originalQuestionNumber: number | null, questionId: string) {
  const paperId = jeePaperId(paper);
  if (!/^\d+$/.test(questionId)) {
    throw new Error('Exact NTA question identifier is required.');
  }
  // Some 2022 response-paper archives print NTA IDs without question numbers.
  // Preserve the missing number instead of turning source order into evidence.
  if (originalQuestionNumber === null && paper.year === 2022) {
    return `${paperId}-nta-${questionId}`;
  }
  if (originalQuestionNumber === null || !Number.isInteger(originalQuestionNumber) || originalQuestionNumber < 1) {
    throw new Error('Exact source question number and NTA identifier are required.');
  }
  return `${paperId}-q${originalQuestionNumber}-nta-${questionId}`;
}

/** Keys must already be scoped to one exact year/session/date/shift/variant. */
export function validateJeeAnswer(evidence: JeeAnswerEvidence, keys: readonly JeeKeyQuestion[]): JeeAnswerValidation {
  jeePaperId(evidence.paper);
  const matches = keys.filter(key => key.questionId === evidence.questionId);
  if (matches.length !== 1) return { valid: false, reason: 'MISSING_EXACT_KEY' };
  const raw = matches[0].rawAnswer.trim();
  if (/^drop(?:ped)?$/i.test(raw) || (raw === 'D' && evidence.paper.year !== 2022)) return { valid: false, reason: 'DROPPED_BY_NTA' };
  if (/\bor\b|[,&]/i.test(raw)) return { valid: false, reason: 'MULTIPLE_ACCEPTED_ANSWERS' };
  if (evidence.questionType === 'NUMERICAL_VALUE') {
    if (!/^-?\d+(?:\.\d+)?$/.test(raw) || !Number.isFinite(Number(raw))) return { valid: false, reason: 'UNSUPPORTED_KEY_SEMANTICS' };
    return { valid: true, numericAnswer: Number(raw) };
  }
  if (evidence.paper.year === 2022) {
    if (!evidence.labelledOptions) return { valid: false, reason: 'OPTION_ID_MAPPING_UNCERTAIN' };
    const index = /^[A-D]$/.test(raw) ? 'ABCD'.indexOf(raw) : /^[1-4]$/.test(raw) ? Number(raw) - 1 : -1;
    return index >= 0 ? { valid: true, correctOption: 'ABCD'[index] as 'A' | 'B' | 'C' | 'D' }
      : { valid: false, reason: 'UNSUPPORTED_KEY_SEMANTICS' };
  }
  if (!/^\d+$/.test(raw)) return { valid: false, reason: 'UNSUPPORTED_KEY_SEMANTICS' };
  const ids = evidence.optionIds ?? [];
  if (ids.length !== 4 || new Set(ids).size !== 4 || ids.some(id => !/^\d+$/.test(id)) || !ids.includes(raw)) {
    return { valid: false, reason: 'OPTION_ID_MAPPING_UNCERTAIN' };
  }
  return { valid: true, correctOption: 'ABCD'[ids.indexOf(raw)] as 'A' | 'B' | 'C' | 'D' };
}

export function isCanonicalJeeChapter(subjectCode: string, chapterSlug: string) {
  return QUESTION_BANK_V1_TAXONOMY.some(unit => unit.exam === 'JEE' && unit.subjectCode === subjectCode && unit.unitSlug === chapterSlug);
}

/** Historical identity, never similar wording, is the duplicate boundary. */
export function assertUniqueJeeQuestions(rows: readonly { externalId: string; paperId: string; questionId: string }[]) {
  const externalIds = new Set<string>();
  const sourceIds = new Set<string>();
  for (const row of rows) {
    const sourceId = `${row.paperId}:${row.questionId}`;
    if (externalIds.has(row.externalId) || sourceIds.has(sourceId)) throw new Error('Duplicate exact JEE source identity.');
    externalIds.add(row.externalId); sourceIds.add(sourceId);
  }
}
