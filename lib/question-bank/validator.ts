import { questionTextHash } from '@/lib/admin/bulk';
import { isAllowedOfficialSource } from './official-sources';
import { sivoraExternalId } from './identity';
import { QUESTION_BANK_V1_TAXONOMY } from './taxonomy';

export type BankQuestion = {
  externalId: string;
  identityKey?: string;
  exam: string;
  subjectCode: string;
  chapterSlug: string;
  topic: string;
  difficulty: string;
  questionType: string;
  questionText: string;
  options?: readonly string[];
  correctOption?: string;
  numericAnswer?: number;
  numericTolerance?: number;
  explanation?: string;
  sourceType: string;
  sourceName: string;
  sourceUrl?: string;
  examYear?: number;
  paperSession?: string;
  reviewer?: string;
  reviewedAt?: string;
  status: string;
  contentClass: string;
  reviewState?: string;
};

export type ValidationIssue = { externalId: string; code: string; message: string };

export function validateQuestionBank(questions: readonly BankQuestion[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const hashes = new Set<string>();
  for (const question of questions) {
    const add = (code: string, message: string) => issues.push({ externalId: question.externalId || '(missing)', code, message });
    if (!question.externalId) add('missing_external_id', 'Deterministic externalId is required');
    else if (ids.has(question.externalId)) add('duplicate_external_id', 'externalId is duplicated');
    ids.add(question.externalId);
    if (question.identityKey && question.externalId !== sivoraExternalId(question.identityKey)) add('invalid_external_id', 'externalId does not match its deterministic identityKey');
    if (!['NEET', 'JEE'].includes(question.exam)) add('unsupported_exam', 'exam must be NEET or JEE');
    if (!question.subjectCode) add('missing_subject', 'subjectCode is required');
    if (!question.chapterSlug) add('missing_chapter', 'chapterSlug is required');
    if (!question.topic) add('missing_topic', 'topic is required');
    const taxonomy = QUESTION_BANK_V1_TAXONOMY.find((entry) => entry.exam === question.exam && entry.subjectCode === question.subjectCode && entry.unitSlug === question.chapterSlug);
    if (!taxonomy || !taxonomy.topicSlugs.includes(question.topic)) add('unsupported_taxonomy', 'subject, chapter, and topic must exist in the canonical taxonomy');
    if (!question.questionText.trim()) add('missing_question', 'questionText is required');
    if (!['SINGLE_CORRECT', 'IMAGE_BASED', 'ASSERTION_REASON', 'NUMERICAL_VALUE'].includes(question.questionType)) add('invalid_question_type', 'Unsupported question type');
    if (question.questionType === 'NUMERICAL_VALUE') {
      if (question.correctOption) add('numerical_fake_mcq', 'Numerical questions must not have a correctOption');
      if (question.options?.some((option) => option.trim())) add('numerical_fake_mcq', 'Numerical questions must not use answer options');
      if (question.numericAnswer === undefined || !Number.isFinite(question.numericAnswer)) add('invalid_numeric_answer', 'A finite numericAnswer is required');
      if (question.numericTolerance !== undefined && (!Number.isFinite(question.numericTolerance) || question.numericTolerance < 0)) add('invalid_numeric_tolerance', 'numericTolerance must be finite and non-negative');
    } else {
      const options = question.options ?? [];
      if (options.length !== 4 || options.some((option) => !option.trim())) add('malformed_options', 'Exactly four non-empty options are required');
      if (new Set(options.map((option) => option.trim().toLowerCase())).size !== options.length) add('duplicate_options', 'Options must be distinct');
      if (!question.correctOption || !['A', 'B', 'C', 'D'].includes(question.correctOption)) add('invalid_answer', 'correctOption must be A, B, C, or D');
      if (question.numericAnswer !== undefined) add('mcq_numeric_answer', 'MCQ questions must not have numericAnswer');
    }
    const hash = questionTextHash(question.questionText);
    if (hashes.has(hash)) add('duplicate_question', 'Normalized question text is duplicated');
    hashes.add(hash);
    if (!question.sourceName) add('missing_provenance', 'sourceName is required');
    if (question.sourceType === 'OFFICIAL_NTA') {
      if (!question.sourceUrl || !isAllowedOfficialSource(question.sourceUrl)) add('invalid_official_source', 'Official NTA content requires an allowlisted source URL');
      if (!question.examYear || !question.paperSession) add('incomplete_official_identity', 'Official content requires year and session/paper identity');
    }
    if (question.sourceType === 'SIVORA_AUTHORED' && /^official|nta|government/i.test(question.sourceName)) add('misleading_source', 'SIVORA content cannot be represented as official');
    if (question.reviewState && !['DRAFT', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'NEEDS_CORRECTION'].includes(question.reviewState)) add('invalid_review_state', 'Unsupported reviewState');
    if (question.status === 'PUBLISHED') {
      if (!question.reviewer || !question.reviewedAt) add('incomplete_review', 'Published production content requires reviewer and reviewedAt');
    }
  }
  return issues;
}
