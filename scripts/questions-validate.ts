import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { validateTaxonomy } from '../lib/question-bank/taxonomy';
import { validateQuestionBank, type BankQuestion } from '../lib/question-bank/validator';

async function main() {
  const file = path.resolve(process.cwd(), process.argv[2] ?? 'data/question-bank/sivora-neet-pilot-v1.json');
  const questions = JSON.parse(await readFile(file, 'utf8')) as BankQuestion[];
  const issues = [...validateTaxonomy().map((message) => ({ externalId: 'taxonomy', code: 'invalid_taxonomy', message })), ...validateQuestionBank(questions)];
  console.log(`Validated ${questions.length} questions from ${path.relative(process.cwd(), file)}.`);
  if (issues.length) {
    for (const issue of issues) console.error(`${issue.externalId} [${issue.code}] ${issue.message}`);
    process.exitCode = 1;
  } else {
    console.log('QUESTION BANK VALIDATION: PASS');
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
