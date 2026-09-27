import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { publishTest } from '../lib/admin/test-publication';
import { isExactFixedNeetSelection, summarizeFixedNeetSelection } from '../lib/admin/fixed-neet-full-mock';
import { inspectDatabaseTarget } from '../lib/question-bank/taxonomy-sync';

loadEnvConfig(process.cwd());

const TEST_ID = 'sivora-neet-full-mock-1';
const CONFIRMATION = 'CREATE_NEET_FULL_MOCK_1';
const dryRun = !process.argv.includes('--execute');
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
if (!databaseUrl || !directUrl) throw new Error('DATABASE_URL and DIRECT_URL are required.');

const database = inspectDatabaseTarget(databaseUrl);
const direct = inspectDatabaseTarget(directUrl);
if (database.database !== direct.database || database.classification !== direct.classification || !direct.direct) {
  throw new Error('DATABASE_URL and DIRECT_URL must target the same database and DIRECT_URL must be non-pooled.');
}
if (!dryRun && direct.classification === 'PRODUCTION' && process.env.NEET_FULL_MOCK_CREATE_CONFIRM !== CONFIRMATION) {
  throw new Error(`Production write refused. Set NEET_FULL_MOCK_CREATE_CONFIRM=${CONFIRMATION}.`);
}

type Selection = { sources?: { includeAll?: string[]; selected?: Record<string, string[]> } };
type CandidateQuestion = { externalId?: string };
const selectionPath = path.join(process.cwd(), 'data/question-bank/sivora-neet-full-mock-1-selection.json');

async function selectedExternalIds() {
  const selection = JSON.parse(await readFile(selectionPath, 'utf8')) as Selection;
  const bankDir = path.dirname(selectionPath);
  const load = async (file: string) => JSON.parse(await readFile(path.join(bankDir, file), 'utf8')) as CandidateQuestion[];
  const chosen = (await Promise.all((selection.sources?.includeAll ?? []).map(load))).flat();
  for (const [file, ids] of Object.entries(selection.sources?.selected ?? {})) {
    const byExternalId = new Map((await load(file)).map((question) => [question.externalId, question]));
    for (const externalId of ids) {
      if (!byExternalId.has(externalId)) throw new Error(`Selected external ID is missing from ${file}: ${externalId}`);
      chosen.push(byExternalId.get(externalId)!);
    }
  }
  const ids = chosen.map((question) => question.externalId ?? '');
  if (ids.length !== 180 || ids.some((id) => !id) || new Set(ids).size !== 180) throw new Error('Selection manifest must resolve to exactly 180 unique external IDs.');
  return ids;
}

async function main() {
  const externalIds = await selectedExternalIds();
  const prisma = new PrismaClient({ datasourceUrl: directUrl });
  try {
    const questions = await prisma.question.findMany({
      where: { externalId: { in: externalIds } },
      select: { id: true, externalId: true, reviewState: true, isActive: true, status: true, contentClass: true, subject: { select: { code: true } } },
    });
    const summary = summarizeFixedNeetSelection(questions.map((question) => ({
      id: question.id,
      externalId: question.externalId,
      subjectCode: question.subject.code,
      approved: question.reviewState === 'APPROVED',
      activeEligible: question.reviewState === 'APPROVED' && question.isActive && question.status === 'PUBLISHED' && question.contentClass === 'PRODUCTION',
    })));
    if (!isExactFixedNeetSelection(summary)) throw new Error(`Selected inventory is not ready: ${JSON.stringify(summary)}.`);

    const existing = await prisma.test.findUnique({
      where: { id: TEST_ID },
      include: { testQuestions: { orderBy: { order: 'asc' }, select: { question: { select: { externalId: true } } } } },
    });
    const existingIds = existing?.testQuestions.map((row) => row.question.externalId) ?? [];
    const matchingExisting = existing
      && existing.testType === 'FULL_TEST'
      && existing.totalQuestions === 180
      && existing.durationMinutes === 180
      && existing.price === 0
      && !existing.isRandom
      && existing.contentClass === 'PRODUCTION'
      && (existing.title as { en?: unknown }).en === 'SIVORA NEET Full Mock 1'
      && existingIds.length === 180
      && externalIds.every((id, index) => existingIds[index] === id);
    if (existing && !matchingExisting) throw new Error(`Conflicting existing mock ${TEST_ID} refused.`);

    console.log(JSON.stringify({ mode: dryRun ? 'DRY_RUN' : 'EXECUTE', target: { database, direct }, selected: externalIds.length, found: questions.length, ...summary, readiness: 'PASS', conflictingMock: Boolean(existing && !matchingExisting), existing: Boolean(existing) }, null, 2));
    if (dryRun) return;

    const reviewerEmail = process.env.NEET_FULL_MOCK_CREATOR_EMAIL?.trim().toLowerCase();
    const reviewerName = process.env.NEET_FULL_MOCK_CREATOR_NAME?.trim();
    const activeAdmins = await prisma.admin.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true } });
    const reviewers = reviewerEmail
      ? activeAdmins.filter((admin) => admin.email.toLowerCase() === reviewerEmail)
      : reviewerName ? activeAdmins.filter((admin) => admin.name === reviewerName) : activeAdmins;
    if (reviewers.length !== 1) throw new Error('Set NEET_FULL_MOCK_CREATOR_EMAIL or NEET_FULL_MOCK_CREATOR_NAME to identify exactly one active administrator.');
    const reviewer = reviewers[0];

    if (!matchingExisting) {
      await prisma.$transaction(async (tx) => {
        await tx.test.create({
          data: {
            id: TEST_ID,
            title: { en: 'SIVORA NEET Full Mock 1', ta: '' },
            description: { en: 'SIVORA-authored NEET practice mock. Not an official NTA paper or PYQ.', ta: '' },
            testType: 'FULL_TEST', totalQuestions: 180, durationMinutes: 180, price: 0, difficulty: 'MEDIUM',
            isRandom: false, isPublished: false, contentClass: 'PRODUCTION', availableLanguages: ['en'],
            rules: { exam: 'NEET', selectionManifest: path.basename(selectionPath), scoring: { correct: 4, incorrect: -1, unanswered: 0, maximum: 720 }, retake: 'FREE_UNLIMITED', payment: 'NONE' },
          },
        });
        await tx.testQuestion.createMany({ data: externalIds.map((externalId, index) => ({ testId: TEST_ID, questionId: questions.find((question) => question.externalId === externalId)!.id, order: index + 1 })) });
        await tx.auditLog.create({ data: { adminId: reviewer.id, adminName: reviewer.name, action: 'test.create', entityType: 'Test', entityId: TEST_ID, details: { testType: 'FULL_TEST', isRandom: false, totalQuestions: 180, selectionManifest: path.basename(selectionPath) } } });
      });
    }
    await publishTest(TEST_ID, { sub: reviewer.id, name: reviewer.name });
    const verified = await prisma.test.findUnique({
      where: { id: TEST_ID },
      include: { testQuestions: { select: { questionId: true } } },
    });
    console.log(JSON.stringify({ created: Boolean(verified), published: verified?.isPublished, questions: verified?.testQuestions.length, price: verified?.price, durationMinutes: verified?.durationMinutes, maxScore: 720 }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
