/**
 * CI-only fixture for the disposable GitHub Actions E2E database.
 *
 * The normal development seed intentionally creates SAMPLE content. This
 * fixture promotes only the deterministic Genetics chapter test and its fixed
 * questions so the real student catalogue and attempt eligibility rules can be
 * exercised without weakening them.
 */
import { PrismaClient } from '@prisma/client';
import { productionQuestionWhere, productionTestWhere } from '../lib/content/eligibility';

const GENETICS_TEST_TITLE = 'Botany: Genetics Chapter Test';

function assertCiTestDatabase() {
  if (process.env.CI !== 'true') {
    throw new Error('Refusing to prepare the E2E fixture outside CI.');
  }

  for (const name of ['DATABASE_URL', 'DIRECT_URL'] as const) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing ${name} for the E2E fixture.`);

    const url = new URL(value);
    if (
      !['localhost', '127.0.0.1'].includes(url.hostname)
      || url.port !== '5432'
      || url.pathname !== '/neet_test'
    ) {
      throw new Error('Refusing to prepare the E2E fixture outside the local neet_test CI database.');
    }
  }
}

async function main() {
  assertCiTestDatabase();
  const prisma = new PrismaClient();

  try {
    const geneticsTest = await prisma.test.findFirst({
      where: {
        title: { path: ['en'], equals: GENETICS_TEST_TITLE },
        testType: 'CHAPTER_TEST',
        isRandom: false,
      },
      select: {
        id: true,
        totalQuestions: true,
        testQuestions: {
          orderBy: { order: 'asc' },
          select: {
            question: {
              select: {
                id: true,
                subject: { select: { code: true } },
              },
            },
          },
        },
      },
    });

    if (!geneticsTest) {
      throw new Error(`Expected fixed E2E test "${GENETICS_TEST_TITLE}" was not found.`);
    }

    const questionIds = geneticsTest.testQuestions.map(({ question }) => question.id);
    if (
      geneticsTest.totalQuestions !== 3
      || questionIds.length !== 3
      || new Set(questionIds).size !== 3
      || geneticsTest.testQuestions.some(({ question }) => question.subject.code !== 'BOTANY')
    ) {
      throw new Error('Expected exactly three fixed Botany Genetics questions for the E2E fixture.');
    }

    const reviewedAt = new Date();
    await prisma.$transaction([
      prisma.test.update({
        where: { id: geneticsTest.id },
        data: { contentClass: 'PRODUCTION', isPublished: true },
      }),
      prisma.question.updateMany({
        where: { id: { in: questionIds } },
        data: {
          contentClass: 'PRODUCTION',
          status: 'PUBLISHED',
          isActive: true,
          sourceType: 'INTERNALLY_AUTHORED',
          sourceName: 'CI E2E fixture',
          reviewer: 'ci-e2e',
          reviewedAt,
          reviewState: 'APPROVED',
        },
      }),
    ]);

    const [eligibleTest, eligibleQuestionCount] = await Promise.all([
      prisma.test.findFirst({ where: { id: geneticsTest.id, ...productionTestWhere }, select: { id: true } }),
      prisma.question.count({ where: { id: { in: questionIds }, ...productionQuestionWhere } }),
    ]);

    if (!eligibleTest || eligibleQuestionCount !== 3) {
      throw new Error('E2E Genetics fixture did not satisfy production eligibility.');
    }

    console.log('E2E Genetics fixture prepared: 1 test, 3 production-eligible questions.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('E2E Genetics fixture failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
