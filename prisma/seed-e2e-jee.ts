/** Exact released JEE content, only in the disposable local CI database. */
import { PrismaClient, type Prisma } from '@prisma/client';
import { canonicalJeeChapters, normalizeTaxonomyName } from '../lib/question-bank/taxonomy-sync';
import { buildJeePracticePlans, JEE_SUBJECTS } from '../lib/previous-year/jee-practice';

const RELEASE_SHA256 = '1fdd7f03266ef2cdc8a0b9a9d1523821913996b47cc49d427cd43fe394dbc63e';

function assertCiTestDatabase() {
  if (process.env.CI !== 'true') throw new Error('JEE E2E fixture requires CI=true.');
  for (const name of ['DATABASE_URL', 'DIRECT_URL'] as const) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing ${name} for the JEE E2E fixture.`);
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)
      || !['localhost', '127.0.0.1'].includes(url.hostname)
      || url.port !== '5432' || url.pathname !== '/neet_test'
      || url.searchParams.has('host') || url.searchParams.get('pgbouncer') === 'true') {
      throw new Error('JEE E2E fixture requires both URLs to target localhost:5432/neet_test.');
    }
  }
}

async function main() {
  // Check before constructing Prisma, reading credentials or performing writes.
  assertCiTestDatabase();
  // The release helper imports the application's Prisma singleton indirectly.
  // Load it only after the disposable database guard has succeeded.
  const { jeeQuestionData, loadJeeRelease, prepareJeeRelease } = await import('../lib/previous-year/jee-release');
  const release = await loadJeeRelease({ requireReady: true });
  if (release.releaseSha256 !== RELEASE_SHA256) throw new Error('Unexpected JEE release fixture hash.');
  const plans = buildJeePracticePlans(release.questions);
  if (plans.length !== 227 || plans.filter(plan => !plan.isRandom).reduce((sum, plan) => sum + plan.externalIds.length, 0) !== 436) {
    throw new Error('Unexpected JEE fixture plans or memberships.');
  }
  const prisma = new PrismaClient();
  try {
    if (await prisma.question.count({ where: { externalId: { in: release.questions.map(row => row.externalId) } } })) {
      throw new Error('JEE E2E fixture requires a fresh reference-seeded CI database.');
    }
    for (const [order, code] of JEE_SUBJECTS.entries()) {
      await prisma.subject.upsert({ where: { code }, update: {}, create: {
        code, name: { en: code.replace('JEE_', '').toLowerCase().replace(/^./, letter => letter.toUpperCase()) }, order: order + 5,
      } });
    }
    const subjects = await prisma.subject.findMany({ where: { code: { in: [...JEE_SUBJECTS] } }, select: { id: true, code: true } });
    const priorChapters = await prisma.chapter.findMany({ where: { subjectId: { in: subjects.map(subject => subject.id) } } });
    for (const chapter of canonicalJeeChapters()) {
      const subjectId = subjects.find(subject => subject.code === chapter.subjectCode)!.id;
      const exists = priorChapters.some(prior => prior.subjectId === subjectId && prior.name && typeof prior.name === 'object'
        && !Array.isArray(prior.name) && typeof prior.name.en === 'string'
        && normalizeTaxonomyName(prior.name.en) === normalizeTaxonomyName(chapter.name));
      if (!exists) await prisma.chapter.create({ data: { subjectId, name: { en: chapter.name }, class: 12, order: chapter.order } });
    }
    const chapters = await prisma.chapter.findMany({ where: { subjectId: { in: subjects.map(subject => subject.id) } } });
    const prepared = prepareJeeRelease(release.questions, subjects, chapters, []);
    if (prepared.blockers.length) throw new Error(prepared.blockers.join('\n'));
    const resolved = new Map<string, { id: string; subjectId: string; chapterId: string }>();
    const reviewedAt = new Date();
    for (const entry of prepared.prepared) {
      const subjectId = entry.subjectId!;
      const chapterId = entry.chapterId!;
      const question = await prisma.question.create({ data: {
        ...jeeQuestionData(entry.question, subjectId, chapterId),
        reviewState: 'APPROVED', status: 'PUBLISHED', isActive: true, reviewer: 'ci-e2e-jee', reviewedAt,
      }, select: { id: true } });
      resolved.set(entry.question.externalId, { id: question.id, subjectId, chapterId });
    }
    for (const plan of plans) {
      const rows = plan.externalIds.map(externalId => resolved.get(externalId)!);
      const subjectIds = [...new Set(rows.map(row => row.subjectId))];
      const chapterIds = [...new Set(rows.map(row => row.chapterId))];
      const rules = { ...plan.rules, ...(plan.isRandom ? { random: {
        scope: plan.testType === 'FULL_TEST' ? 'FULL_SYLLABUS' : plan.chapterSlug ? 'CHAPTERS' : 'SUBJECTS',
        subjectIds, ...(plan.chapterSlug ? { chapterIds } : {}),
        subjectCounts: Object.fromEntries(subjectIds.map(id => [id, plan.testType === 'FULL_TEST' ? 25 : rows.filter(row => row.subjectId === id).length])),
      } } : {}) };
      await prisma.test.create({ data: {
        id: plan.id, title: { en: plan.title, ta: '', hi: '' }, description: { en: plan.description, ta: '', hi: '' },
        testType: plan.testType, totalQuestions: plan.totalQuestions, durationMinutes: plan.durationMinutes,
        price: 0, difficulty: 'MEDIUM', isRandom: plan.isRandom, isPublished: true, contentClass: 'PRODUCTION',
        availableLanguages: ['en'], rules: rules as Prisma.InputJsonValue,
        subjectId: subjectIds.length === 1 ? subjectIds[0] : undefined,
        chapterId: chapterIds.length === 1 ? chapterIds[0] : undefined,
        ...(!plan.isRandom ? { testQuestions: { create: rows.map((row, index) => ({ questionId: row.id, order: index + 1 })) } } : {}),
      } });
    }
    console.log('JEE E2E fixture prepared: exact sealed 218 questions, 227 published free practices, 436 memberships.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('JEE E2E fixture failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
