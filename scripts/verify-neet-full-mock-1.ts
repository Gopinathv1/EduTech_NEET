import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { validateTaxonomy } from '../lib/question-bank/taxonomy';
import { validateQuestionBank, type BankQuestion } from '../lib/question-bank/validator';

type Selection = {
  id: string;
  title: string;
  description: string;
  exam: string;
  mode: string;
  durationMinutes: number;
  price: number;
  retake: string;
  scoring: { correct: number; incorrect: number; unanswered: number; maximum: number };
  sources: { includeAll: string[]; selected: Record<string, string[]> };
};

const bankDir = path.resolve(process.cwd(), 'data/question-bank');
const selectionPath = path.join(bankDir, 'sivora-neet-full-mock-1-selection.json');
const selection = JSON.parse(readFileSync(selectionPath, 'utf8')) as Selection;
const load = (file: string) => JSON.parse(readFileSync(path.join(bankDir, file), 'utf8')) as BankQuestion[];

const questions = selection.sources.includeAll.flatMap(load);
for (const [file, ids] of Object.entries(selection.sources.selected)) {
  const byId = new Map(load(file).map((question) => [question.externalId, question]));
  for (const id of ids) {
    const question = byId.get(id);
    if (!question) throw new Error(`Selected question ${id} is missing from ${file}.`);
    questions.push(question);
  }
}

const normalise = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const counts = {
  PHYSICS: questions.filter((question) => question.subjectCode === 'PHYSICS').length,
  CHEMISTRY: questions.filter((question) => question.subjectCode === 'CHEMISTRY').length,
  BIOLOGY: questions.filter((question) => question.subjectCode === 'BOTANY' || question.subjectCode === 'ZOOLOGY').length,
};
const ids = questions.map((question) => question.externalId);
const texts = questions.map((question) => normalise(question.questionText));
const issues = [
  ...validateTaxonomy(),
  ...validateQuestionBank(questions).map((issue) => `${issue.externalId} [${issue.code}] ${issue.message}`),
];

if (questions.length !== 180) issues.push(`Expected 180 questions; found ${questions.length}.`);
if (new Set(ids).size !== 180) issues.push(`Expected 180 unique external IDs; found ${new Set(ids).size}.`);
if (new Set(texts).size !== 180) issues.push(`Expected 180 unique question texts; found ${new Set(texts).size}.`);
if (counts.PHYSICS !== 45 || counts.CHEMISTRY !== 45 || counts.BIOLOGY !== 90) issues.push(`Invalid quotas: ${JSON.stringify(counts)}.`);
if (selection.durationMinutes !== 180) issues.push('Duration must be 180 minutes.');
if (selection.scoring.correct !== 4 || selection.scoring.incorrect !== -1 || selection.scoring.unanswered !== 0 || selection.scoring.maximum !== 720) issues.push('Invalid scoring configuration.');
if (selection.price !== 0 || selection.retake !== 'FREE_UNLIMITED') issues.push('Mock must be free with unlimited free retakes.');
if (!/not an official nta/i.test(selection.description)) issues.push('Description must disclaim official NTA status.');
if (questions.some((question) => question.sourceType !== 'SIVORA_AUTHORED')) issues.push('Every selected question must be SIVORA_AUTHORED.');
if (questions.some((question) => /pyq|official nta/i.test(`${question.sourceName ?? ''} ${question.questionText}`))) issues.push('Selected content must not claim PYQ or official NTA provenance.');
if (questions.some((question) => question.externalId !== `sivora-authored:${createHash('sha256').update(question.identityKey ?? '').digest('hex').slice(0, 24)}`)) issues.push('A selected external ID is not deterministic.');

const summary = {
  id: selection.id,
  questions: questions.length,
  unique: new Set(ids).size,
  exactDuplicates: questions.length - new Set(texts).size,
  counts,
  durationMinutes: selection.durationMinutes,
  scoring: selection.scoring,
  price: selection.price,
  retake: selection.retake,
  sivoraAuthored: questions.filter((question) => question.sourceType === 'SIVORA_AUTHORED').length,
  reviewRequired: questions.filter((question) => question.reviewState === 'REVIEW_REQUIRED').length,
  approvedInCandidateFiles: questions.filter((question) => question.reviewState === 'APPROVED').length,
};

console.log(JSON.stringify(summary, null, 2));
if (issues.length) {
  for (const issue of issues) console.error(issue);
  process.exitCode = 1;
} else {
  console.log('SIVORA NEET FULL MOCK 1 OFFLINE SELECTION: PASS');
}
