import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { PrismaClient, type Prisma } from '@prisma/client';
import { normalizeText, questionTextHash } from '../lib/admin/bulk';
import { writeQuestionVersion } from '../lib/admin/question-version';
import { QUESTION_BANK_V1_TAXONOMY } from '../lib/question-bank/taxonomy';
import { inspectDatabaseTarget } from '../lib/question-bank/taxonomy-sync';

loadEnvConfig(process.cwd());

const YEARS = [2021, 2022, 2023, 2024, 2025] as const;
const CONFIRMATION = 'IMPORT_NEET_HISTORICAL_2021_2025';
const BATCH_SIZE = 25;
const dryRun = !process.argv.includes('--execute');
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
if (!databaseUrl || !directUrl) throw new Error('DATABASE_URL and DIRECT_URL are required.');

const database = inspectDatabaseTarget(databaseUrl);
const direct = inspectDatabaseTarget(directUrl);
if (database.database !== direct.database || database.classification !== direct.classification || !direct.direct) {
  throw new Error('DATABASE_URL and DIRECT_URL must target the same database and DIRECT_URL must be non-pooled.');
}
if (!dryRun && direct.classification === 'PRODUCTION' && process.env.NEET_HISTORICAL_IMPORT_CONFIRM !== CONFIRMATION) {
  throw new Error(`Production write refused. Set NEET_HISTORICAL_IMPORT_CONFIRM=${CONFIRMATION}.`);
}

type HistoricalQuestion = {
  externalId: string;
  exam: 'NEET';
  year: number;
  paperCode: string;
  originalQuestionNumber: number;
  questionType: 'SINGLE_CORRECT';
  questionText: string;
  options: [string, string, string, string];
  correctOption: 'A' | 'B' | 'C' | 'D';
  subjectCode: 'PHYSICS' | 'CHEMISTRY' | 'BOTANY' | 'ZOOLOGY';
  chapterSlug: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  explanation: string;
  sourceType: 'HISTORICAL_VERIFIED';
  sourceName: string;
  sourceUrl: string;
  officialAnswerKeyReference: string;
  examYear: number;
  paperSession: string;
  validationState: 'VALIDATED';
};

async function loadManifestQuestions(): Promise<HistoricalQuestion[]> {
  const all = (await Promise.all(YEARS.map(async (year) => {
    const file = path.join(process.cwd(), 'data', 'previous-year', 'neet', String(year), 'questions.json');
    return JSON.parse(await readFile(file, 'utf8')) as HistoricalQuestion[];
  }))).flat();
  const ids = all.map((question) => question.externalId);
  const hashes = all.map((question) => questionTextHash(question.questionText));
  if (all.length !== 780) throw new Error(`Validated manifest must contain 780 questions; found ${all.length}.`);
  if (new Set(ids).size !== all.length) throw new Error('Validated manifest contains duplicate external IDs.');
  if (new Set(hashes).size !== all.length) throw new Error('Validated manifest contains duplicate normalized question text.');
  return all;
}

const prisma = new PrismaClient({ datasourceUrl: directUrl });

async function selectAdmin() {
  const admins = await prisma.admin.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true } });
  const email = process.env.NEET_HISTORICAL_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.NEET_HISTORICAL_ADMIN_NAME?.trim();
  const matches = email
    ? admins.filter((admin) => admin.email.toLowerCase() === email)
    : name ? admins.filter((admin) => admin.name === name) : admins;
  if (matches.length !== 1) throw new Error('Set NEET_HISTORICAL_ADMIN_EMAIL or NEET_HISTORICAL_ADMIN_NAME to identify exactly one active administrator.');
  return matches[0];
}

async function main() {
  const questions = await loadManifestQuestions();
  const [subjects, chapters, existing, existingTranslations] = await Promise.all([
    prisma.subject.findMany({ select: { id: true, code: true } }),
    prisma.chapter.findMany({ select: { id: true, subjectId: true, name: true } }),
    prisma.question.findMany({
      where: { externalId: { in: questions.map((question) => question.externalId) } },
      select: { id: true, externalId: true, sourceType: true, exam: true, examYear: true, paperSession: true, topic: true },
    }),
    prisma.questionTranslation.findMany({ where: { language: 'en' }, select: { questionId: true, questionText: true } }),
  ]);
  const subjectByCode = new Map(subjects.map((subject) => [subject.code, subject]));
  const chapterByKey = new Map(chapters.map((chapter) => [
    `${chapter.subjectId}:${normalizeText((chapter.name as { en?: string }).en ?? '')}`,
    chapter,
  ]));
  const existingByExternalId = new Map(existing.map((question) => [question.externalId, question]));
  const manifestIds = new Set(questions.map((question) => question.externalId));
  const existingTextOwners = new Map(existingTranslations.map((translation) => [questionTextHash(translation.questionText), translation.questionId]));
  const existingSelectedIds = new Set(existing.map((question) => question.id));
  const unexpected: string[] = [];
  const prepared = questions.map((question) => {
    const taxonomy = QUESTION_BANK_V1_TAXONOMY.find((entry) => entry.exam === 'NEET'
      && entry.subjectCode === question.subjectCode
      && entry.unitSlug === question.chapterSlug
      && entry.topicSlugs.includes(question.topic));
    if (!taxonomy) unexpected.push(`${question.externalId}: unsupported canonical taxonomy`);
    const subject = subjectByCode.get(question.subjectCode);
    if (!subject) unexpected.push(`${question.externalId}: subject ${question.subjectCode} not found`);
    const chapter = subject && taxonomy
      ? chapterByKey.get(`${subject.id}:${normalizeText(taxonomy.unitName)}`)
      : undefined;
    if (!chapter) unexpected.push(`${question.externalId}: chapter ${taxonomy?.unitName ?? question.chapterSlug} not found`);
    const prior = existingByExternalId.get(question.externalId);
    if (prior && (prior.sourceType !== 'HISTORICAL_VERIFIED' || prior.exam !== 'NEET' || prior.examYear !== question.year
      || prior.paperSession !== question.paperSession || prior.topic !== question.topic)) {
      unexpected.push(`${question.externalId}: existing row does not match the validated manifest identity`);
    }
    const textOwner = existingTextOwners.get(questionTextHash(question.questionText));
    if (textOwner && !existingSelectedIds.has(textOwner)) unexpected.push(`${question.externalId}: question text already belongs to unrelated row ${textOwner}`);
    return { question, subjectId: subject?.id, chapterId: chapter?.id, prior };
  });

  const missing = prepared.filter((entry) => !entry.prior);
  const report = {
    mode: dryRun ? 'DRY_RUN' : 'EXECUTE', target: { database, direct },
    selected: questions.length, found: existing.length, missing: missing.length,
    years: Object.fromEntries(YEARS.map((year) => [year, questions.filter((question) => question.year === year).length])),
    subjects: Object.fromEntries(['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'].map((subject) => [subject, questions.filter((question) => question.subjectCode === subject).length])),
    batches: Math.ceil(missing.length / BATCH_SIZE), batchSize: BATCH_SIZE,
    unexpected,
    unrelated: 0,
  };
  console.log(JSON.stringify(report, null, 2));
  if (unexpected.length) throw new Error('Import preflight found unexpected records.');
  if (dryRun || missing.length === 0) return;

  const admin = await selectAdmin();
  for (let start = 0; start < missing.length; start += BATCH_SIZE) {
    const batch = missing.slice(start, start + BATCH_SIZE);
    await prisma.$transaction(async (tx) => {
      for (const entry of batch) {
        const { question } = entry;
        const created = await tx.question.create({
          data: {
            externalId: question.externalId,
            subjectId: entry.subjectId!, chapterId: entry.chapterId!, topic: question.topic,
            difficulty: question.difficulty, year: question.year,
            tags: ['neet-pyq', `neet-${question.year}`, `booklet-${question.paperCode.toLowerCase()}`, `original-question-${question.originalQuestionNumber}`],
            questionType: question.questionType, status: 'REVIEW', contentClass: 'PRODUCTION',
            sourceType: question.sourceType, sourceName: question.sourceName, sourceUrl: question.sourceUrl,
            officialAnswerKeyReference: question.officialAnswerKeyReference,
            importedAt: new Date(), exam: question.exam, examYear: question.examYear,
            paperSession: question.paperSession, reviewState: 'DRAFT', isActive: false,
            translations: { create: {
              language: 'en', questionText: question.questionText,
              optionA: question.options[0], optionB: question.options[1], optionC: question.options[2], optionD: question.options[3],
              correctOption: question.correctOption, explanation: question.explanation, reviewed: true,
            } },
          },
        });
        await writeQuestionVersion(tx, created.id, 'bulk-created', { sub: admin.id, name: admin.name });
      }
      await tx.auditLog.create({ data: {
        adminId: admin.id, adminName: admin.name, action: 'question.bulkImport', entityType: 'Question',
        details: { source: 'NEET_HISTORICAL_2021_2025', offset: start, count: batch.length, externalIds: batch.map((entry) => entry.question.externalId) } as Prisma.InputJsonValue,
      } });
    }, { maxWait: 10_000, timeout: 30_000 });
    console.log(JSON.stringify({ completedBatch: Math.floor(start / BATCH_SIZE) + 1, imported: Math.min(start + batch.length, missing.length), totalMissing: missing.length }));
  }

  const verified = await prisma.question.count({ where: { externalId: { in: [...manifestIds] }, sourceType: 'HISTORICAL_VERIFIED' } });
  if (verified !== questions.length) throw new Error(`Post-import verification failed: expected ${questions.length}, found ${verified}.`);
  console.log(JSON.stringify({ importedSelected: verified, unique: questions.length, unrelatedModified: 0 }, null, 2));
}

main()
  .catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
