/** Read-only production preflight. No write mode exists in this run. */
import { loadEnvConfig } from '@next/env';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import manifest from '../data/question-translations-v1/proof-manifest.json';
import { canonicalContentHash, translationQa } from '../lib/question-translations/content';
import { assertJeeDatabaseTargets, loadJeeRelease, prepareJeeRelease, jeeReleaseHistoryIssues, type ExistingJeeReleaseQuestion } from '../lib/previous-year/jee-release';
import { buildJeePracticePlans } from '../lib/previous-year/jee-practice';

const legacyTranslationSelect = { id: true, questionId: true, language: true, questionText: true, optionA: true, optionB: true, optionC: true, optionD: true,
  correctOption: true, numericAnswer: true, numericTolerance: true, explanation: true, reviewed: true, createdAt: true, updatedAt: true } as const;
const assert = (value: unknown, message: string) => { if (!value) throw new Error(message); };
function stable(value: unknown): string {
  const sorted = (item: unknown): unknown => Array.isArray(item) ? item.map(sorted)
    : item && typeof item === 'object' ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, sorted(child)])) : item;
  return JSON.stringify(sorted(value));
}
async function main() {
  if (process.argv.includes('--write') || process.argv.includes('--import')) throw new Error('This script is read-only. Production writes are not authorized.');
  loadEnvConfig(process.cwd());
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) throw new Error('Both database URLs required.');
  assertJeeDatabaseTargets(process.env.DATABASE_URL, process.env.DIRECT_URL);
  const direct = new URL(process.env.DIRECT_URL);
  assert(direct.hostname === 'ep-mute-dawn-azv2zau2.c-3.ap-southeast-1.aws.neon.tech' && direct.pathname === '/NEET', 'Expected protected production database.');
  assert(createHash('sha256').update(JSON.stringify(manifest.records)).digest('hex') === manifest.releaseSha256, 'Proof manifest checksum mismatch.');
  assert(manifest.records.length === 20 && manifest.records.every(row => row.reviewState === 'REVIEW_REQUIRED' && row.translationSource === 'SIVORA_TRANSLATION'), 'Unexpected proof scope.');
  const db = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });
  try {
    const unique = [...new Set(manifest.records.map(row => row.externalId))];
    const questions = await db.question.findMany({ where: { externalId: { in: unique } }, include: { translations: { select: legacyTranslationSelect }, subject: { select: { code: true } } } });
    assert(questions.length === 10, 'Missing canonical proof identity.');
    for (const record of manifest.records) {
      const q = questions.find(row => row.externalId === record.externalId)!;
      const en = q.translations.find(row => row.language === 'en');
      assert(q.isActive && q.reviewState === 'APPROVED' && q.status === 'PUBLISHED' && q.contentClass === 'PRODUCTION', 'Canonical proof question is not approved production content.');
      assert(q.questionType === record.questionType && q.questionNature === record.questionNature && q.subject.code === record.subjectCode, 'Proof canonical taxonomy/type/nature differs.');
      assert(en && canonicalContentHash(q.questionType, en) === record.canonicalContentHash && !translationQa(q.questionType, en, record.content).length, 'Canonical English answer/content hash or translation QA differs.');
      assert(!q.translations.some(row => row.language === record.language), 'A proof translation already exists; no overwrite allowed.');
    }
    const release = await loadJeeRelease({ requireReady: true });
    assert(release.releaseSha256 === '1fdd7f03266ef2cdc8a0b9a9d1523821913996b47cc49d427cd43fe394dbc63e', 'Protected JEE release changed.');
    const existing = await db.question.findMany({ where: { externalId: { in: release.questions.map(row => row.externalId) } }, include: { translations: { select: legacyTranslationSelect } } });
    assert(existing.length === 218, 'JEE count changed.');
    const subjects = await db.subject.findMany({ where: { code: { in: ['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS'] } }, select: { id: true, code: true } });
    const chapters = await db.chapter.findMany({ where: { subjectId: { in: subjects.map(row => row.id) } }, select: { id: true, subjectId: true, name: true } });
    assert(!prepareJeeRelease(release.questions, subjects, chapters, existing as ExistingJeeReleaseQuestion[]).blockers.length, 'JEE canonical content/taxonomy differs.');
    for (const prior of existing) {
      assert(prior.reviewState === 'APPROVED' && prior.isActive, 'JEE approval differs.');
    }
    assert(!(await jeeReleaseHistoryIssues(db, existing as ExistingJeeReleaseQuestion[], release.releaseSha256)).length, 'JEE question history changed.');
    const plans = buildJeePracticePlans(release.questions);
    const tests = await db.test.findMany({ where: { id: { in: plans.map(row => row.id) } }, include: { testQuestions: { orderBy: { order: 'asc' } } } });
    assert(tests.length === 227, 'JEE practice count changed.');
    for (const plan of plans) {
      const test = tests.find(row => row.id === plan.id)!;
      const rows = plan.externalIds.map(id => existing.find(row => row.externalId === id)!);
      const subjectIds = [...new Set(rows.map(row => row.subjectId))];
      const chapterIds = [...new Set(rows.map(row => row.chapterId))];
      const expectedRules = { ...plan.rules, ...(plan.isRandom ? { random: {
        scope: plan.testType === 'FULL_TEST' ? 'FULL_SYLLABUS' : plan.chapterSlug ? 'CHAPTERS' : 'SUBJECTS',
        subjectIds, ...(plan.chapterSlug ? { chapterIds } : {}),
        subjectCounts: Object.fromEntries(subjectIds.map(id => [id, plan.testType === 'FULL_TEST' ? 25 : rows.filter(row => row.subjectId === id).length])),
      } } : {}) };
      assert(test.isPublished && test.contentClass === 'PRODUCTION' && test.price === 0 && test.totalQuestions === plan.totalQuestions
        && test.durationMinutes === plan.durationMinutes && test.isRandom === plan.isRandom && test.testType === plan.testType
        && test.subjectId === (subjectIds.length === 1 ? subjectIds[0] : null) && test.chapterId === (plan.chapterSlug ? chapterIds[0] : null)
        && stable(test.title) === stable({ en: plan.title, ta: '', hi: '' }) && stable(test.description) === stable({ en: plan.description, ta: '', hi: '' })
        && stable(test.rules) === stable(expectedRules)
        && JSON.stringify(test.availableLanguages) === JSON.stringify(['en']), 'JEE practice definition changed.');
      const ids = plan.isRandom ? [] : plan.externalIds.map(id => existing.find(row => row.externalId === id)!.id);
      assert(test.testQuestions.length === ids.length && test.testQuestions.every((row, index) => row.questionId === ids[index] && row.order === index + 1), 'JEE memberships changed.');
    }
    const migrations = await db.$queryRaw<Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>>`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`;
    assert(!migrations.some(row => !row.finished_at && !row.rolled_back_at), 'Failed production migration.');
    assert(!migrations.some(row => row.migration_name === '20261007150000_question_translation_review'), 'Translation migration unexpectedly applied.');
    const sqlHash = createHash('sha256').update(await readFile('prisma/migrations/20261007150000_question_translation_review/migration.sql')).digest('hex');
    // Aggregate fingerprints stay inside Postgres; no attempt/answer/student data is exported.
    const history: Record<string, unknown> = {};
    for (const table of ['TestAttempt', 'Answer', 'Result', 'AttemptMonitoringEvent'] as const) {
      history[table] = await db.$queryRawUnsafe(`SELECT COUNT(*)::integer AS count, md5(COALESCE(string_agg(md5(row_to_json(t)::text), '' ORDER BY t.id), '')) AS fingerprint FROM "${table}" t`);
    }
    console.log(JSON.stringify({ status: 'VERIFIED_READ_ONLY', proofReleaseSha256: manifest.releaseSha256, migrationSqlSha256: sqlHash,
      questions: 10, neet: 5, jee: 5, translationsToInsert: 20, tamil: 10, hindi: 10, translationVersions: 20, auditLogs: 20, reviewState: 'REVIEW_REQUIRED',
      studentVisibleBeforeApproval: 0, jeeQuestions: 218, jeePractices: 227, jeeMemberships: 436, jeeQuarantine: release.quarantine.length,
      existingApplicationRowsModified: 0, productionWrites: 0, protectedHistoryAggregates: history }, null, 2));
  } finally { await db.$disconnect(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Read-only proof preflight failed.'); process.exitCode = 1; });
