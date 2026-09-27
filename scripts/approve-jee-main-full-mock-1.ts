import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { approvalIssues, approveQuestion, submitImportedQuestionForReview } from '../lib/admin/question-approval';
import { inspectDatabaseTarget } from '../lib/question-bank/taxonomy-sync';

loadEnvConfig(process.cwd());

const CONFIRMATION = 'APPROVE_SELECTED_JEE_MAIN_FULL_MOCK_1';
const dryRun = !process.argv.includes('--execute');
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
if (!databaseUrl || !directUrl) throw new Error('DATABASE_URL and DIRECT_URL are required.');

const database = inspectDatabaseTarget(databaseUrl);
const direct = inspectDatabaseTarget(directUrl);
if (database.database !== direct.database || database.classification !== direct.classification || !direct.direct) {
  throw new Error('DATABASE_URL and DIRECT_URL must target the same database and DIRECT_URL must be non-pooled.');
}
if (!dryRun && direct.classification === 'PRODUCTION' && process.env.JEE_SELECTION_APPROVAL_CONFIRM !== CONFIRMATION) {
  throw new Error(`Production write refused. Set JEE_SELECTION_APPROVAL_CONFIRM=${CONFIRMATION}.`);
}

type CandidateQuestion = { externalId?: string; topic?: string; subjectCode?: string; questionType?: string };
const candidatePath = path.join(process.cwd(), 'data/question-bank/sivora-jee-main-full-mock-1-candidates.json');
const prisma = new PrismaClient({ datasourceUrl: directUrl });

async function selectedQuestions() {
  const candidates = JSON.parse(await readFile(candidatePath, 'utf8')) as CandidateQuestion[];
  const ids = candidates.map((question) => question.externalId ?? '');
  if (ids.length !== 75 || ids.some((id) => !id) || new Set(ids).size !== 75) throw new Error('Selection must contain exactly 75 unique external IDs.');
  const topics = new Map(candidates.map((question) => [question.externalId!, question.topic?.trim() ?? '']));
  if ([...topics.values()].some((topic) => !topic)) throw new Error('Every selected candidate must provide a topic.');
  return { candidates, ids, topics };
}

async function main() {
  const { candidates, ids, topics } = await selectedQuestions();
  const questions = await prisma.question.findMany({
    where: { externalId: { in: ids } },
    select: {
      id: true, externalId: true, exam: true, examYear: true, topic: true, chapterId: true,
      questionType: true, sourceType: true, sourceName: true, sourceUrl: true, reviewState: true,
      isActive: true, status: true, contentClass: true, subject: { select: { code: true } }, translations: true,
    },
  });
  if (questions.length !== 75) throw new Error(`FOUND must be 75; found ${questions.length}.`);
  const byExternalId = new Map(questions.map((question) => [question.externalId, question]));
  const mismatches = candidates.flatMap((candidate) => {
    const question = byExternalId.get(candidate.externalId ?? '');
    return !question || question.exam !== 'JEE' || question.subject.code !== candidate.subjectCode || question.questionType !== candidate.questionType
      ? [candidate.externalId] : [];
  });
  const subjectCounts = questions.reduce<Record<string, number>>((counts, question) => {
    counts[question.subject.code] = (counts[question.subject.code] ?? 0) + 1;
    return counts;
  }, {});
  const typeCounts = questions.reduce<Record<string, number>>((counts, question) => {
    counts[question.questionType] = (counts[question.questionType] ?? 0) + 1;
    return counts;
  }, {});
  if (mismatches.length || subjectCounts.JEE_PHYSICS !== 25 || subjectCounts.JEE_CHEMISTRY !== 25
    || subjectCounts.JEE_MATHEMATICS !== 25 || typeCounts.SINGLE_CORRECT !== 60 || typeCounts.NUMERICAL_VALUE !== 15) {
    throw new Error(`Exact JEE selection verification failed: ${JSON.stringify({ mismatches, subjectCounts, typeCounts })}`);
  }

  const alreadyApproved = questions.filter((question) => question.reviewState === 'APPROVED');
  const eligible = questions.filter((question) =>
    (question.reviewState === 'REVIEW_REQUIRED' && approvalIssues(question).length === 0)
    || (question.reviewState === 'DRAFT' && approvalIssues({ ...question, topic: topics.get(question.externalId ?? '') ?? '' }).length === 0));
  const ineligible = questions.filter((question) => question.reviewState !== 'APPROVED' && !eligible.includes(question));
  console.log(JSON.stringify({
    mode: dryRun ? 'DRY_RUN' : 'EXECUTE', target: { database, direct }, selected: ids.length, found: questions.length,
    subjectCounts, typeCounts, eligible: eligible.length, alreadyApproved: alreadyApproved.length,
    ineligible: ineligible.map((question) => ({ externalId: question.externalId, reviewState: question.reviewState, issues: approvalIssues(question) })), unrelated: 0,
  }, null, 2));
  if (ineligible.length || eligible.length + alreadyApproved.length !== 75) throw new Error('Unexpected or ineligible selected questions were found.');
  if (dryRun) return;

  const activeAdmins = await prisma.admin.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true } });
  const requestedEmail = process.env.JEE_SELECTION_APPROVER_EMAIL?.trim().toLowerCase();
  const requestedName = process.env.JEE_SELECTION_APPROVER_NAME?.trim();
  const matches = requestedEmail ? activeAdmins.filter((admin) => admin.email.toLowerCase() === requestedEmail)
    : requestedName ? activeAdmins.filter((admin) => admin.name === requestedName) : activeAdmins;
  const reviewer = matches.length === 1 ? matches[0] : undefined;
  if (!reviewer) throw new Error('Set JEE_SELECTION_APPROVER_EMAIL or unique JEE_SELECTION_APPROVER_NAME to the authenticated active administrator.');

  for (const question of questions) {
    if (question.reviewState === 'DRAFT') await submitImportedQuestionForReview(question.id, { sub: reviewer.id, name: reviewer.name }, topics.get(question.externalId ?? '') ?? '');
    await approveQuestion(question.id, { sub: reviewer.id, name: reviewer.name }, { allowAlreadyApproved: true });
  }
  const verified = await prisma.question.findMany({
    where: { externalId: { in: ids } },
    select: { reviewState: true, isActive: true, status: true, contentClass: true, subject: { select: { code: true } } },
  });
  const approved = verified.filter((question) => question.reviewState === 'APPROVED').length;
  const activeEligible = verified.filter((question) => question.reviewState === 'APPROVED' && question.isActive && question.status === 'PUBLISHED' && question.contentClass === 'PRODUCTION').length;
  console.log(JSON.stringify({ verified: verified.length, approved, activeEligible, unrelatedModified: 0 }, null, 2));
  if (approved !== 75 || activeEligible !== 75) throw new Error('Post-approval verification failed.');
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
