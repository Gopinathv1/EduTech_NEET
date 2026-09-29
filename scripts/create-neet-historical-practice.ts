import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { PrismaClient, type Prisma } from '@prisma/client';
import { publishTest } from '../lib/admin/test-publication';
import { inspectDatabaseTarget } from '../lib/question-bank/taxonomy-sync';

loadEnvConfig(process.cwd());

const YEARS = [2021, 2022, 2023, 2024, 2025] as const;
const CONFIRMATION = 'CREATE_NEET_HISTORICAL_PRACTICE_2021_2025';
const dryRun = !process.argv.includes('--execute');
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
if (!databaseUrl || !directUrl) throw new Error('DATABASE_URL and DIRECT_URL are required.');
const database = inspectDatabaseTarget(databaseUrl);
const direct = inspectDatabaseTarget(directUrl);
if (database.database !== direct.database || database.classification !== direct.classification || !direct.direct) {
  throw new Error('DATABASE_URL and DIRECT_URL must target the same database and DIRECT_URL must be non-pooled.');
}
if (!dryRun && direct.classification === 'PRODUCTION' && process.env.NEET_HISTORICAL_PRACTICE_CONFIRM !== CONFIRMATION) {
  throw new Error(`Production write refused. Set NEET_HISTORICAL_PRACTICE_CONFIRM=${CONFIRMATION}.`);
}

type ManifestQuestion = { externalId: string; year: number; originalOrder: number; subjectCode: string; chapterSlug: string };
type YearManifest = { pattern: { durationMinutes: number }; completeness: { expected: number; validated: number; status: string } };
type DbQuestion = {
  id: string; externalId: string | null; examYear: number | null; subjectId: string; chapterId: string;
  subject: { code: string }; chapter: { name: Prisma.JsonValue };
};
type TestPlan = {
  id: string; title: string; description: string; testType: 'FULL_TEST' | 'SUBJECT_TEST' | 'CHAPTER_TEST' | 'YEAR_PATTERN';
  totalQuestions: number; durationMinutes: number; isRandom: boolean; subjectId?: string; chapterId?: string;
  rules: Prisma.InputJsonValue; questionIds?: string[];
};

const prisma = new PrismaClient({ datasourceUrl: directUrl });
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const chapterName = (value: Prisma.JsonValue) => (value && typeof value === 'object' && !Array.isArray(value) && typeof value.en === 'string') ? value.en : 'Chapter';

async function loadArtifacts() {
  const questions: ManifestQuestion[] = [];
  const manifests = new Map<number, YearManifest>();
  for (const year of YEARS) {
    const dir = path.join(process.cwd(), 'data', 'previous-year', 'neet', String(year));
    questions.push(...JSON.parse(await readFile(path.join(dir, 'questions.json'), 'utf8')) as ManifestQuestion[]);
    manifests.set(year, JSON.parse(await readFile(path.join(dir, 'source-manifest.json'), 'utf8')) as YearManifest);
  }
  if (questions.length !== 780 || new Set(questions.map((question) => question.externalId)).size !== 780) {
    throw new Error('Historical release must resolve to exactly 780 unique questions.');
  }
  return { questions, manifests };
}

function rulesFor(period: number | 'mixed', level: 'SUBJECT' | 'CHAPTER', subjectCode: string, chapterSlug?: string) {
  return {
    previousYearMode: 'SUBJECT_CHAPTER', exam: 'NEET', sourceType: 'HISTORICAL_VERIFIED',
    practiceSource: period === 'mixed' ? 'MIXED_2021_2025' : `YEAR_${period}`,
    filterLevel: level, subjectCode, chapterSlug: chapterSlug ?? null,
    historical: { exam: 'NEET', years: period === 'mixed' ? [...YEARS] : [period], sourceType: 'HISTORICAL_VERIFIED' },
  };
}

async function main() {
  const { questions: manifestQuestions, manifests } = await loadArtifacts();
  const dbQuestions = await prisma.question.findMany({
    where: { externalId: { in: manifestQuestions.map((question) => question.externalId) } },
    select: { id: true, externalId: true, examYear: true, subjectId: true, chapterId: true, subject: { select: { code: true } }, chapter: { select: { name: true } }, reviewState: true, status: true, isActive: true, contentClass: true, sourceType: true },
  });
  const eligible = dbQuestions.filter((question) => question.reviewState === 'APPROVED' && question.status === 'PUBLISHED'
    && question.isActive && question.contentClass === 'PRODUCTION' && question.sourceType === 'HISTORICAL_VERIFIED') as DbQuestion[];
  if (eligible.length !== manifestQuestions.length) throw new Error(`Readiness failed: expected ${manifestQuestions.length} approved/active rows, found ${eligible.length}.`);
  const dbByExternalId = new Map(eligible.map((question) => [question.externalId!, question]));
  const plans: TestPlan[] = [];

  for (const year of YEARS) {
    const yearRows = manifestQuestions.filter((question) => question.year === year).sort((a, b) => a.originalOrder - b.originalOrder);
    const manifest = manifests.get(year)!;
    plans.push({
      id: `neet-pyq-${year}-verified-partial`,
      title: `NEET ${year} — Verified Previous-Year Practice (${manifest.completeness.validated}/${manifest.completeness.expected})`,
      description: `Validated subset of NEET ${year} booklet questions in original order. This is not represented as a complete original paper; quarantined rows are excluded.`,
      testType: 'YEAR_PATTERN', totalQuestions: yearRows.length, durationMinutes: manifest.pattern.durationMinutes,
      isRandom: false, questionIds: yearRows.map((question) => dbByExternalId.get(question.externalId)!.id),
      rules: { previousYearMode: 'YEAR_WISE', exam: 'NEET', year, sourceType: 'HISTORICAL_VERIFIED', completeness: manifest.completeness, scoring: { correct: 4, incorrect: -1, unanswered: 0 }, payment: 'NONE', retake: 'FREE_UNLIMITED' },
    });
  }

  plans.push({
    id: 'neet-pyq-mixed-2021-2025', title: 'NEET Mixed Previous-Year Practice 2021–2025',
    description: 'A balanced 180-question practice set drawn only from validated NEET 2021–2025 historical questions. This is not an original historical paper.',
    testType: 'FULL_TEST', totalQuestions: 180, durationMinutes: 180, isRandom: true,
    rules: { previousYearMode: 'MIXED_FIVE_YEARS', exam: 'NEET', sourceType: 'HISTORICAL_VERIFIED',
      random: { scope: 'FULL_SYLLABUS' }, historical: { exam: 'NEET', years: [...YEARS], sourceType: 'HISTORICAL_VERIFIED', balanceYears: true },
      difficultyMix: { EASY: 30, MEDIUM: 50, HARD: 20 }, scoring: { correct: 4, incorrect: -1, unanswered: 0 }, payment: 'NONE', retake: 'FREE_UNLIMITED' },
  });

  for (const period of [...YEARS, 'mixed' as const]) {
    const periodRows = eligible.filter((question) => period === 'mixed' || question.examYear === period);
    for (const subjectCode of ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'] as const) {
      const subjectRows = periodRows.filter((question) => subjectCode === 'BIOLOGY'
        ? question.subject.code === 'BOTANY' || question.subject.code === 'ZOOLOGY'
        : question.subject.code === subjectCode);
      const subjectIds = [...new Set(subjectRows.map((question) => question.subjectId))];
      const subjectCounts = Object.fromEntries(subjectIds.map((id) => [id, subjectRows.filter((question) => question.subjectId === id).length]));
      const periodLabel = period === 'mixed' ? '2021–2025' : String(period);
      plans.push({
        id: `neet-pyq-${period}-${slug(subjectCode)}`, title: `NEET ${periodLabel} ${subjectCode === 'BIOLOGY' ? 'Biology' : subjectCode[0] + subjectCode.slice(1).toLowerCase()} Practice`,
        description: `All ${subjectRows.length} validated ${subjectCode === 'BIOLOGY' ? 'Biology' : subjectCode.toLowerCase()} questions for ${periodLabel}, with shuffled order.`,
        testType: 'SUBJECT_TEST', totalQuestions: subjectRows.length, durationMinutes: subjectRows.length, isRandom: true,
        subjectId: subjectIds.length === 1 ? subjectIds[0] : undefined,
        rules: { ...rulesFor(period, 'SUBJECT', subjectCode), random: { scope: 'SUBJECTS', subjectIds, subjectCounts }, difficultyMix: { EASY: 30, MEDIUM: 50, HARD: 20 }, payment: 'NONE', retake: 'FREE_UNLIMITED' },
      });

      const chapterGroups = new Map<string, DbQuestion[]>();
      for (const question of subjectRows) {
        const canonicalChapterSlug = manifestQuestions.find((candidate) => candidate.externalId === question.externalId)?.chapterSlug;
        if (!canonicalChapterSlug) throw new Error(`Missing manifest chapter for ${question.externalId}.`);
        chapterGroups.set(canonicalChapterSlug, [...(chapterGroups.get(canonicalChapterSlug) ?? []), question]);
      }
      for (const [canonicalChapterSlug, chapterRows] of chapterGroups) {
        const chapterIds = [...new Set(chapterRows.map((question) => question.chapterId))];
        const chapterSubjectIds = [...new Set(chapterRows.map((question) => question.subjectId))];
        const displayName = chapterName(chapterRows[0].chapter.name);
        const chapterSubjectCounts = Object.fromEntries(chapterSubjectIds.map((id) => [id, chapterRows.filter((question) => question.subjectId === id).length]));
        plans.push({
          id: `neet-pyq-${period}-${slug(subjectCode)}-${slug(canonicalChapterSlug)}`,
          title: `NEET ${periodLabel} ${displayName} Practice`,
          description: `All ${chapterRows.length} validated ${displayName} questions for ${periodLabel}, with shuffled order.`,
          testType: 'CHAPTER_TEST', totalQuestions: chapterRows.length, durationMinutes: chapterRows.length, isRandom: true,
          subjectId: chapterSubjectIds.length === 1 ? chapterSubjectIds[0] : undefined,
          chapterId: chapterIds.length === 1 ? chapterIds[0] : undefined,
          rules: { ...rulesFor(period, 'CHAPTER', subjectCode, canonicalChapterSlug), random: { scope: 'CHAPTERS', chapterIds, subjectCounts: chapterSubjectCounts }, difficultyMix: { EASY: 30, MEDIUM: 50, HARD: 20 }, payment: 'NONE', retake: 'FREE_UNLIMITED' },
        });
      }
    }
  }

  const duplicatePlanIds = plans.filter((plan, index) => plans.findIndex((candidate) => candidate.id === plan.id) !== index);
  if (duplicatePlanIds.length) throw new Error(`Duplicate planned test IDs: ${duplicatePlanIds.map((plan) => plan.id).join(', ')}`);
  const existing = await prisma.test.findMany({ where: { id: { in: plans.map((plan) => plan.id) } }, include: { testQuestions: { orderBy: { order: 'asc' }, select: { questionId: true } } } });
  const conflicts = existing.filter((test) => {
    const plan = plans.find((candidate) => candidate.id === test.id)!;
    return test.totalQuestions !== plan.totalQuestions || test.durationMinutes !== plan.durationMinutes || test.isRandom !== plan.isRandom
      || (plan.questionIds && plan.questionIds.some((id, index) => test.testQuestions[index]?.questionId !== id));
  });
  console.log(JSON.stringify({ mode: dryRun ? 'DRY_RUN' : 'EXECUTE', target: { database, direct }, questions: eligible.length,
    plans: plans.length, yearWise: 5, mixed: 1, subject: plans.filter((plan) => plan.testType === 'SUBJECT_TEST').length,
    chapter: plans.filter((plan) => plan.testType === 'CHAPTER_TEST').length, existing: existing.length,
    conflicts: conflicts.map((test) => test.id), empty: plans.filter((plan) => plan.totalQuestions === 0).map((plan) => plan.id), unrelated: 0 }, null, 2));
  if (conflicts.length || plans.some((plan) => plan.totalQuestions === 0)) throw new Error('Practice-plan preflight failed.');
  if (dryRun) return;

  const adminEmail = process.env.NEET_HISTORICAL_ADMIN_EMAIL?.trim().toLowerCase();
  const adminName = process.env.NEET_HISTORICAL_ADMIN_NAME?.trim();
  const admins = await prisma.admin.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true } });
  const matches = adminEmail ? admins.filter((admin) => admin.email.toLowerCase() === adminEmail)
    : adminName ? admins.filter((admin) => admin.name === adminName) : admins;
  if (matches.length !== 1) throw new Error('Set NEET_HISTORICAL_ADMIN_EMAIL or NEET_HISTORICAL_ADMIN_NAME to identify exactly one active administrator.');
  const admin = matches[0];
  const existingIds = new Set(existing.map((test) => test.id));
  for (const plan of plans) {
    if (!existingIds.has(plan.id)) {
      await prisma.$transaction(async (tx) => {
        await tx.test.create({ data: {
          id: plan.id, title: { en: plan.title, ta: '', hi: '' }, description: { en: plan.description, ta: '', hi: '' },
          testType: plan.testType, totalQuestions: plan.totalQuestions, durationMinutes: plan.durationMinutes,
          price: 0, difficulty: 'MEDIUM', isRandom: plan.isRandom, isPublished: false,
          contentClass: 'PRODUCTION', availableLanguages: ['en'], subjectId: plan.subjectId, chapterId: plan.chapterId, rules: plan.rules,
        } });
        if (plan.questionIds) await tx.testQuestion.createMany({ data: plan.questionIds.map((questionId, index) => ({ testId: plan.id, questionId, order: index + 1 })) });
        await tx.auditLog.create({ data: { adminId: admin.id, adminName: admin.name, action: 'test.create', entityType: 'Test', entityId: plan.id, details: { source: 'NEET_HISTORICAL_2021_2025', totalQuestions: plan.totalQuestions, isRandom: plan.isRandom } } });
      });
    }
    await publishTest(plan.id, { sub: admin.id, name: admin.name });
  }
  const published = await prisma.test.count({ where: { id: { in: plans.map((plan) => plan.id) }, isPublished: true, price: 0 } });
  console.log(JSON.stringify({ createdOrVerified: plans.length, published, free: published, unrelatedModified: 0 }, null, 2));
  if (published !== plans.length) throw new Error('Post-publication verification failed.');
}

main()
  .catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
