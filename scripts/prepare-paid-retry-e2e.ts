import { readFileSync } from 'node:fs';

function loadLocalTestEnvironment() {
  const values = new Map<string, string>();
  for (const line of readFileSync('.env.test.local', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^(DATABASE_URL|DIRECT_URL)=(.*)$/);
    if (match) values.set(match[1], match[2].trim().replace(/^['"]|['"]$/g, ''));
  }
  for (const name of ['DATABASE_URL', 'DIRECT_URL'] as const) {
    const value = values.get(name);
    if (!value) throw new Error(`Missing ${name} in .env.test.local.`);
    const url = new URL(value);
    if (url.hostname !== '127.0.0.1' || url.port !== '5433' || url.pathname !== '/sivora_test') {
      throw new Error('Refusing to prepare an E2E fixture outside local sivora_test.');
    }
    process.env[name] = value;
  }
}

function assertLocalTestDatabase() {
  for (const name of ['DATABASE_URL', 'DIRECT_URL'] as const) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing ${name}`);
    const url = new URL(value);
    if (url.hostname !== '127.0.0.1' || url.port !== '5433' || url.pathname !== '/sivora_test') {
      throw new Error('Refusing to prepare an E2E fixture outside local sivora_test.');
    }
  }
}

async function main() {
  // Must run before any module which can initialize Prisma or read DATABASE_URL.
  loadLocalTestEnvironment();
  assertLocalTestDatabase();
  const [{ prisma }, { hashPassword }] = await Promise.all([
    import('@/lib/prisma'),
    import('@/lib/auth/password'),
  ]);
  const mobile = process.env.E2E_STUDENT_MOBILE;
  const password = process.env.E2E_STUDENT_PASSWORD;
  if (!mobile || !/^\+91[6-9]\d{9}$/.test(mobile)) throw new Error('Set E2E_STUDENT_MOBILE as +91 followed by a valid 10-digit number.');
  if (!password || password.length < 8) throw new Error('Set E2E_STUDENT_PASSWORD to at least 8 characters.');

  const suffix = mobile.slice(-10);
  const fixtureTestId = `e2e-paid-retry-${suffix}`;
  const passwordHash = await hashPassword(password);
  const student = await prisma.student.upsert({
    where: { mobile },
    update: { name: 'Local paid retry E2E student', passwordHash, isMobileVerified: true },
    create: { name: 'Local paid retry E2E student', mobile, email: `e2e-paid-retry-${suffix}@sivora.local`, passwordHash, isMobileVerified: true },
  });
  const subject = await prisma.subject.upsert({
    where: { code: 'E2E_RETRY' }, update: { name: { en: 'E2E Retry' } }, create: { code: 'E2E_RETRY', name: { en: 'E2E Retry' }, order: 999 },
  });
  let chapter = await prisma.chapter.findFirst({ where: { subjectId: subject.id, class: 12, order: 999 } });
  if (chapter) {
    chapter = await prisma.chapter.update({ where: { id: chapter.id }, data: { name: { en: 'E2E Retry Chapter' } } });
  } else {
    chapter = await prisma.chapter.create({ data: { subjectId: subject.id, name: { en: 'E2E Retry Chapter' }, class: 12, order: 999 } });
  }
  const question = await prisma.question.upsert({
    where: { externalId: `e2e-paid-retry-question-${suffix}` },
    update: { subjectId: subject.id, chapterId: chapter.id, status: 'PUBLISHED', contentClass: 'PRODUCTION', sourceType: 'INTERNALLY_AUTHORED', sourceName: 'Local E2E fixture', reviewer: 'local-e2e', reviewedAt: new Date(), isActive: true },
    create: { externalId: `e2e-paid-retry-question-${suffix}`, subjectId: subject.id, chapterId: chapter.id, status: 'PUBLISHED', contentClass: 'PRODUCTION', sourceType: 'INTERNALLY_AUTHORED', sourceName: 'Local E2E fixture', reviewer: 'local-e2e', reviewedAt: new Date(), isActive: true },
  });
  await prisma.questionTranslation.upsert({
    where: { questionId_language: { questionId: question.id, language: 'en' } },
    update: { questionText: 'Local E2E question', optionA: 'One', optionB: 'Two', optionC: 'Three', optionD: 'Four', correctOption: 'A', reviewed: true },
    create: { questionId: question.id, language: 'en', questionText: 'Local E2E question', optionA: 'One', optionB: 'Two', optionC: 'Three', optionD: 'Four', correctOption: 'A', reviewed: true },
  });
  const test = await prisma.test.upsert({
    where: { id: fixtureTestId },
    update: { title: { en: 'Local Paid Retry E2E Test' }, testType: 'MINI_TEST', totalQuestions: 1, durationMinutes: 15, isRandom: false, isPublished: true, contentClass: 'PRODUCTION', availableLanguages: ['en'] },
    create: { id: fixtureTestId, title: { en: 'Local Paid Retry E2E Test' }, testType: 'MINI_TEST', totalQuestions: 1, durationMinutes: 15, isRandom: false, isPublished: true, contentClass: 'PRODUCTION', availableLanguages: ['en'] },
  });
  await prisma.testQuestion.deleteMany({ where: { testId: test.id } });
  await prisma.testQuestion.create({ data: { testId: test.id, questionId: question.id, order: 1 } });
  await prisma.paidAttemptCredit.deleteMany({ where: { studentId: student.id, testId: test.id } });
  await prisma.testEntitlement.deleteMany({ where: { studentId: student.id, testId: test.id } });
  await prisma.payment.deleteMany({ where: { studentId: student.id, testId: test.id } });
  await prisma.testAttempt.deleteMany({ where: { studentId: student.id, testId: test.id } });
  await prisma.testAttempt.createMany({ data: Array.from({ length: 3 }, () => ({ studentId: student.id, testId: test.id, status: 'SUBMITTED' as const, remainingSeconds: 0, questionOrder: [question.id] })) });
  const [previousAttempts, activeAttempt, unusedCredits] = await Promise.all([
    prisma.testAttempt.count({ where: { studentId: student.id, testId: test.id, status: { not: 'IN_PROGRESS' } } }),
    prisma.testAttempt.count({ where: { studentId: student.id, testId: test.id, status: 'IN_PROGRESS' } }),
    prisma.paidAttemptCredit.count({ where: { studentId: student.id, testId: test.id, consumedAt: null, attemptId: null } }),
  ]);
  console.log('Fixture prepared: YES');
  console.log(`Mobile: ${mobile}`);
  console.log(`Test ID: ${test.id}`);
  console.log(`Start route: /student/tests/${test.id}/start`);
  console.log(`Previous attempts: ${previousAttempts}`);
  console.log(`Active attempt: ${activeAttempt}`);
  console.log(`Unused retry credits: ${unusedCredits}`);
  await prisma.$disconnect();
}

main();
