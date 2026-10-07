import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { assertDisposableCiDatabase } from '../lib/testing/disposable-database';

async function main() {
  const [runtimeUrl, directUrl] = assertDisposableCiDatabase();
  const namespace = `translation_migration_check_${randomUUID().replaceAll('-', '')}`;
  assert.match(namespace, /^translation_migration_check_[a-f0-9]{32}$/);
  const control = new PrismaClient({ datasourceUrl: directUrl.toString() });
  let created = false;
  let isolated: PrismaClient | undefined;
  try {
    await control.$executeRawUnsafe(`CREATE SCHEMA "${namespace}"`); created = true;
    await control.$executeRawUnsafe(`CREATE TYPE "${namespace}"."QuestionReviewState" AS ENUM ('DRAFT', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'NEEDS_CORRECTION')`);
    await control.$executeRawUnsafe(`CREATE TABLE "${namespace}"."QuestionTranslation" (
      "id" TEXT PRIMARY KEY, "questionId" TEXT NOT NULL, "language" TEXT NOT NULL, "questionText" TEXT NOT NULL,
      "optionA" TEXT, "optionB" TEXT, "optionC" TEXT, "optionD" TEXT, "correctOption" TEXT,
      "numericAnswer" DECIMAL(18,8), "numericTolerance" DECIMAL(18,8), "explanation" TEXT,
      "reviewed" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE("questionId", "language"))`);
    await control.$executeRawUnsafe(`INSERT INTO "${namespace}"."QuestionTranslation" ("id", "questionId", "language", "questionText", "optionA", "optionB", "optionC", "optionD", "correctOption", "reviewed") VALUES ('english', 'probe-question', 'en', 'Canonical 2 + 3', '2', '3', '5', '6', 'C', true)`);
    const before = await control.$queryRawUnsafe(`SELECT "questionText", "optionA", "optionB", "optionC", "optionD", "correctOption", "reviewed", "createdAt", "updatedAt" FROM "${namespace}"."QuestionTranslation"`);
    runtimeUrl.searchParams.set('schema', namespace); directUrl.searchParams.set('schema', namespace);
    const applied = spawnSync(process.execPath, [resolve('node_modules/prisma/build/index.js'), 'db', 'execute', '--schema', 'prisma/schema.prisma',
      '--file', 'prisma/migrations/20261007150000_question_translation_review/migration.sql'], {
      env: { ...process.env, DATABASE_URL: runtimeUrl.toString(), DIRECT_URL: directUrl.toString() }, windowsHide: true, encoding: 'utf8', timeout: 60_000,
    });
    if (applied.status !== 0) throw new Error('Exact translation migration failed.');
    isolated = new PrismaClient({ datasourceUrl: directUrl.toString() });
    const after = await isolated.$queryRaw`SELECT "questionText", "optionA", "optionB", "optionC", "optionD", "correctOption", "reviewed", "createdAt", "updatedAt" FROM "QuestionTranslation"`;
    assert.deepEqual(after, before);
    const english = await isolated.questionTranslation.findUniqueOrThrow({ where: { id: 'english' } });
    assert.equal(english.reviewState, 'DRAFT'); assert.equal(english.canonicalContentHash, null); assert.equal(english.revision, 0);
    const columns = await isolated.$queryRaw<Array<{ column_name: string }>>`SELECT column_name FROM information_schema.columns WHERE table_schema = ${namespace} AND table_name = 'QuestionTranslation'`;
    assert.equal(columns.length, 24);
    const enums = await isolated.$queryRaw<Array<{ value: string }>>`SELECT e.enumlabel AS value FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname=${namespace} AND t.typname='QuestionTranslationSource' ORDER BY e.enumsortorder`;
    assert.deepEqual(enums.map(row => row.value), ['OFFICIAL_TRANSLATION', 'SIVORA_TRANSLATION']);
    await isolated.questionTranslationVersion.create({ data: { translationId: 'english', revision: 1, action: 'probe', editedById: 'ci-editor', editedByName: 'CI', snapshot: { unchanged: true } } });
    await assert.rejects(() => isolated!.questionTranslationVersion.create({ data: { translationId: 'english', revision: 1, action: 'duplicate', editedById: 'ci-editor', editedByName: 'CI', snapshot: {} } }));
    await assert.rejects(() => isolated!.questionTranslationVersion.create({ data: { translationId: 'missing', revision: 1, action: 'foreign', editedById: 'ci-editor', editedByName: 'CI', snapshot: {} } }));
    await isolated.questionTranslation.delete({ where: { id: 'english' } });
    assert.equal(await isolated.questionTranslationVersion.count(), 0);
    console.log('Exact translation migration PASS: additive columns/enum/history, unchanged English fields, no legacy auto-approval, unique revisions and FK cascade.');
  } finally {
    await isolated?.$disconnect();
    if (created) await control.$executeRawUnsafe(`DROP SCHEMA "${namespace}" CASCADE`);
    await control.$disconnect();
  }
}
main().catch(() => { console.error('Translation migration probe failed in disposable CI; no production access.'); process.exitCode = 1; });
