import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { assertAllowedOfficialSource } from '../lib/question-bank/official-sources';
import { validateQuestionBank, type BankQuestion } from '../lib/question-bank/validator';

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--write') || args.includes('--import')) throw new Error('V1 official ingestion is review-only; database writes are intentionally unavailable.');
  const sourceIndex = args.indexOf('--source');
  const fileIndex = args.indexOf('--file');
  if (sourceIndex < 0 || fileIndex < 0 || !args[sourceIndex + 1] || !args[fileIndex + 1]) {
    throw new Error('Usage: npm run questions:import-official -- --source <official-url> --file <review-json>');
  }
  const sourceUrl = assertAllowedOfficialSource(args[sourceIndex + 1]).toString();
  const file = path.resolve(process.cwd(), args[fileIndex + 1]);
  const questions = JSON.parse(await readFile(file, 'utf8')) as BankQuestion[];
  const issues = validateQuestionBank(questions);
  for (const question of questions) {
    if (question.sourceType !== 'OFFICIAL_NTA') issues.push({ externalId: question.externalId, code: 'wrong_source_type', message: 'Official ingestion accepts OFFICIAL_NTA only' });
    if (question.sourceUrl !== sourceUrl) issues.push({ externalId: question.externalId, code: 'source_mismatch', message: 'Question sourceUrl must match --source' });
    if (question.status !== 'DRAFT' || question.contentClass !== 'SAMPLE') issues.push({ externalId: question.externalId, code: 'unsafe_initial_state', message: 'Official imports must enter DRAFT/SAMPLE review state' });
  }
  if (issues.length) {
    for (const issue of issues) console.error(`${issue.externalId} [${issue.code}] ${issue.message}`);
    process.exitCode = 1;
  } else {
    console.log(`OFFICIAL IMPORT REVIEW PASSED: ${questions.length} questions. No database write was performed.`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
