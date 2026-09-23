import { questionTextHash } from '@/lib/admin/bulk';
import { isAllowedOfficialSource } from './official-sources';

export type BankQuestion = {
  externalId: string;
  exam: string;
  subjectCode: string;
  chapterSlug: string;
  topic: string;
  difficulty: string;
  questionType: string;
  questionText: string;
  options: readonly string[];
  correctOption: string;
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
    if (!['NEET', 'JEE'].includes(question.exam)) add('unsupported_exam', 'exam must be NEET or JEE');
    if (!question.subjectCode) add('missing_subject', 'subjectCode is required');
    if (!question.chapterSlug) add('missing_chapter', 'chapterSlug is required');
    if (!question.topic) add('missing_topic', 'topic is required');
    if (!question.questionText.trim()) add('missing_question', 'questionText is required');
    if (question.options.length !== 4 || question.options.some((option) => !option.trim())) add('malformed_options', 'Exactly four non-empty options are required');
    if (new Set(question.options.map((option) => option.trim().toLowerCase())).size !== question.options.length) add('duplicate_options', 'Options must be distinct');
    if (!['A', 'B', 'C', 'D'].includes(question.correctOption)) add('invalid_answer', 'correctOption must be A, B, C, or D');
    const hash = questionTextHash(question.questionText);
    if (hashes.has(hash)) add('duplicate_question', 'Normalized question text is duplicated');
    hashes.add(hash);
    if (!question.sourceName) add('missing_provenance', 'sourceName is required');
    if (question.sourceType === 'OFFICIAL_NTA') {
      if (!question.sourceUrl || !isAllowedOfficialSource(question.sourceUrl)) add('invalid_official_source', 'Official NTA content requires an allowlisted source URL');
      if (!question.examYear || !question.paperSession) add('incomplete_official_identity', 'Official content requires year and session/paper identity');
    }
    if (question.sourceType === 'SIVORA_AUTHORED' && /^official|nta|government/i.test(question.sourceName)) add('misleading_source', 'SIVORA content cannot be represented as official');
    if (question.contentClass === 'PRODUCTION' || question.status === 'PUBLISHED') {
      if (!question.reviewer || !question.reviewedAt) add('incomplete_review', 'Published production content requires reviewer and reviewedAt');
    }
  }
  return issues;
}
