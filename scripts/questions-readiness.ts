import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { readinessCounts, type EligibleQuestionRecord } from '../lib/question-bank/readiness';
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
    eligible: question.status === 'PUBLISHED' && question.contentClass === 'PRODUCTION' && Boolean(question.reviewer && question.reviewedAt),
  }));
  console.log(JSON.stringify(readinessCounts(records), null, 2));
  console.log('Draft/review content is intentionally excluded from readiness counts.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
