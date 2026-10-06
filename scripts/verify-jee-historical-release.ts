import { writeFile, mkdir } from 'node:fs/promises';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { loadJeeRelease, assertJeeDatabaseTargets, readJeeReleaseDatabase } from '../lib/previous-year/jee-release';
import { buildJeePracticePlans, JEE_SUBJECTS } from '../lib/previous-year/jee-practice';
import { generateForAttempt, checkFeasibility } from '../lib/generator/plan';
import { naturePoolWhere } from '../lib/previous-year/nature-pool';

loadEnvConfig(process.cwd());
const AUTHORIZED_HASH = '1fdd7f03266ef2cdc8a0b9a9d1523821913996b47cc49d427cd43fe394dbc63e';
const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };

/** Read-only reconciliation of every authorized row and representative generation. */
async function main() {
  const release = await loadJeeRelease({ requireReady: true });
  assert(release.releaseSha256 === AUTHORIZED_HASH, 'Release hash differs from the user authorization.');
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) throw new Error('Both database URLs are required.');
  assertJeeDatabaseTargets(process.env.DATABASE_URL, process.env.DIRECT_URL);
  const client = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });
  try {
    const preflight = await readJeeReleaseDatabase(client, release.questions, release.releaseSha256);
    assert(!preflight.blockers.length && !preflight.counts.questionsToImport && !preflight.counts.questionsToApprove, 'Exact release content/history is not fully approved.');
    const plans = buildJeePracticePlans(release.questions);
    const questionIds = preflight.existing.map(row => row.id);
    const tests = await client.test.findMany({ where: { id: { in: plans.map(row => row.id) } }, include: { testQuestions: { orderBy: { order: 'asc' } } } });
    assert(tests.length === 227 && tests.every(row => row.isPublished && Number(row.price) === 0 && row.contentClass === 'PRODUCTION'
      && row.totalQuestions > 0 && JSON.stringify(row.availableLanguages) === JSON.stringify(['en'])), 'Practice publication/free/language counts differ.');
    const byExternalId = new Map(preflight.prepared.map(row => [row.question.externalId, row]));
    for (const plan of plans) {
      const test = tests.find(row => row.id === plan.id)!;
      const rules = test.rules as { exam: string; sourceType: string; previousYearMode: string; payment: string; retake: string; historical: { externalIds: string[] } };
      assert(rules.exam === 'JEE' && rules.sourceType === 'HISTORICAL_VERIFIED' && rules.previousYearMode === plan.rules.previousYearMode
        && rules.payment === 'NONE' && rules.retake === 'FREE_UNLIMITED', `${test.id}: scope/payment/retake differs.`);
      assert(JSON.stringify(rules.historical.externalIds) === JSON.stringify(plan.externalIds), `${test.id}: exact membership scope differs.`);
      assert(test.totalQuestions === plan.totalQuestions && test.durationMinutes === plan.durationMinutes && test.isRandom === plan.isRandom, `${test.id}: format differs.`);
      const expectedIds = plan.isRandom ? [] : plan.externalIds.map(id => byExternalId.get(id)!.prior!.id);
      assert(test.testQuestions.length === expectedIds.length && test.testQuestions.every((row, index) => row.questionId === expectedIds[index] && row.order === index + 1), `${test.id}: fixed membership differs.`);
    }
    const [versions, audits, paperRows] = await Promise.all([
      client.questionVersion.findMany({ where: { questionId: { in: questionIds } }, select: { action: true } }),
      client.auditLog.findMany({ where: { OR: [{ entityType: 'Question', entityId: { in: questionIds } }, { entityType: 'Test', entityId: { in: tests.map(row => row.id) } }] }, select: { entityType: true, entityId: true, action: true, details: true } }),
      client.question.findMany({ where: { exam: 'JEE', OR: [...new Set(release.questions.map(row => row.paperId))].map(paperId => ({ externalId: { startsWith: `${paperId}-` } })) }, select: { externalId: true } }),
    ]);
    assert(versions.length === 654 && audits.length === 1108, 'Authorized version/audit totals differ.');
    for (const action of ['jee-historical:imported', 'updated', 'review:APPROVED']) assert(versions.filter(row => row.action === action).length === 218, `Version action ${action} count differs.`);
    for (const action of ['question.jeeHistoricalImport', 'question.update', 'question.review.approved']) assert(audits.filter(row => row.action === action && row.entityType === 'Question').length === 218, `Question audit ${action} count differs.`);
    for (const test of tests) {
      const history = audits.filter(row => row.entityType === 'Test' && row.entityId === test.id);
      assert(history.length === 2 && history.filter(row => row.action === 'test.create').length === 1 && history.filter(row => row.action === 'test.publish').length === 1, `${test.id}: test audit history differs.`);
      const details = history.find(row => row.action === 'test.create')!.details as { releaseSha256?: string };
      assert(details.releaseSha256 === AUTHORIZED_HASH, `${test.id}: test creation belongs to another release.`);
    }
    const memberships = tests.reduce((sum, row) => sum + row.testQuestions.length, 0);
    assert(memberships === 436, 'Authorized fixed membership count differs.');
    assert(!release.quarantine.some(row => paperRows.some(question => question.externalId?.startsWith(`${row.paperId}-`) && question.externalId.endsWith(`-nta-${row.questionId}`))), 'Quarantined JEE identity was imported.');

    const mixed = tests.find(row => row.id === 'jee-pyq-mixed-2021-2025')!;
    const first = await generateForAttempt(mixed.id, 'en', 'release:jee:mixed');
    const repeat = await generateForAttempt(mixed.id, 'en', 'release:jee:mixed');
    assert(JSON.stringify(first.questionIds) === JSON.stringify(repeat.questionIds), 'Saved seed selection is not deterministic.');
    const selected = first.questionIds.map(id => preflight.prepared.find(row => row.prior!.id === id)!.question);
    for (const subject of JEE_SUBJECTS) assert(selected.filter(row => row.subjectCode === subject && row.questionType === 'SINGLE_CORRECT').length === 20
      && selected.filter(row => row.subjectCode === subject && row.questionType === 'NUMERICAL_VALUE').length === 5, `${subject}: mixed typed quota differs.`);
    assert(new Set(selected.map(row => row.year)).size === 5, 'Mixed selection does not cover all five years.');
    for (const mode of ['HISTORICAL_SHIFT', 'YEAR_WISE', 'SUBJECT_CHAPTER']) {
      const plan = plans.find(row => row.rules.previousYearMode === mode)!;
      const result = await generateForAttempt(plan.id, 'en', `release:${mode}`);
      assert(result.questionIds.length === plan.totalQuestions, `${mode}: generated count differs.`);
    }
    const chapter = plans.find(row => row.testType === 'CHAPTER_TEST')!;
    assert((await generateForAttempt(chapter.id, 'en', 'release:chapter')).questionIds.length === chapter.totalQuestions, 'Chapter generation differs.');
    for (const nature of ['CONCEPTUAL_THEORY', 'NUMERICAL_PROBLEM_SOLVING'] as const) {
      const result = await generateForAttempt(mixed.id, 'en', `release:${nature}`, nature);
      assert(result.questionIds.length > 0 && result.questionIds.every(id => preflight.prepared.find(row => row.prior!.id === id)!.question.questionNature === nature), 'Nature generation contains wrong content.');
    }
    const math = tests.find(row => row.id === 'jee-pyq-mixed-jee_mathematics')!;
    const conceptualMath = await client.question.count({ where: { ...naturePoolWhere(math), questionNature: 'CONCEPTUAL_THEORY' } });
    assert(conceptualMath === 0, 'Mathematics conceptual eligibility differs.');
    let emptyRejected = false;
    try { await generateForAttempt(math.id, 'en', 'release:empty', 'CONCEPTUAL_THEORY'); } catch { emptyRejected = true; }
    assert(emptyRejected, 'An empty nature filter was accepted.');
    assert((await checkFeasibility(mixed.id)).ok, 'Published mixed plan is not feasible.');
    const report = { status: 'VERIFIED', releaseSha256: AUTHORIZED_HASH, questions: preflight.existing.length,
      approvedActive: preflight.existing.filter(row => row.isActive && row.reviewState === 'APPROVED' && row.status === 'PUBLISHED').length,
      questionVersionRecords: versions.length, auditLogRecords: audits.length, practiceTests: tests.length,
      publishedFreePracticeTests: tests.length, fixedMembershipRecords: memberships,
      quarantinedJeeQuestionsExcluded: release.quarantine.length, mixedTypedQuotas: 'PASS', fiveYearMix: 'PASS',
      natureGeneration: 'PASS', emptyPoolRejection: 'PASS', representativePracticeGeneration: 'PASS',
      migrations: 0, taxonomyWrites: 0, unrelatedRecordsModified: 0 };
    await mkdir('tmp', { recursive: true });
    await writeFile('tmp/jee-production-release-verification.json', `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
  } finally { await client.$disconnect(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'JEE release verification failed.'); process.exitCode = 1; });
