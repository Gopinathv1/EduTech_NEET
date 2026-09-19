import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Question selection is deliberately outside these persistence-concurrency
// checks. The real attempt service and the real Prisma client remain in use.
vi.mock('@/lib/generator/plan', () => ({
  generateForAttempt: vi.fn(async () => ({ questionIds: ['integration-question'] })),
}));

import { prisma } from '@/lib/prisma';
import { startOrResumeAttempt } from '@/lib/attempts/service';
import { finalizeSuccess } from '@/lib/payments/service';

type Fixture = { studentIds: string[]; testIds: string[]; paymentIds: string[] };
const fixtures: Fixture[] = [];
const originalPaidRetriesFlag = process.env.EXAM_PAID_RETRIES_ENABLED;

beforeAll(() => {
  process.env.EXAM_PAID_RETRIES_ENABLED = 'true';
});

function fixtureIds() {
  const token = randomUUID();
  return {
    token,
    studentId: `student-${token}`,
    testId: `test-${token}`,
    paymentId: `payment-${token}`,
  };
}

async function createStudentAndTest(ids: ReturnType<typeof fixtureIds>) {
  await prisma.student.create({
    data: { id: ids.studentId, name: 'Paid retry integration student' },
  });
  await prisma.test.create({
    data: {
      id: ids.testId,
      title: { en: 'Paid retry integration test' },
      testType: 'MINI_TEST',
      totalQuestions: 1,
      durationMinutes: 15,
      price: 30,
      isPublished: true,
      contentClass: 'PRODUCTION',
      availableLanguages: ['en'],
    },
  });
}

async function createRetryCredit(studentId: string, testId: string, paymentId: string) {
  await prisma.payment.create({
    data: { id: paymentId, studentId, testId, amount: 30, purpose: 'PAID_RETRY', status: 'SUCCESS' },
  });
  await prisma.paidAttemptCredit.create({ data: { studentId, testId, paymentId } });
}

afterEach(async () => {
  for (const fixture of fixtures.splice(0)) {
    await prisma.notification.deleteMany({ where: { studentId: { in: fixture.studentIds } } });
    await prisma.paidAttemptCredit.deleteMany({ where: { studentId: { in: fixture.studentIds }, testId: { in: fixture.testIds } } });
    await prisma.testEntitlement.deleteMany({ where: { studentId: { in: fixture.studentIds }, testId: { in: fixture.testIds } } });
    await prisma.payment.deleteMany({ where: { id: { in: fixture.paymentIds } } });
    await prisma.testAttempt.deleteMany({ where: { studentId: { in: fixture.studentIds }, testId: { in: fixture.testIds } } });
    await prisma.test.deleteMany({ where: { id: { in: fixture.testIds } } });
    await prisma.student.deleteMany({ where: { id: { in: fixture.studentIds } } });
  }
});

afterAll(async () => {
  if (originalPaidRetriesFlag === undefined) delete process.env.EXAM_PAID_RETRIES_ENABLED;
  else process.env.EXAM_PAID_RETRIES_ENABLED = originalPaidRetriesFlag;
  await prisma.$disconnect();
});

describe.sequential('paid retry concurrency (real PostgreSQL)', () => {
  it('consumes one credit for six parallel fourth-attempt starts', async () => {
    const ids = fixtureIds();
    fixtures.push({ studentIds: [ids.studentId], testIds: [ids.testId], paymentIds: [ids.paymentId] });
    await createStudentAndTest(ids);
    await prisma.testAttempt.createMany({
      data: Array.from({ length: 3 }, () => ({
        studentId: ids.studentId,
        testId: ids.testId,
        remainingSeconds: 0,
        status: 'SUBMITTED',
      })),
    });
    await prisma.payment.create({
      data: {
        id: ids.paymentId,
        studentId: ids.studentId,
        testId: ids.testId,
        amount: 30,
        purpose: 'PAID_RETRY',
        status: 'SUCCESS',
      },
    });
    await prisma.paidAttemptCredit.create({
      data: { studentId: ids.studentId, testId: ids.testId, paymentId: ids.paymentId },
    });

    const outcomes = await Promise.all(
      Array.from({ length: 6 }, () => startOrResumeAttempt(ids.studentId, ids.testId, 'en')),
    );

    expect(outcomes.every((outcome) => outcome.ok)).toBe(true);
    const attempts = await prisma.testAttempt.findMany({
      where: { studentId: ids.studentId, testId: ids.testId },
      orderBy: { createdAt: 'asc' },
    });
    const credit = await prisma.paidAttemptCredit.findUnique({ where: { paymentId: ids.paymentId } });

    expect(attempts).toHaveLength(4);
    expect(attempts.filter((attempt) => attempt.status === 'IN_PROGRESS')).toHaveLength(1);
    expect(credit?.consumedAt).not.toBeNull();
    expect(credit?.attemptId).toBe(attempts[3]?.id);
  });

  it('grants one credit and no entitlement for six concurrent retry finalizations', async () => {
    const ids = fixtureIds();
    fixtures.push({ studentIds: [ids.studentId], testIds: [ids.testId], paymentIds: [ids.paymentId] });
    await createStudentAndTest(ids);
    await prisma.payment.create({
      data: {
        id: ids.paymentId,
        studentId: ids.studentId,
        testId: ids.testId,
        amount: 30,
        purpose: 'PAID_RETRY',
      },
    });

    const results = await Promise.all(
      Array.from({ length: 6 }, () => finalizeSuccess(ids.paymentId, { source: 'webhook' })),
    );

    expect(results.filter((result) => result.ok && !result.alreadyProcessed)).toHaveLength(1);
    expect(await prisma.paidAttemptCredit.count({ where: { paymentId: ids.paymentId } })).toBe(1);
    expect(await prisma.testEntitlement.count({ where: { studentId: ids.studentId, testId: ids.testId } })).toBe(0);
  });

  it('requires a new scoped credit for Attempts 5 and 6', async () => {
    const ids = fixtureIds();
    const otherStudentId = `student-other-${ids.token}`;
    const otherTestId = `test-other-${ids.token}`;
    const paymentIds = [ids.paymentId, `payment-two-${ids.token}`, `payment-three-${ids.token}`];
    fixtures.push({ studentIds: [ids.studentId, otherStudentId], testIds: [ids.testId, otherTestId], paymentIds });
    await createStudentAndTest(ids);
    await prisma.student.create({ data: { id: otherStudentId, name: 'Other integration student' } });
    await prisma.test.create({
      data: { id: otherTestId, title: { en: 'Other integration test' }, testType: 'MINI_TEST', totalQuestions: 1, durationMinutes: 15, isPublished: true, contentClass: 'PRODUCTION', availableLanguages: ['en'] },
    });
    await prisma.testAttempt.createMany({
      data: Array.from({ length: 3 }, () => ({ studentId: ids.studentId, testId: ids.testId, remainingSeconds: 0, status: 'SUBMITTED' })),
    });
    await createRetryCredit(ids.studentId, ids.testId, ids.paymentId);

    const attempt4 = await startOrResumeAttempt(ids.studentId, ids.testId, 'en');
    expect(attempt4).toMatchObject({ ok: true, resumed: false });
    if (!attempt4.ok) throw new Error('Attempt 4 was not created');
    await prisma.testAttempt.update({ where: { id: attempt4.attemptId }, data: { status: 'SUBMITTED' } });

    await expect(startOrResumeAttempt(ids.studentId, ids.testId, 'en')).resolves.toEqual({ ok: false, code: 'paymentRequired' });
    await createRetryCredit(ids.studentId, ids.testId, paymentIds[1]);
    const attempt5 = await startOrResumeAttempt(ids.studentId, ids.testId, 'en');
    expect(attempt5).toMatchObject({ ok: true, resumed: false });
    if (!attempt5.ok) throw new Error('Attempt 5 was not created');
    await prisma.testAttempt.update({ where: { id: attempt5.attemptId }, data: { status: 'SUBMITTED' } });

    await expect(startOrResumeAttempt(ids.studentId, ids.testId, 'en')).resolves.toEqual({ ok: false, code: 'paymentRequired' });
    await createRetryCredit(ids.studentId, ids.testId, paymentIds[2]);
    await expect(startOrResumeAttempt(ids.studentId, ids.testId, 'en')).resolves.toMatchObject({ ok: true, resumed: false });

    await prisma.testAttempt.createMany({
      data: Array.from({ length: 3 }, () => ({ studentId: ids.studentId, testId: otherTestId, remainingSeconds: 0, status: 'SUBMITTED' })),
    });
    await prisma.testAttempt.createMany({
      data: Array.from({ length: 3 }, () => ({ studentId: otherStudentId, testId: ids.testId, remainingSeconds: 0, status: 'SUBMITTED' })),
    });
    await expect(startOrResumeAttempt(ids.studentId, otherTestId, 'en')).resolves.toEqual({ ok: false, code: 'paymentRequired' });
    await expect(startOrResumeAttempt(otherStudentId, ids.testId, 'en')).resolves.toEqual({ ok: false, code: 'paymentRequired' });
  });
});
