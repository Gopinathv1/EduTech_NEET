/**
 * Imports the reviewed 80-row SIVORA NEET pilot into the isolated local test
 * database only. This is intentionally not a production import utility.
 */
import { readFileSync } from 'node:fs';
import Papa from 'papaparse';
import type { PrismaClient } from '@prisma/client';
import { validateRows, normalizeText, questionTextHash } from '../lib/admin/bulk';
import { CHAPTERS, SUBJECTS } from '../prisma/reference-data';

const PILOT_TEST_ID = 'local-neet-pilot-80';
const PILOT_PREFIX = 'SIV-NEET-';
const CSV_PATH = 'content/imports/sivora_neet_pilot_80.csv';
const SUBJECT_CODES = ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const;

function loadLocalTestEnvironment() {
  const values = new Map<string, string>();
  for (const line of readFileSync('.env.test.local', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^(DATABASE_URL|DIRECT_URL)=(.*)$/);
    if (match) values.set(match[1], match[2].trim().replace(/^['"]|['"]$/g, ''));
  }

  for (const name of ['DATABASE_URL', 'DIRECT_URL'] as const) {
    const value = values.get(name);
    if (!value) throw new Error(`Missing ${name} in .env.test.local.`);
    const url = new URL(value);
    if (url.hostname !== '127.0.0.1' || url.port !== '5433' || url.pathname !== '/sivora_test') {
      throw new Error('Refusing to import outside local sivora_test.');
    }
    process.env[name] = value;
  }
}

async function ensureReferenceData(prisma: PrismaClient) {
  for (const definition of SUBJECTS) {
    const subject = await prisma.subject.upsert({
      where: { code: definition.code },
      update: { name: definition.name, order: definition.order },
      create: { code: definition.code, name: definition.name, order: definition.order },
    });
    for (const chapter of Object.values(CHAPTERS[definition.code] ?? {})) {
      const existing = await prisma.chapter.findFirst({
        where: { subjectId: subject.id, name: { path: ['en'], equals: chapter.name.en } },
        select: { id: true },
      });
      if (existing) {
        await prisma.chapter.update({ where: { id: existing.id }, data: { name: chapter.name, class: chapter.class, weightage: chapter.weightage } });
      } else {
        await prisma.chapter.create({ data: { subjectId: subject.id, name: chapter.name, class: chapter.class, weightage: chapter.weightage } });
      }
    }
  }
}

async function main() {
  // This must happen before importing Prisma or any database-backed module.
  loadLocalTestEnvironment();

  const [{ prisma }, { writeQuestionVersion }] = await Promise.all([
    import('../lib/prisma'),
    import('../lib/admin/question-version'),
  ]);
  await ensureReferenceData(prisma);
  const csv = readFileSync(CSV_PATH, 'utf8');
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: 'greedy' });
  if (parsed.errors.length) throw new Error(`CSV parse failed: ${parsed.errors[0].message}`);
  const rows = parsed.data;
  if (rows.length !== 80) throw new Error(`Expected exactly 80 pilot rows; found ${rows.length}.`);

  const counts = Object.fromEntries(SUBJECT_CODES.map((code) => [code, rows.filter((row) => row.subjectCode === code).length]));
  if (SUBJECT_CODES.some((code) => counts[code] !== 20)) throw new Error('Pilot must contain exactly 20 rows for each subject.');

  const [subjects, chapters, enTranslations, externalIds, existingTest] = await Promise.all([
    prisma.subject.findMany({ select: { id: true, code: true } }),
    prisma.chapter.findMany({ select: { id: true, subjectId: true, name: true } }),
    prisma.questionTranslation.findMany({ where: { language: 'en' }, select: { questionText: true } }),
    prisma.question.findMany({ where: { externalId: { not: null } }, select: { externalId: true } }),
    prisma.test.findUnique({ where: { id: PILOT_TEST_ID }, select: { id: true } }),
  ]);
  const existingPilotRows = externalIds.filter((row) => row.externalId?.startsWith(PILOT_PREFIX));
  if (existingPilotRows.length > 0 || existingTest) throw new Error('Pilot already exists in the local test database; refusing duplicate import.');

  const subjectIdByCode = new Map(subjects.map((subject) => [subject.code, subject.id]));
  const chapterIdByKey = new Map(chapters.map((chapter) => [
    `${chapter.subjectId}::${normalizeText((chapter.name as { en?: string }).en ?? '')}`,
    chapter.id,
  ]));
  const results = validateRows(rows, {
    subjectIdByCode,
    chapterIdByKey,
    existingHashes: new Set(enTranslations.map((translation) => questionTextHash(translation.questionText))),
    existingExternalIds: new Set(externalIds.map((row) => row.externalId!).filter(Boolean)),
  });
  const invalid = results.filter((result) => result.status === 'error');
  if (invalid.length) throw new Error(`CSV validation failed for ${invalid.length} row(s): ${invalid[0].errors.join('; ')}`);

  const created = await prisma.$transaction(async (tx) => {
    const questionIds: string[] = [];
    for (const result of results) {
      const row = result.data!;
      const question = await tx.question.create({
        data: {
          externalId: row.externalId,
          subjectId: row.subjectId,
          chapterId: row.chapterId,
          topic: rows[result.line - 1].topic?.trim() || null,
          difficulty: row.difficulty,
          questionType: 'SINGLE_CORRECT',
          year: row.year,
          tags: row.tags,
          contentClass: 'PRODUCTION',
          sourceType: 'INTERNALLY_AUTHORED',
          sourceName: 'SIVORA',
          reviewer: row.reviewer ?? 'SIVORA Pilot Review',
          reviewedAt: row.reviewedAt ? new Date(row.reviewedAt) : new Date(),
          status: 'PUBLISHED',
          isActive: true,
          translations: {
            create: {
              language: 'en',
              questionText: row.en.questionText,
              optionA: row.en.optionA,
              optionB: row.en.optionB,
              optionC: row.en.optionC,
              optionD: row.en.optionD,
              correctOption: row.correctOption,
              explanation: row.en.explanation || null,
              reviewed: true,
            },
          },
        },
        select: { id: true },
      });
      await writeQuestionVersion(tx, question.id, 'local-pilot-import', { sub: 'local-test-import', name: 'Local test importer' });
      questionIds.push(question.id);
    }

    await tx.test.create({
      data: {
        id: PILOT_TEST_ID,
        title: { en: 'SIVORA NEET Pilot Practice (80 Questions)', ta: '' },
        description: { en: 'Local test-only fixed practice set across all four NEET subjects.', ta: '' },
        testType: 'MINI_TEST',
        totalQuestions: 80,
        durationMinutes: 80,
        price: 0,
        difficulty: 'MEDIUM',
        isRandom: false,
        isPublished: true,
        contentClass: 'PRODUCTION',
        availableLanguages: ['en'],
        rules: { source: 'local-neet-pilot-import', difficultyMix: { EASY: 30, MEDIUM: 50, HARD: 20 } },
        testQuestions: { create: questionIds.map((questionId, index) => ({ questionId, order: index + 1 })) },
      },
    });
    return questionIds.length;
  });

  console.log(JSON.stringify({ imported: created, testId: PILOT_TEST_ID, counts, testOnlyEligibility: 'PUBLISHED + isActive + reviewed English + reviewer/reviewedAt' }));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
