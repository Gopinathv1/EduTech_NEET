/** Exercise the exact additive SQL only in a disposable, guarded CI schema. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { MONITORING_EVENT_TYPES } from '../lib/attempts/monitoring-contract';

let stage = 'checking disposable CI targets';

function guardedCiUrls() {
  if (process.env.CI !== 'true') throw new Error('Monitoring migration check requires disposable CI.');
  return (['DATABASE_URL', 'DIRECT_URL'] as const).map(name => {
    const url = new URL(process.env[name] ?? '');
    if (!['postgres:', 'postgresql:'].includes(url.protocol)
      || !['localhost', '127.0.0.1'].includes(url.hostname)
      || url.port !== '5432' || url.pathname !== '/neet_test'
      || url.searchParams.has('host') || url.searchParams.get('pgbouncer') === 'true') {
      throw new Error('Monitoring migration check requires both URLs to target localhost:5432/neet_test.');
    }
    return url;
  });
}

async function main() {
  // The guard runs before client construction, CLI invocation or any DB call.
  const [runtimeUrl, directUrl] = guardedCiUrls();
  const namespace = `monitoring_migration_check_${randomUUID().replaceAll('-', '')}`;
  assert.match(namespace, /^monitoring_migration_check_[a-f0-9]{32}$/);
  const control = new PrismaClient({ datasources: { db: { url: directUrl.toString() } } });
  let created = false;
  let isolated: PrismaClient | undefined;
  try {
    stage = 'creating the isolated schema';
    await control.$executeRawUnsafe(`CREATE SCHEMA "${namespace}"`);
    created = true;
    // The FK needs only this disposable id column, not real attempts/content.
    await control.$executeRawUnsafe(`CREATE TABLE "${namespace}"."TestAttempt" ("id" TEXT PRIMARY KEY)`);
    runtimeUrl.searchParams.set('schema', namespace);
    directUrl.searchParams.set('schema', namespace);
    stage = 'applying the exact SQL file';
    const applied = spawnSync(process.execPath, [
      resolve('node_modules/prisma/build/index.js'), 'db', 'execute',
      '--schema', 'prisma/schema.prisma',
      '--file', 'prisma/migrations/20261007120000_attempt_monitoring_events/migration.sql',
    ], {
      env: { ...process.env, DATABASE_URL: runtimeUrl.toString(), DIRECT_URL: directUrl.toString() },
      windowsHide: true, encoding: 'utf8', timeout: 60_000,
    });
    // Do not emit CLI output: a failure must never print connection credentials.
    if (applied.status !== 0) throw new Error('Exact monitoring migration SQL failed in its isolated CI schema.');
    isolated = new PrismaClient({ datasources: { db: { url: directUrl.toString() } } });
    stage = 'checking enum, columns and indexes';
    const enumRows = await isolated.$queryRaw<Array<{ value: string }>>`
      SELECT e.enumlabel AS value FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = ${namespace} AND t.typname = 'AttemptMonitoringEventType'
      ORDER BY e.enumsortorder`;
    assert.deepEqual(enumRows.map(row => row.value), [...MONITORING_EVENT_TYPES]);
    const columns = await isolated.$queryRaw<Array<{ column_name: string; data_type: string; column_default: string | null }>>`
      SELECT column_name, data_type, column_default FROM information_schema.columns
      WHERE table_schema = ${namespace} AND table_name = 'AttemptMonitoringEvent'`;
    assert.deepEqual(columns.map(row => row.column_name).sort(),
      ['id', 'attemptId', 'clientEventId', 'eventType', 'recordedAt', 'clientTimestamp', 'sequence'].sort());
    assert.equal(columns.find(row => row.column_name === 'clientEventId')?.data_type, 'uuid');
    assert.match(columns.find(row => row.column_name === 'recordedAt')?.column_default ?? '', /CURRENT_TIMESTAMP/i);
    const indexes = await isolated.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes WHERE schemaname = ${namespace} AND tablename = 'AttemptMonitoringEvent'`;
    assert.deepEqual(indexes.map(row => row.indexname).sort(), [
      'AttemptMonitoringEvent_pkey', 'AttemptMonitoringEvent_attemptId_clientEventId_key',
      'AttemptMonitoringEvent_attemptId_recordedAt_idx',
    ].sort());
    stage = 'checking receipt time and constraints';
    await isolated.$executeRaw`INSERT INTO "TestAttempt" ("id") VALUES ('migration-probe-attempt')`;
    const clientEventId = randomUUID();
    const beforeInsert = Date.now();
    await isolated.$executeRaw`
      INSERT INTO "AttemptMonitoringEvent" ("id", "attemptId", "clientEventId", "eventType", "clientTimestamp", "sequence")
      VALUES ('migration-probe-event', 'migration-probe-attempt', ${clientEventId}::uuid, 'TAB_HIDDEN', '2000-01-01', 1)`;
    const records = await isolated.$queryRaw<Array<{ recordedAt: Date; clientTimestamp: Date }>>`
      SELECT "recordedAt", "clientTimestamp" FROM "AttemptMonitoringEvent"`;
    assert.equal(records.length, 1);
    assert.ok(records[0].recordedAt.getTime() >= beforeInsert - 1_000);
    assert.equal(records[0].clientTimestamp.getUTCFullYear(), 2000);
    await assert.rejects(() => isolated!.$executeRaw`
      INSERT INTO "AttemptMonitoringEvent" ("id", "attemptId", "clientEventId", "eventType")
      VALUES ('duplicate-event', 'migration-probe-attempt', ${clientEventId}::uuid, 'TAB_HIDDEN')`);
    await assert.rejects(() => isolated!.$executeRaw`
      INSERT INTO "AttemptMonitoringEvent" ("id", "attemptId", "clientEventId", "eventType")
      VALUES ('foreign-event', 'missing-attempt', ${randomUUID()}::uuid, 'TAB_HIDDEN')`);
    await assert.rejects(() => isolated!.$executeRaw`
      INSERT INTO "AttemptMonitoringEvent" ("id", "attemptId", "clientEventId", "eventType")
      VALUES ('invalid-type', 'migration-probe-attempt', ${randomUUID()}::uuid, 'UNKNOWN_SIGNAL')`);
    stage = 'checking FK cascades';
    await isolated.$executeRaw`UPDATE "TestAttempt" SET "id" = 'migration-probe-renamed' WHERE "id" = 'migration-probe-attempt'`;
    const changed = await isolated.$queryRaw<Array<{ attemptId: string }>>`SELECT "attemptId" FROM "AttemptMonitoringEvent"`;
    assert.equal(changed[0].attemptId, 'migration-probe-renamed');
    await isolated.$executeRaw`DELETE FROM "TestAttempt" WHERE "id" = 'migration-probe-renamed'`;
    const count = await isolated.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) AS count FROM "AttemptMonitoringEvent"`;
    assert.equal(count[0].count, BigInt(0));
    console.log('Monitoring migration SQL passed in isolated CI schema: enum, columns, receipt time, indexes, deduplication and cascading FK.');
  } finally {
    await isolated?.$disconnect();
    // Only a successfully created namespace owned by this run is removed.
    if (created) await control.$executeRawUnsafe(`DROP SCHEMA "${namespace}" CASCADE`);
    await control.$disconnect();
  }
}

main().catch(() => {
  console.error(`Monitoring migration check failed while ${stage}; no production target was accessed.`);
  process.exitCode = 1;
});
