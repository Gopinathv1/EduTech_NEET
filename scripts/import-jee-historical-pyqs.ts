import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { writeQuestionVersion } from '../lib/admin/question-version';
import {
  assertJeeDatabaseTargets, assertJeeWriteAuthorization, jeeQuestionData, JEE_RELEASE_BATCH_SIZE,
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
  assertJeeWriteAuthorization({ execute, releaseSha256: release.releaseSha256, action: 'IMPORT',
    confirmation: process.env.JEE_HISTORICAL_IMPORT_CONFIRM, confirmedHash: process.env.JEE_HISTORICAL_RELEASE_SHA256 });
  const client = new PrismaClient({ datasourceUrl: directUrl });
  try {
    const preflight = await readJeeReleaseDatabase(client, release.questions, release.releaseSha256);
    const missing = preflight.prepared.filter(entry => !entry.prior);
    const blockers = [...release.readinessBlockers, ...preflight.blockers];
    console.log(JSON.stringify({
      mode: execute ? 'EXECUTE' : 'DRY_RUN', scope: release.manifest.scope, releaseSha256: release.releaseSha256,
      target, ...preflight.counts, existing: preflight.existing.length,
      projectedImportQuestionVersionRecords: missing.length, projectedImportAuditLogRecords: missing.length,
      byYear: Object.fromEntries([2021, 2022, 2023, 2024, 2025].map(year => [year, release.questions.filter(question => question.year === year).length])),
      readinessBlockers: blockers, ready: blockers.length === 0,
    }, null, 2));
    if (preflight.blockers.length) throw new Error('JEE import database preflight failed.');
    if (!execute) return;
    if (blockers.length) throw new Error('JEE release is not ready for production import.');

    for (let start = 0; start < missing.length; start += JEE_RELEASE_BATCH_SIZE) {
      const batch = missing.slice(start, start + JEE_RELEASE_BATCH_SIZE);
      await client.$transaction(async tx => {
        for (const entry of batch) {
          const created = await tx.question.create({ data: jeeQuestionData(entry.question, entry.subjectId!, entry.chapterId!) });
          await writeQuestionVersion(tx, created.id, 'jee-historical:imported', preflight.admin);
          await tx.auditLog.create({ data: {
            adminId: preflight.admin.sub, adminName: preflight.admin.name, action: 'question.jeeHistoricalImport',
            entityType: 'Question', entityId: created.id,
            details: { scope: release.manifest.scope, releaseSha256: release.releaseSha256, externalId: entry.question.externalId,
              paperId: entry.question.paperId, ntaQuestionId: entry.question.questionId },
          } });
        }
      }, { maxWait: 10_000, timeout: 30_000 });
      console.log(JSON.stringify({ completedBatch: Math.floor(start / JEE_RELEASE_BATCH_SIZE) + 1,
        imported: Math.min(start + batch.length, missing.length), missing: missing.length }));
    }
    const verified = await readJeeReleaseDatabase(client, release.questions, release.releaseSha256);
    if (verified.blockers.length || verified.counts.questionsToImport) throw new Error('JEE post-import content/history verification failed.');
    console.log(JSON.stringify({ importedOrVerified: release.questions.length, questionVersionsAdded: missing.length,
      auditLogsAdded: missing.length, unrelatedRecordsModified: 0 }, null, 2));
  } finally { await client.$disconnect(); }
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
