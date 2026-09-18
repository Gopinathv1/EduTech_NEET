/** Isolated integration fixtures + real PostgreSQL race tests. Never targets a remote DB. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth/password';
import { startOrResumeAttempt, finalizeAttempt, buildExamPayload } from '../lib/attempts/service';
import { finalizeExpiredAttempts } from '../lib/attempts/expiry';
import { NEET_CONFIG } from '../lib/attempts/config';

async function main() {
  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    const url = new URL(process.env[key] ?? '');
    assert.equal(url.hostname, '127.0.0.1');
    assert.equal(url.port, '55432');
  }
  const prefix = `verify-${Date.now()}`;
  const students = await Promise.all([0, 1, 2].map(i => prisma.student.create({ data: {
    name: `Local NEET verification ${i}`, mobile: `+9198${String(Date.now() + i).slice(-8)}`,
    passwordHash: undefined,
  } })));
  const password = 'Local-NEET-Test-2026!';
  await prisma.student.update({ where: { id: students[2].id }, data: { passwordHash: await hashPassword(password) } });
  const ids: string[] = [];
  for (const [index, code] of NEET_CONFIG.subjects.entries()) {
    const subject = await prisma.subject.upsert({ where: { code }, update: {}, create: { code, name: { en: code }, order: index } });
    const chapter = await prisma.chapter.create({ data: { subjectId: subject.id, name: { en: 'Local verification fixtures' }, class: 11, weightage: 100 } });
    for (let i = 0; i < 45; i++) {
      const question = await prisma.question.create({ data: {
        subjectId: subject.id, chapterId: chapter.id, status: 'PUBLISHED', isActive: true,
        translations: { create: { language: 'en', reviewed: true,
          questionText: `Local UI test fixture ${code} ${i + 1}: Evaluate 2 × 10³.`,
          optionA: '2000', optionB: '200', optionC: '20', optionD: '2', correctOption: 'A',
          explanation: i % 2 === 0 ? '2 × 1000 = 2000.' : null,
        } },
      } });
      ids.push(question.id);
    }
  }
  const tests = await Promise.all([0, 1].map(i => prisma.test.create({ data: {
    title: { en: `${prefix} NEET Full Mock ${i + 1}` }, testType: 'FULL_TEST',
    totalQuestions: 180, durationMinutes: 180, isPublished: true, availableLanguages: ['en'],
    testQuestions: { create: ids.map((questionId, order) => ({ questionId, order })) },
  } })));
  for (let i = 0; i < 3; i++) {
    const starts = await Promise.all(Array.from({ length: 6 }, () => startOrResumeAttempt(students[0].id, tests[0].id, 'en')));
    assert(starts.every(s => s.ok));
    const attemptIds = new Set(starts.map(s => s.ok ? s.attemptId : ''));
    assert.equal(attemptIds.size, 1, 'concurrent starts must resume a single session');
    const attemptId = [...attemptIds][0];
    assert.equal(await prisma.testAttempt.count({ where: { studentId: students[0].id, testId: tests[0].id } }), i + 1);
    const finalized = await Promise.all([finalizeAttempt(attemptId, { auto: false }), finalizeAttempt(attemptId, { auto: false })]);
    assert.equal(finalized.filter(f => !f.alreadyDone).length, 1);
    const result = await prisma.result.findUniqueOrThrow({ where: { attemptId } });
    assert.equal(result.score, 0);
    assert.equal(result.skipped, 180);
  }
  assert.deepEqual(await startOrResumeAttempt(students[0].id, tests[0].id, 'en'), { ok: false, code: 'attemptLimitReached' });
  assert((await startOrResumeAttempt(students[0].id, tests[1].id, 'en')).ok);
  const other = await startOrResumeAttempt(students[1].id, tests[0].id, 'en');
  assert(other.ok);
  const attempt = await prisma.testAttempt.findUniqueOrThrow({ where: { id: other.attemptId }, include: { test: true } });
  const payload = await buildExamPayload(attempt);
  assert.equal(payload.questions.length, 180);
  assert(!JSON.stringify(payload).includes('correctOption'));
  assert(!JSON.stringify(payload).includes('explanation'));
  await prisma.testAttempt.update({ where: { id: other.attemptId }, data: { startedAt: new Date(Date.now() - 181 * 60_000) } });
  assert((await finalizeExpiredAttempts()) >= 1, 'The newly expired session must be finalized; previous local fixtures may also be expired');
  assert.equal((await prisma.testAttempt.findUniqueOrThrow({ where: { id: other.attemptId } })).status, 'AUTO_SUBMITTED');
  writeFileSync('test-results/neet-fixture.json', JSON.stringify({ testId: tests[0].id, secondTestId: tests[1].id, mobile: students[2].mobile, password }));
  console.info('PASS: concurrent starts, three-attempt quota, independent users/tests, duplicate submission, 180-question totals, private answers, browser-independent expiry.');
}
main().finally(() => prisma.$disconnect()).catch(error => { console.error(error); process.exitCode = 1; });

