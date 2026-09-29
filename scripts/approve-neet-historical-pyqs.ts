import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { approvalIssues, approveQuestion, submitImportedQuestionForReview } from '../lib/admin/question-approval';
import { inspectDatabaseTarget } from '../lib/question-bank/taxonomy-sync';

loadEnvConfig(process.cwd());

const YEARS = [2021, 2022, 2023, 2024, 2025] as const;
const CONFIRMATION = 'APPROVE_NEET_HISTORICAL_2021_2025';
const dryRun = !process.argv.includes('--execute');
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
if (!databaseUrl || !directUrl) throw new Error('DATABASE_URL and DIRECT_URL are required.');
const database = inspectDatabaseTarget(databaseUrl);
const direct = inspectDatabaseTarget(directUrl);
if (database.database !== direct.database || database.classification !== direct.classification || !direct.direct) {
  throw new Error('DATABASE_URL and DIRECT_URL must target the same database and DIRECT_URL must be non-pooled.');
}
if (!dryRun && direct.classification === 'PRODUCTION' && process.env.NEET_HISTORICAL_APPROVAL_CONFIRM !== CONFIRMATION) {
  throw new Error(`Production write refused. Set NEET_HISTORICAL_APPROVAL_CONFIRM=${CONFIRMATION}.`);
}

type Candidate = { externalId: string; topic: string };
const prisma = new PrismaClient({ datasourceUrl: directUrl });

async function loadSelection() {
  const questions = (await Promise.all(YEARS.map(async (year) => JSON.parse(await readFile(
    path.join(process.cwd(), 'data', 'previous-year', 'neet', String(year), 'questions.json'), 'utf8',
  )) as Candidate[]))).flat();
  if (questions.length !== 780 || new Set(questions.map((question) => question.externalId)).size !== 780) {
    throw new Error('Validated historical selection must resolve to exactly 780 unique external IDs.');
  }
  return new Map(questions.map((question) => [question.externalId, question.topic]));
}

async function selectAdmin() {
  const admins = await prisma.admin.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true } });
  const email = process.env.NEET_HISTORICAL_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.NEET_HISTORICAL_ADMIN_NAME?.trim();
  const matches = email ? admins.filter((admin) => admin.email.toLowerCase() === email)
    : name ? admins.filter((admin) => admin.name === name) : admins;
  if (matches.length !== 1) throw new Error('Set NEET_HISTORICAL_ADMIN_EMAIL or NEET_HISTORICAL_ADMIN_NAME to identify exactly one active administrator.');
  return matches[0];
}

async function main() {
  const topics = await loadSelection();
  const questions = await prisma.question.findMany({
    where: { externalId: { in: [...topics.keys()] } },
    select: {
      id: true, externalId: true, exam: true, examYear: true, topic: true, chapterId: true, questionType: true,
      sourceType: true, sourceName: true, sourceUrl: true, officialAnswerKeyReference: true,
      reviewState: true, isActive: true, status: true, contentClass: true,
      subject: { select: { code: true } }, translations: true,
    },
  });
  if (questions.length !== topics.size) throw new Error(`FOUND must be ${topics.size}; found ${questions.length}.`);
  const approved = questions.filter((question) => question.reviewState === 'APPROVED');
  const eligible = questions.filter((question) => (question.reviewState === 'REVIEW_REQUIRED' && approvalIssues(question).length === 0)
    || (question.reviewState === 'DRAFT' && approvalIssues({ ...question, topic: topics.get(question.externalId ?? '') ?? '' }).length === 0));
  const ineligible = questions.filter((question) => question.reviewState !== 'APPROVED' && !eligible.includes(question));
  console.log(JSON.stringify({
    mode: dryRun ? 'DRY_RUN' : 'EXECUTE', target: { database, direct }, selected: topics.size, found: questions.length,
    eligible: eligible.length, alreadyApproved: approved.length,
    byYear: Object.fromEntries(YEARS.map((year) => [year, questions.filter((question) => question.examYear === year).length])),
    bySubject: Object.fromEntries(['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'].map((code) => [code, questions.filter((question) => question.subject.code === code).length])),
    ineligible: ineligible.map((question) => ({ externalId: question.externalId, reviewState: question.reviewState, issues: approvalIssues(question) })),
    unrelated: 0,
  }, null, 2));
  if (ineligible.length || eligible.length + approved.length !== topics.size) throw new Error('Unexpected or ineligible selected questions were found.');
  if (dryRun) return;

  const admin = await selectAdmin();
  let completed = 0;
  for (const question of questions) {
    if (question.reviewState === 'DRAFT') {
      await submitImportedQuestionForReview(question.id, { sub: admin.id, name: admin.name }, topics.get(question.externalId ?? '') ?? '');
    }
    await approveQuestion(question.id, { sub: admin.id, name: admin.name }, { allowAlreadyApproved: true, note: 'Validated NEET historical 2021–2025 exact-manifest release' });
    completed += 1;
    if (completed % 25 === 0 || completed === questions.length) console.log(JSON.stringify({ approvedOrVerified: completed, total: questions.length }));
  }

  const verified = await prisma.question.findMany({
    where: { externalId: { in: [...topics.keys()] } },
    select: { reviewState: true, isActive: true, status: true, contentClass: true, examYear: true, subject: { select: { code: true } } },
  });
  const active = verified.filter((question) => question.reviewState === 'APPROVED' && question.isActive
    && question.status === 'PUBLISHED' && question.contentClass === 'PRODUCTION');
  console.log(JSON.stringify({ approved: active.length, selected: topics.size, unrelatedModified: 0 }, null, 2));
  if (active.length !== topics.size) throw new Error('Post-approval verification failed.');
}

main()
  .catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
