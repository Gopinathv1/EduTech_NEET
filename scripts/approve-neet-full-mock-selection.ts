import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { approvalIssues, approveQuestion, submitImportedQuestionForReview } from '../lib/admin/question-approval';
import { inspectDatabaseTarget } from '../lib/question-bank/taxonomy-sync';

loadEnvConfig(process.cwd());

const CONFIRMATION = 'APPROVE_SELECTED_NEET_FULL_MOCK_1';
const dryRun = !process.argv.includes('--execute');
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
if (!databaseUrl || !directUrl) throw new Error('DATABASE_URL and DIRECT_URL are required.');

const database = inspectDatabaseTarget(databaseUrl);
const direct = inspectDatabaseTarget(directUrl);
if (database.database !== direct.database || database.classification !== direct.classification) {
  throw new Error('DATABASE_URL and DIRECT_URL do not identify the same database.');
}
if (!direct.direct) throw new Error('DIRECT_URL must use a non-pooled host.');
if (!dryRun && direct.classification === 'PRODUCTION' && process.env.NEET_SELECTION_APPROVAL_CONFIRM !== CONFIRMATION) {
  throw new Error(`Production write refused. Set NEET_SELECTION_APPROVAL_CONFIRM=${CONFIRMATION}.`);
}

const prisma = new PrismaClient({ datasourceUrl: directUrl });
const selectionPath = path.join(process.cwd(), 'data/question-bank/sivora-neet-full-mock-1-selection.json');

type Selection = { sources?: { includeAll?: string[]; selected?: Record<string, string[]> } };
type CandidateQuestion = { externalId?: string; topic?: string };

async function selectedQuestions(): Promise<Map<string, string>> {
  const selection = JSON.parse(await readFile(selectionPath, 'utf8')) as Selection;
  const bankDir = path.dirname(selectionPath);
  const load = async (file: string) => JSON.parse(await readFile(path.join(bankDir, file), 'utf8')) as CandidateQuestion[];
  const included = (await Promise.all((selection.sources?.includeAll ?? []).map(load))).flat();
  const chosen: CandidateQuestion[] = [...included];
  for (const [file, externalIds] of Object.entries(selection.sources?.selected ?? {})) {
    const byId = new Map((await load(file)).map((question) => [question.externalId, question]));
    for (const externalId of externalIds) {
      const question = byId.get(externalId);
      if (!question) throw new Error(`Selected question ${externalId} is missing from ${file}.`);
      chosen.push(question);
    }
  }
  const ids = chosen.map((question) => question.externalId ?? '');
  if (ids.length !== 180) throw new Error(`SELECTED must be 180; found ${ids.length}.`);
  if (new Set(ids).size !== 180) throw new Error('Selection external IDs must be unique.');
  const topics = new Map(chosen.map((question) => [question.externalId ?? '', question.topic?.trim() ?? '']));
  if ([...topics.values()].some((topic) => !topic)) throw new Error('Every selected candidate must provide a topic.');
  return topics;
}

async function main() {
  const topics = await selectedQuestions();
  const externalIds = [...topics.keys()];
  const questions = await prisma.question.findMany({
    where: { externalId: { in: externalIds } },
    select: {
      id: true,
      externalId: true,
      exam: true,
      examYear: true,
      topic: true,
      chapterId: true,
      questionType: true,
      sourceType: true,
      sourceName: true,
      sourceUrl: true,
      officialAnswerKeyReference: true,
      reviewState: true,
      isActive: true,
      status: true,
      contentClass: true,
      subject: { select: { code: true } },
      translations: true,
    },
  });
  if (questions.length !== 180) throw new Error(`FOUND must be 180; found ${questions.length}.`);

  const alreadyApproved = questions.filter((question) => question.reviewState === 'APPROVED');
  const eligible = questions.filter((question) =>
    (question.reviewState === 'REVIEW_REQUIRED' && approvalIssues(question).length === 0)
    || (question.reviewState === 'DRAFT' && approvalIssues({ ...question, topic: topics.get(question.externalId ?? '') ?? '' }).length === 0));
  const ineligible = questions.filter((question) => question.reviewState !== 'APPROVED' && !eligible.includes(question));
  const currentReviewState = questions.reduce<Record<string, number>>((counts, question) => {
    counts[question.reviewState] = (counts[question.reviewState] ?? 0) + 1;
    return counts;
  }, {});
  const report = {
    mode: dryRun ? 'DRY_RUN' : 'EXECUTE',
    target: { database, direct },
    selected: externalIds.length,
    found: questions.length,
    currentReviewState,
    eligible: eligible.length,
    alreadyApproved: alreadyApproved.length,
    ineligible: ineligible.map((question) => ({ externalId: question.externalId, reviewState: question.reviewState, issues: approvalIssues(question) })),
    unrelated: 0,
  };
  console.log(JSON.stringify(report, null, 2));
  if (ineligible.length || eligible.length + alreadyApproved.length !== 180) {
    throw new Error('Unexpected or ineligible selected questions were found.');
  }
  if (dryRun) return;

  const activeAdmins = await prisma.admin.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true } });
  const requestedEmail = process.env.NEET_SELECTION_APPROVER_EMAIL?.trim().toLowerCase();
  const requestedName = process.env.NEET_SELECTION_APPROVER_NAME?.trim();
  const matches = requestedEmail
    ? activeAdmins.filter((admin) => admin.email.toLowerCase() === requestedEmail)
    : requestedName ? activeAdmins.filter((admin) => admin.name === requestedName) : activeAdmins;
  const reviewer = matches.length === 1 ? matches[0] : undefined;
  if (!reviewer) throw new Error('Set NEET_SELECTION_APPROVER_EMAIL or unique NEET_SELECTION_APPROVER_NAME to the authenticated active administrator.');

  for (const question of questions) {
    if (question.reviewState === 'DRAFT') {
      await submitImportedQuestionForReview(question.id, { sub: reviewer.id, name: reviewer.name }, topics.get(question.externalId ?? '') ?? '');
    }
    await approveQuestion(question.id, { sub: reviewer.id, name: reviewer.name }, { allowAlreadyApproved: true });
  }

  const verified = await prisma.question.findMany({
    where: { externalId: { in: externalIds } },
    select: { reviewState: true, isActive: true, status: true, contentClass: true, subject: { select: { code: true } } },
  });
  const counts = verified.reduce<Record<string, number>>((result, question) => {
    result[question.subject.code] = (result[question.subject.code] ?? 0) + 1;
    return result;
  }, {});
  const approved = verified.filter((question) => question.reviewState === 'APPROVED').length;
  const activeEligible = verified.filter((question) => question.reviewState === 'APPROVED' && question.isActive && question.status === 'PUBLISHED' && question.contentClass === 'PRODUCTION').length;
  console.log(JSON.stringify({ verified: verified.length, approved, activeEligible, counts, unrelatedModified: 0 }, null, 2));
  if (approved !== 180 || activeEligible !== 180) throw new Error('Post-approval verification failed.');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
