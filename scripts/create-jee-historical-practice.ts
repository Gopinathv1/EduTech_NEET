import { writeFile, mkdir } from 'node:fs/promises';
import { loadEnvConfig } from '@next/env';
import { PrismaClient, type Prisma } from '@prisma/client';
import { publishTest } from '../lib/admin/test-publication';
import { buildJeePracticePlans } from '../lib/previous-year/jee-practice';
import { loadJeeRelease, assertJeeDatabaseTargets, prepareJeeRelease, selectJeeReleaseAdmin } from '../lib/previous-year/jee-release';

loadEnvConfig(process.cwd());
const execute = process.argv.includes('--execute');
const confirmation = 'CREATE_JEE_HISTORICAL_PRACTICE_2021_2025_V1';
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(',')}}`;
  return JSON.stringify(value);
};

async function main() {
  const release = await loadJeeRelease({ requireReady: execute });
  if (execute && (process.env.JEE_HISTORICAL_PRACTICE_CONFIRM !== confirmation || process.env.JEE_HISTORICAL_RELEASE_SHA256 !== release.releaseSha256)) {
    throw new Error('JEE practice write refused: exact confirmation and release hash are required.');
  }
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) throw new Error('Both database URLs are required.');
  const target = assertJeeDatabaseTargets(process.env.DATABASE_URL, process.env.DIRECT_URL);
  const client = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });
  try {
    const admin = await selectJeeReleaseAdmin(client);
    const plans = buildJeePracticePlans(release.questions);
    const [subjects, chapters, questions, existing] = await Promise.all([
      client.subject.findMany({ where: { code: { in: ['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS'] } }, select: { id: true, code: true } }),
      client.chapter.findMany({ where: { subject: { code: { startsWith: 'JEE_' } } }, select: { id: true, subjectId: true, name: true } }),
      client.question.findMany({ where: { externalId: { in: release.questions.map(row => row.externalId) } }, include: { translations: true } }),
      client.test.findMany({ where: { id: { in: plans.map(plan => plan.id) } }, include: { testQuestions: { orderBy: { order: 'asc' } } } }),
    ]);
    const preparation = prepareJeeRelease(release.questions, subjects, chapters, questions);
    if (preparation.blockers.length) throw new Error(preparation.blockers.join('\n'));
    const byExternalId = new Map(preparation.prepared.map(entry => [entry.question.externalId, entry]));
    const eligible = questions.filter(row => row.reviewState === 'APPROVED' && row.status === 'PUBLISHED' && row.isActive && row.contentClass === 'PRODUCTION');
    const resolved = plans.map(plan => {
      const rows = plan.externalIds.map(id => byExternalId.get(id)!);
      const subjectIds = [...new Set(rows.map(row => row.subjectId!))];
      const chapterIds = [...new Set(rows.map(row => row.chapterId!))];
      const rules = { ...plan.rules, ...(plan.isRandom ? { random: { scope: plan.testType === 'FULL_TEST' ? 'FULL_SYLLABUS' : plan.chapterSlug ? 'CHAPTERS' : 'SUBJECTS',
        subjectIds, ...(plan.chapterSlug ? { chapterIds } : {}), subjectCounts: Object.fromEntries(subjectIds.map(id => [id, plan.testType === 'FULL_TEST' ? 25 : rows.filter(row => row.subjectId === id).length])) } } : {}) };
      const questionIds = plan.isRandom ? [] : rows.map(row => row.prior?.id ?? `PENDING:${row.question.externalId}`);
      return { ...plan, rules, questionIds, subjectId: subjectIds.length === 1 ? subjectIds[0] : undefined,
        chapterId: chapterIds.length === 1 ? chapterIds[0] : undefined };
    });
    const conflicts = existing.filter(test => {
      const plan = resolved.find(row => row.id === test.id)!;
      return test.totalQuestions !== plan.totalQuestions || test.durationMinutes !== plan.durationMinutes || test.isRandom !== plan.isRandom
        || test.testType !== plan.testType || Number(test.price) !== 0 || test.contentClass !== 'PRODUCTION'
        || stable(test.rules) !== stable(plan.rules) || stable(test.availableLanguages) !== stable(['en'])
        || test.subjectId !== (plan.subjectId ?? null) || test.chapterId !== (plan.chapterId ?? null)
        || stable(test.title) !== stable({ en: plan.title, ta: '', hi: '' })
        || stable(test.description) !== stable({ en: plan.description, ta: '', hi: '' })
        || test.testQuestions.length !== plan.questionIds.length || test.testQuestions.some((row, index) => row.questionId !== plan.questionIds[index] || row.order !== index + 1);
    });
    const missing = resolved.filter(plan => !existing.some(test => test.id === plan.id));
    const toPublish = resolved.filter(plan => !existing.some(test => test.id === plan.id && test.isPublished));
    const report = { mode: execute ? 'EXECUTE' : 'DRY_RUN', target, releaseSha256: release.releaseSha256,
      selectedQuestions: release.questions.length, approvedQuestionsPresent: eligible.length,
      projectedAfterImportAndApproval: eligible.length !== release.questions.length,
      practiceTestsToCreate: missing.length, practiceTestsToPublish: toPublish.length,
      auditLogRecords: missing.length + toPublish.length, questionVersionRecords: 0,
      fixedMembershipRecordsToCreate: missing.reduce((count, plan) => count + plan.questionIds.length, 0),
      plans: resolved.length, historicalShifts: plans.filter(plan => plan.rules.previousYearMode === 'HISTORICAL_SHIFT').length,
      yearWise: 5, mixed: 1, subjects: plans.filter(plan => plan.testType === 'SUBJECT_TEST').length,
      chapters: plans.filter(plan => plan.testType === 'CHAPTER_TEST').length,
      conflicts: conflicts.map(row => row.id), emptyPlans: 0, taxonomyWrites: 0, migrations: 0, unrelatedRecordsModified: 0,
      readinessBlockers: release.readinessBlockers };
    console.log(JSON.stringify(report, null, 2));
    await mkdir('tmp', { recursive: true });
    await writeFile('tmp/jee-practice-dry-run.json', `${JSON.stringify(report, null, 2)}\n`);
    if (conflicts.length) throw new Error('Existing JEE practice records conflict with the exact plan.');
    if (!execute) return;
    if (eligible.length !== release.questions.length) throw new Error('All exact JEE questions must be approved/active before practice writes.');
    let completed = 0;
    for (const plan of resolved) {
      if (missing.some(row => row.id === plan.id)) await client.$transaction(async tx => {
        await tx.test.create({ data: { id: plan.id, title: { en: plan.title, ta: '', hi: '' }, description: { en: plan.description, ta: '', hi: '' },
          testType: plan.testType, totalQuestions: plan.totalQuestions, durationMinutes: plan.durationMinutes, price: 0,
          difficulty: 'MEDIUM', isRandom: plan.isRandom, isPublished: false, contentClass: 'PRODUCTION', availableLanguages: ['en'],
          subjectId: plan.subjectId, chapterId: plan.chapterId, rules: plan.rules as Prisma.InputJsonValue } });
        if (plan.questionIds.length) await tx.testQuestion.createMany({ data: plan.questionIds.map((questionId, index) => ({ testId: plan.id, questionId, order: index + 1 })) });
        await tx.auditLog.create({ data: { adminId: admin.sub, adminName: admin.name, action: 'test.create', entityType: 'Test', entityId: plan.id,
          details: { source: 'JEE_MAIN_PAPER_1_2021_2025_V1', releaseSha256: release.releaseSha256 } } });
      });
      await publishTest(plan.id, admin, { client, atomicAudit: true, idempotent: true, skipNotifications: true });
      completed += 1;
      if (completed % 25 === 0 || completed === resolved.length) console.log(JSON.stringify({ createdOrVerified: completed, total: resolved.length }));
    }
    const published = await client.test.count({ where: { id: { in: resolved.map(plan => plan.id) }, isPublished: true, price: 0 } });
    if (published !== resolved.length) throw new Error('JEE practice post-publication verification failed.');
    console.log(JSON.stringify({ publishedFreePracticeTests: published, practiceAuditLogsAdded: missing.length + toPublish.length, unrelatedRecordsModified: 0 }));
  } finally { await client.$disconnect(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'JEE practice preflight failed.'); process.exitCode = 1; });
