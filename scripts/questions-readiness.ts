import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { evaluateFullMockReadiness, readinessCounts, type EligibleQuestionRecord } from '../lib/question-bank/readiness';
import type { BankQuestion } from '../lib/question-bank/validator';

async function main() {
  const file = path.resolve(process.cwd(), process.argv[2] ?? 'data/question-bank/sivora-neet-pilot-v1.json');
  const questions = JSON.parse(await readFile(file, 'utf8')) as BankQuestion[];
  const records: EligibleQuestionRecord[] = questions.map((question) => ({
    id: question.externalId,
    exam: question.exam as 'NEET' | 'JEE',
    subjectCode: question.subjectCode,
    chapterSlug: question.chapterSlug,
    topic: question.topic,
    year: question.examYear,
    sourceType: question.sourceType,
    questionType: question.questionType as EligibleQuestionRecord['questionType'],
    reviewState: question.reviewer && question.reviewedAt ? 'APPROVED' : question.status === 'DRAFT' ? 'DRAFT' : 'REVIEW_REQUIRED',
    eligible: question.status === 'PUBLISHED' && question.contentClass === 'PRODUCTION' && Boolean(question.reviewer && question.reviewedAt),
  }));
  console.log(JSON.stringify({
    counts: readinessCounts(records),
    fullMocks: {
      NEET: evaluateFullMockReadiness(records, 'NEET'),
      JEE: evaluateFullMockReadiness(records, 'JEE'),
    },
  }, null, 2));
  console.log('Draft/review content is intentionally excluded from readiness counts.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
