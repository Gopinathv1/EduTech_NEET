import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import Papa from 'papaparse';
import { BULK_COLUMNS } from '../lib/admin/bulk-columns';
import { QUESTION_BANK_V1_TAXONOMY } from '../lib/question-bank/taxonomy';

type Candidate = {
  externalId: string; subjectCode: string; chapterSlug: string; difficulty: string; questionType: string;
  questionText: string; options: string[]; correctOption?: string; numericAnswer?: number; explanation: string;
  sourceType: string; sourceName: string; contentClass: string;
};
const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) throw new Error('Usage: tsx scripts/export-candidate-bank-csv.ts <input.json> <output.csv>');
async function main() {
const questions = JSON.parse(await readFile(path.resolve(input), 'utf8')) as Candidate[];
const rows = questions.map((question) => {
  const taxonomy = QUESTION_BANK_V1_TAXONOMY.find((entry) => entry.subjectCode === question.subjectCode && entry.unitSlug === question.chapterSlug);
  if (!taxonomy) throw new Error(`Unsupported taxonomy ${question.subjectCode}/${question.chapterSlug}`);
  return {
    externalId: question.externalId, subjectCode: question.subjectCode, chapterName: taxonomy.unitName,
    difficulty: question.difficulty, questionType: question.questionType, year: '', tags: '',
    contentClassification: question.contentClass, sourceType: question.sourceType, sourceName: question.sourceName,
    exam: 'JEE', examYear: '', paperSession: '', licenseReference: '', reviewer: '', reviewDate: '',
    correctOption: question.correctOption ?? '', numericAnswer: question.numericAnswer ?? '',
    en_questionText: question.questionText, en_optionA: question.options[0] ?? '', en_optionB: question.options[1] ?? '',
    en_optionC: question.options[2] ?? '', en_optionD: question.options[3] ?? '', en_explanation: question.explanation,
    ta_questionText: '', ta_optionA: '', ta_optionB: '', ta_optionC: '', ta_optionD: '', ta_explanation: '', ta_reviewed: '',
  };
});
await writeFile(path.resolve(output), Papa.unparse({ fields: [...BULK_COLUMNS], data: rows }) + '\n', 'utf8');
console.log(JSON.stringify({ rows: rows.length, output: path.resolve(output) }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
