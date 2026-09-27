import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { publishTest } from '../lib/admin/test-publication';
import { isExactFixedJeeSelection, summarizeFixedJeeSelection } from '../lib/admin/fixed-jee-full-mock';
import { inspectDatabaseTarget } from '../lib/question-bank/taxonomy-sync';

loadEnvConfig(process.cwd());

const TEST_ID = 'sivora-jee-main-full-mock-1';
const CONFIRMATION = 'CREATE_JEE_MAIN_FULL_MOCK_1';
const dryRun = !process.argv.includes('--execute');
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
if (!databaseUrl || !directUrl) throw new Error('DATABASE_URL and DIRECT_URL are required.');
const database = inspectDatabaseTarget(databaseUrl);
const direct = inspectDatabaseTarget(directUrl);
if (database.database !== direct.database || database.classification !== direct.classification || !direct.direct) {
  throw new Error('DATABASE_URL and DIRECT_URL must target the same database and DIRECT_URL must be non-pooled.');
}
if (!dryRun && direct.classification === 'PRODUCTION' && process.env.JEE_FULL_MOCK_CREATE_CONFIRM !== CONFIRMATION) {
  throw new Error(`Production write refused. Set JEE_FULL_MOCK_CREATE_CONFIRM=${CONFIRMATION}.`);
}

type CandidateQuestion = { externalId?: string };
const candidatePath = path.join(process.cwd(), 'data/question-bank/sivora-jee-main-full-mock-1-candidates.json');

async function selectedExternalIds() {
  const candidates = JSON.parse(await readFile(candidatePath, 'utf8')) as CandidateQuestion[];
  const ids = candidates.map((question) => question.externalId ?? '');
  if (ids.length !== 75 || ids.some((id) => !id) || new Set(ids).size !== 75) throw new Error('Candidate bank must resolve to exactly 75 unique external IDs.');
  return ids;
}

async function main() {
  const externalIds = await selectedExternalIds();
  const prisma = new PrismaClient({ datasourceUrl: directUrl });
  try {
    const questions = await prisma.question.findMany({
      where: { externalId: { in: externalIds } },
      select: { id: true, externalId: true, reviewer: true, reviewState: true, isActive: true, status: true, contentClass: true, questionType: true, subject: { select: { code: true } } },
    });
    const summary = summarizeFixedJeeSelection(questions.map((question) => ({
      id: question.id, subjectCode: question.subject.code, questionType: question.questionType,
      approved: question.reviewState === 'APPROVED',
      activeEligible: question.reviewState === 'APPROVED' && question.isActive && question.status === 'PUBLISHED' && question.contentClass === 'PRODUCTION',
    })));
    if (!isExactFixedJeeSelection(summary)) throw new Error(`Selected inventory is not ready: ${JSON.stringify(summary)}.`);

    const existing = await prisma.test.findUnique({
      where: { id: TEST_ID },
      include: { testQuestions: { orderBy: { order: 'asc' }, select: { question: { select: { externalId: true } } } } },
    });
    const existingIds = existing?.testQuestions.map((row) => row.question.externalId) ?? [];
    const existingRules = existing?.rules && typeof existing.rules === 'object' ? existing.rules as Record<string, unknown> : {};
    const matchingExisting = existing && existing.testType === 'FULL_TEST' && existing.totalQuestions === 75
      && existing.durationMinutes === 180 && existing.price === 0 && !existing.isRandom && existing.contentClass === 'PRODUCTION'
      && (existing.title as { en?: unknown }).en === 'SIVORA JEE Main Full Mock 1' && existingRules.exam === 'JEE'
      && existingIds.length === 75 && externalIds.every((id, index) => existingIds[index] === id);
    if (existing && !matchingExisting) throw new Error(`Conflicting existing mock ${TEST_ID} refused.`);

    console.log(JSON.stringify({ mode: dryRun ? 'DRY_RUN' : 'EXECUTE', target: { database, direct }, selected: externalIds.length, found: questions.length, ...summary, readiness: 'PASS', conflictingMock: Boolean(existing && !matchingExisting), existing: Boolean(existing) }, null, 2));
    if (dryRun) return;

    const creatorName = process.env.JEE_FULL_MOCK_CREATOR_NAME?.trim();
    const activeAdmins = await prisma.admin.findMany({ where: { isActive: true }, select: { id: true, name: true } });
    const reviewerNames = new Set(questions.map((question) => question.reviewer).filter((name): name is string => Boolean(name)));
    const reviewers = creatorName ? activeAdmins.filter((admin) => admin.name === creatorName) : activeAdmins.filter((admin) => reviewerNames.has(admin.name));
    if (reviewers.length !== 1) throw new Error('Set JEE_FULL_MOCK_CREATOR_NAME to identify exactly one active administrator.');
    const reviewer = reviewers[0];

    if (!matchingExisting) {
      const byExternalId = new Map(questions.map((question) => [question.externalId, question.id]));
      await prisma.$transaction(async (tx) => {
        await tx.test.create({ data: {
          id: TEST_ID, title: { en: 'SIVORA JEE Main Full Mock 1', ta: '' },
          description: { en: 'SIVORA-authored JEE Main practice mock. Not an official NTA paper or PYQ.', ta: '' },
          testType: 'FULL_TEST', totalQuestions: 75, durationMinutes: 180, price: 0, difficulty: 'MEDIUM',
          isRandom: false, isPublished: false, contentClass: 'PRODUCTION', availableLanguages: ['en'],
          rules: { exam: 'JEE', scoring: { correct: 4, incorrect: -1, unanswered: 0, maximum: 300 }, retake: 'FREE_UNLIMITED', payment: 'NONE', structure: { perSubject: { mcq: 20, numerical: 5 } } },
        } });
        await tx.testQuestion.createMany({ data: externalIds.map((externalId, index) => ({ testId: TEST_ID, questionId: byExternalId.get(externalId)!, order: index + 1 })) });
        await tx.auditLog.create({ data: { adminId: reviewer.id, adminName: reviewer.name, action: 'test.create', entityType: 'Test', entityId: TEST_ID, details: { testType: 'FULL_TEST', isRandom: false, totalQuestions: 75, candidateBank: path.basename(candidatePath) } } });
      });
    }
    await publishTest(TEST_ID, { sub: reviewer.id, name: reviewer.name });
    const verified = await prisma.test.findUnique({ where: { id: TEST_ID }, include: { testQuestions: { select: { questionId: true } } } });
    console.log(JSON.stringify({ created: Boolean(verified), published: verified?.isPublished, questions: verified?.testQuestions.length, price: verified?.price, durationMinutes: verified?.durationMinutes, maxScore: 300 }, null, 2));
  } finally { await prisma.$disconnect(); }
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
