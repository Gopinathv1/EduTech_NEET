import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { approveQuestion, submitImportedQuestionForReview } from '../lib/admin/question-approval';
import {
  assertJeeDatabaseTargets, assertJeeWriteAuthorization, jeeExistingContentIssues, JEE_RELEASE_BATCH_SIZE,
  loadJeeRelease, readJeeReleaseDatabase,
} from '../lib/previous-year/jee-release';

loadEnvConfig(process.cwd());
const execute = process.argv.includes('--execute');

async function main() {
  const release = await loadJeeRelease({ requireReady: execute });
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  if (!databaseUrl || !directUrl) throw new Error('DATABASE_URL and DIRECT_URL are required.');
  const target = assertJeeDatabaseTargets(databaseUrl, directUrl);
  assertJeeWriteAuthorization({ execute, releaseSha256: release.releaseSha256, action: 'APPROVE',
    confirmation: process.env.JEE_HISTORICAL_APPROVAL_CONFIRM, confirmedHash: process.env.JEE_HISTORICAL_RELEASE_SHA256 });
  const client = new PrismaClient({ datasourceUrl: directUrl });
  try {
    const preflight = await readJeeReleaseDatabase(client, release.questions, release.releaseSha256);
    const blockers = [...release.readinessBlockers, ...preflight.blockers];
    console.log(JSON.stringify({ mode: execute ? 'EXECUTE' : 'DRY_RUN', scope: release.manifest.scope,
      releaseSha256: release.releaseSha256, target, ...preflight.counts,
      existing: preflight.existing.length, alreadyApproved: preflight.existing.filter(question => question.reviewState === 'APPROVED').length,
      approvalDryRunBasis: preflight.counts.questionsToImport ? 'Exact canonical projections for not-yet-imported questions' : 'Existing exact-manifest rows',
      projectedApprovalQuestionVersionRecords: preflight.counts.reviewTransitions + preflight.counts.questionsToApprove,
      projectedApprovalAuditLogRecords: preflight.counts.reviewTransitions + preflight.counts.questionsToApprove,
      readinessBlockers: blockers, ready: blockers.length === 0,
    }, null, 2));
    if (preflight.blockers.length) throw new Error('JEE approval database preflight failed.');
    if (!execute) return;
    if (blockers.length || preflight.counts.questionsToImport) throw new Error('All exact JEE questions must be imported before approval execution.');

    const options = { client, atomicAudit: true, allowChapterOnly: true };
    const selection = preflight.prepared.filter(entry => entry.prior?.reviewState !== 'APPROVED');
    for (let start = 0; start < selection.length; start += JEE_RELEASE_BATCH_SIZE) {
      for (const entry of selection.slice(start, start + JEE_RELEASE_BATCH_SIZE)) {
        let current = await client.question.findUnique({ where: { externalId: entry.question.externalId }, include: { translations: true } });
        if (!current || jeeExistingContentIssues(entry.question, current, entry.subjectId!, entry.chapterId!).length) throw new Error(`${entry.question.externalId}: content changed after approval preflight.`);
        if (current.reviewState === 'DRAFT') {
          await submitImportedQuestionForReview(current.id, preflight.admin, entry.question.topic, { ...options, expectedUpdatedAt: current.updatedAt });
          current = await client.question.findUnique({ where: { id: current.id }, include: { translations: true } });
        }
        if (!current || jeeExistingContentIssues(entry.question, current, entry.subjectId!, entry.chapterId!).length) throw new Error(`${entry.question.externalId}: content changed before approval.`);
        await approveQuestion(current.id, preflight.admin, { ...options, expectedUpdatedAt: current.updatedAt, allowAlreadyApproved: true,
          note: `Validated JEE historical 2021–2025 V1; release ${release.releaseSha256}` });
      }
      console.log(JSON.stringify({ approvedOrVerified: Math.min(start + JEE_RELEASE_BATCH_SIZE, selection.length), selectedForApproval: selection.length }));
    }
    const verified = await readJeeReleaseDatabase(client, release.questions, release.releaseSha256);
    if (verified.blockers.length || verified.counts.questionsToApprove || verified.counts.questionsToImport) throw new Error('JEE post-approval content/history verification failed.');
    console.log(JSON.stringify({ approved: release.questions.length,
      questionVersionsAdded: preflight.counts.reviewTransitions + preflight.counts.questionsToApprove,
      auditLogsAdded: preflight.counts.reviewTransitions + preflight.counts.questionsToApprove,
      unrelatedRecordsModified: 0 }, null, 2));
  } finally { await client.$disconnect(); }
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
