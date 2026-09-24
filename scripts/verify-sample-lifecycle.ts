import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { buildExamPayload, finalizeAttempt, startOrResumeAttempt } from '../lib/attempts/service';
import { prisma as appPrisma } from '../lib/prisma';
import { studentTestWhere } from '../lib/content/eligibility';

function assertLocalTestDatabase() {
  for (const name of ['DATABASE_URL', 'DIRECT_URL'] as const) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing ${name}`);
    const url = new URL(value);
    if (url.hostname !== '127.0.0.1' || url.port !== '5433' || url.pathname !== '/sivora_test') {
      throw new Error(`Refusing lifecycle verification outside 127.0.0.1:5433/sivora_test (${name})`);
    }
  }
}

const prisma = new PrismaClient();

async function verifyTest(studentId: string, testId: string) {
  const attemptIds: string[] = [];
  for (let index = 0; index < 3; index++) {
    const started = await startOrResumeAttempt(studentId, testId, 'en');
    if (!started.ok || started.resumed) throw new Error(`${testId} attempt ${index + 1} did not start fresh`);
    attemptIds.push(started.attemptId);

    const attempt = await prisma.testAttempt.findUniqueOrThrow({ where: { id: started.attemptId }, include: { test: true } });
    const payload = await buildExamPayload(attempt);
    if (new Set(payload.questions.map((question) => question.id)).size !== payload.questions.length) throw new Error(`${testId} contains duplicate questions`);
    const firstQuestion = payload.questions[0];
    await prisma.answer.upsert({
      where: { attemptId_questionId: { attemptId: started.attemptId, questionId: firstQuestion.id } },
      update: { selectedOption: 'A', visited: true, timeSpentSeconds: { increment: 2 } },
      create: { attemptId: started.attemptId, questionId: firstQuestion.id, selectedOption: 'A', visited: true, timeSpentSeconds: 2 },
    });

    if (index === 0) {
      const resumed = await startOrResumeAttempt(studentId, testId, 'en');
      if (!resumed.ok || !resumed.resumed || resumed.attemptId !== started.attemptId) throw new Error(`${testId} did not resume the same attempt`);
      const saved = await prisma.answer.findUnique({ where: { attemptId_questionId: { attemptId: started.attemptId, questionId: firstQuestion.id } } });
      if (saved?.selectedOption !== 'A') throw new Error(`${testId} did not persist the resumed answer`);
    }

    const submitted = await finalizeAttempt(started.attemptId, { auto: false });
    if (!submitted.ok || submitted.alreadyDone) throw new Error(`${testId} attempt ${index + 1} did not submit`);
    const stored = await prisma.testAttempt.findUniqueOrThrow({ where: { id: started.attemptId }, include: { result: true, answers: true } });
    if (stored.status !== 'SUBMITTED' || !stored.result || stored.answers.length !== 1) throw new Error(`${testId} attempt ${index + 1} persistence failed`);
    if (stored.result.correct + stored.result.wrong + stored.result.skipped !== stored.result.totalQuestions) throw new Error(`${testId} result totals are inconsistent`);
  }
  if (new Set(attemptIds).size !== 3) throw new Error(`${testId} attempt IDs are not unique`);
  const history = await prisma.testAttempt.findMany({ where: { studentId, testId }, include: { result: true, answers: true }, orderBy: { createdAt: 'asc' } });
  if (history.length !== 3 || history.some((attempt) => !attempt.result || attempt.answers.length !== 1)) throw new Error(`${testId} history was not preserved`);
  return attemptIds;
}

async function main() {
  assertLocalTestDatabase();
  const inventory = await prisma.test.findMany({
    where: { id: { in: ['sivora-neet-sample-practice', 'sivora-jee-sample-practice'] } },
    orderBy: { id: 'asc' },
    select: { id: true, contentClass: true, price: true, testQuestions: { select: { question: { select: { externalId: true, subject: { select: { code: true } } } } } } },
  });
  const visible = await prisma.test.findMany({ where: { ...studentTestWhere, id: { in: inventory.map((test) => test.id) } }, select: { id: true } });
  if (inventory.length !== 2 || visible.length !== 2) throw new Error('Controlled sample inventory is missing or not student-visible');
  const inventorySummary = inventory.map((test) => ({
    id: test.id,
    contentClass: test.contentClass,
    price: test.price,
    questionCount: test.testQuestions.length,
    subjects: Object.fromEntries([...new Set(test.testQuestions.map((row) => row.question.subject.code))].sort().map((code) => [code, test.testQuestions.filter((row) => row.question.subject.code === code).length])),
  }));
  if (inventorySummary.some((test) => test.contentClass !== 'SAMPLE' || test.price !== 0) || inventorySummary[0].questionCount !== 15 || inventorySummary[1].questionCount !== 3) throw new Error(`Unexpected sample inventory: ${JSON.stringify(inventorySummary)}`);
  const token = randomUUID();
  const student = await prisma.student.create({ data: { name: 'Disposable Sample Lifecycle', email: `sample-lifecycle-${token}@example.invalid`, isEmailVerified: true } });
  try {
    const paymentBefore = await prisma.payment.count({ where: { studentId: student.id } });
    const creditBefore = await prisma.paidAttemptCredit.count({ where: { studentId: student.id } });
    const neet = await verifyTest(student.id, 'sivora-neet-sample-practice');
    const jee = await verifyTest(student.id, 'sivora-jee-sample-practice');
    const [paymentAfter, creditAfter] = await Promise.all([
      prisma.payment.count({ where: { studentId: student.id } }),
      prisma.paidAttemptCredit.count({ where: { studentId: student.id } }),
    ]);
    if (paymentAfter !== paymentBefore || creditAfter !== creditBefore) throw new Error('Sample lifecycle touched payment or retry-credit records');
    console.log(JSON.stringify({ database: '127.0.0.1:5433/sivora_test', inventory: inventorySummary, neetAttemptIds: neet, jeeAttemptIds: jee, historyPreserved: true, resumePreserved: true, paymentRecordsCreated: 0, retryCreditsConsumed: 0 }));
  } finally {
    await prisma.student.delete({ where: { id: student.id } });
    await Promise.all([prisma.$disconnect(), appPrisma.$disconnect()]);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
