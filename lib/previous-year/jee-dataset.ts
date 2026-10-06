import { QUESTION_BANK_V1_TAXONOMY } from '@/lib/question-bank/taxonomy';
import { assertUniqueJeeQuestions, jeeExternalId, jeePaperId, validateJeeAnswer, type JeeKeyQuestion, type JeePaperIdentity } from './jee-validation';

export type JeeInventoryEntry = JeePaperIdentity & {
  id: string;
  expectedQuestionCount: number;
  questionPaperSource: { publisher: string; url: string }[];
  finalAnswerKeySource: { url: string; page: number; sha256: string };
};

export type JeeHistoricalQuestion = JeePaperIdentity & {
  externalId: string;
  paperId: string;
  questionId: string;
  originalQuestionNumber: number | null;
  /** Position in this source document; never substituted for a missing printed number. */
  sourceOrder: number;
  questionType: 'SINGLE_CORRECT' | 'NUMERICAL_VALUE';
  questionNature: 'CONCEPTUAL_THEORY' | 'NUMERICAL_PROBLEM_SOLVING';
  natureReason: string;
  questionText: string;
  options?: [string, string, string, string];
  correctOption?: 'A' | 'B' | 'C' | 'D';
  numericAnswer?: number;
  subjectCode: 'JEE_PHYSICS' | 'JEE_CHEMISTRY' | 'JEE_MATHEMATICS';
  chapterSlug: string;
  topic: string | null;
  chapterClassification: 'SIVORA_CLASSIFICATION';
  subjectAuthority: 'SOURCE_PAPER_SECTION';
  explanation: string;
  difficulty: 'MEDIUM';
  sourceType: 'HISTORICAL_VERIFIED';
  sourceUrl: string;
  sourceName: string;
  officialAnswerKeyReference: string;
  examYear: number;
  paperSession: string;
  validationState: 'VALIDATED';
  source: {
    wordingArchiveUrl: string;
    paperSha256: string;
    officialFinalAnswerKeyUrl: string;
    answerKeySha256: string;
    answerKeyPage: number;
    sourcePage: number;
  };
  answerValidation: {
    authority: 'OFFICIAL_NTA_FINAL';
    questionId: string;
    rawAnswer: string;
    optionIds: string[];
    labelledOptions: boolean;
  };
  sourceReview: Record<string, unknown>;
  representationNote?: string;
};

export type JeeQuarantineRecord = {
  paperId: string;
  questionId: string;
  reason: string;
  detail: string;
};

/** Validate source identity, actual key semantics, taxonomy and retained/quarantine separation. */
export function assertValidJeeDataset(
  questions: readonly JeeHistoricalQuestion[],
  inventory: readonly JeeInventoryEntry[],
  keyEntries: readonly { paperId: string; questions: readonly JeeKeyQuestion[] }[],
  quarantine: readonly JeeQuarantineRecord[],
) {
  assertUniqueJeeQuestions(questions);
  const papers = new Map(inventory.map(entry => [entry.id, entry]));
  const keys = new Map(keyEntries.map(entry => [entry.paperId, entry.questions]));
  const excluded = new Set(quarantine.map(row => `${row.paperId}:${row.questionId}`));
  if (excluded.size !== quarantine.length) throw new Error('Duplicate JEE quarantine identity.');
  const positions = new Set<string>();
  for (const question of questions) {
    const fail = (reason: string): never => { throw new Error(`${question.externalId}: ${reason}`); };
    const paper = papers.get(question.paperId);
    if (!paper || question.paperId !== jeePaperId(question) || jeePaperId(paper) !== question.paperId) fail('Unlisted historical paper identity.');
    if (question.regionVariant !== paper!.regionVariant) fail('Region variant differs from the applicable paper.');
    if (question.externalId !== jeeExternalId(question, question.originalQuestionNumber, question.questionId)) fail('Noncanonical external ID.');
    if (excluded.has(`${question.paperId}:${question.questionId}`)) fail('Quarantined question cannot be retained.');
    if (!Number.isInteger(question.sourceOrder) || question.sourceOrder < 1 || question.sourceOrder > paper!.expectedQuestionCount) fail('Invalid source order.');
    const position = `${question.paperId}:${question.sourceOrder}`;
    if (positions.has(position)) fail('Duplicate source position within the same historical paper.');
    positions.add(position);
    if (question.originalQuestionNumber !== null && question.originalQuestionNumber > paper!.expectedQuestionCount) fail('Invalid printed question number.');
    if (question.examYear !== question.year || !question.paperSession.trim()) fail('Missing persisted historical identity.');
    if (question.sourceType !== 'HISTORICAL_VERIFIED' || question.validationState !== 'VALIDATED'
      || question.subjectAuthority !== 'SOURCE_PAPER_SECTION' || question.chapterClassification !== 'SIVORA_CLASSIFICATION') fail('Invalid validation/provenance attribution.');
    if (!paper!.questionPaperSource.some(source => source.url === question.sourceUrl)
      || question.source.wordingArchiveUrl !== question.sourceUrl
      || question.officialAnswerKeyReference !== paper!.finalAnswerKeySource.url
      || question.source.officialFinalAnswerKeyUrl !== question.officialAnswerKeyReference
      || question.source.answerKeySha256 !== paper!.finalAnswerKeySource.sha256
      || question.source.answerKeyPage !== paper!.finalAnswerKeySource.page
      || !/^[a-f0-9]{64}$/.test(question.source.paperSha256)
      || !Number.isInteger(question.source.sourcePage) || question.source.sourcePage < 1) fail('Source evidence does not match acquisition manifest.');
    const taxonomy = QUESTION_BANK_V1_TAXONOMY.find(unit => unit.exam === 'JEE'
      && unit.subjectCode === question.subjectCode && unit.unitSlug === question.chapterSlug);
    if (!taxonomy || (question.topic !== null && !taxonomy.topicSlugs.includes(question.topic))) fail('Unsupported canonical taxonomy.');
    if (!['CONCEPTUAL_THEORY', 'NUMERICAL_PROBLEM_SOLVING'].includes(question.questionNature)
      || !question.natureReason?.trim() || !question.questionText?.trim() || !question.explanation?.trim()
      || !question.sourceReview?.method) fail('Missing reviewed content/nature evidence.');
    const answerEvidence = question.answerValidation;
    if (answerEvidence.authority !== 'OFFICIAL_NTA_FINAL' || answerEvidence.questionId !== question.questionId) fail('Wrong answer authority/identity.');
    const exactKeys = keys.get(question.paperId) ?? [];
    if (exactKeys.filter(key => key.questionId === question.questionId && key.rawAnswer === answerEvidence.rawAnswer).length !== 1) fail('Raw answer differs from applicable final key.');
    const answer = validateJeeAnswer({ paper: question, questionId: question.questionId,
      questionType: question.questionType, optionIds: answerEvidence.optionIds, labelledOptions: answerEvidence.labelledOptions }, exactKeys);
    if (!answer.valid) throw new Error(`${question.externalId}: Unsafe answer mapping: ${answer.reason}.`);
    if (question.questionType === 'SINGLE_CORRECT') {
      if (!question.options || question.options.length !== 4 || question.options.some(option => typeof option !== 'string' || !option.trim())
        || question.correctOption !== answer.correctOption || question.numericAnswer !== undefined) fail('Invalid MCQ representation.');
    } else if (question.questionType === 'NUMERICAL_VALUE') {
      if (!Number.isFinite(question.numericAnswer) || question.numericAnswer !== answer.numericAnswer
        || question.options !== undefined || question.correctOption !== undefined) fail('Invalid numerical-value representation.');
    } else fail('Unsupported question type.');
  }
}
