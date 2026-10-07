import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { SESSION_COOKIE, signSession } from '../lib/auth/jwt';
import { canShuffleOptions, canonicalToDisplay, optionDisplayOrder, type OptLetter } from '../lib/attempts/options';
import natureManifest from '../data/previous-year/jee/question-nature.json';

const MIXED = 'jee-pyq-mixed-2021-2025';
const MATH = 'jee-pyq-mixed-jee_mathematics';
const CANONICAL_IDS = new Set(natureManifest.rows.map(row => row.externalId));
let prisma: PrismaClient;
let studentId: string;

test.beforeAll(() => {
  // This spec creates fixture students/attempts. Never point it at a shared DB.
  if (process.env.CI !== 'true') throw new Error('JEE E2E requires the disposable CI database.');
  for (const name of ['DATABASE_URL', 'DIRECT_URL'] as const) {
    const url = new URL(process.env[name] ?? '');
    if (!['postgres:', 'postgresql:'].includes(url.protocol)
      || !['localhost', '127.0.0.1'].includes(url.hostname)
      || url.port !== '5432' || url.pathname !== '/neet_test'
      || url.searchParams.has('host') || url.searchParams.get('pgbouncer') === 'true') {
      throw new Error('JEE E2E requires both URLs to target localhost:5432/neet_test.');
    }
  }
  prisma = new PrismaClient();
});

test.beforeEach(async ({ context }) => {
  // Registration/email verification are covered by happy-path.spec.ts. This
  // verified local student focuses these tests on the released JEE experience.
  const student = await prisma.student.create({ data: {
    name: 'JEE release E2E student', email: `jee_e2e_${randomUUID()}@example.com`, isEmailVerified: true,
  } });
  studentId = student.id;
  await context.addCookies([{ name: SESSION_COOKIE,
    value: await signSession({ sub: studentId, kind: 'student', role: 'STUDENT', name: student.name }),
    url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax',
  }]);
});

test.afterEach(async () => {
  if (studentId && prisma) await prisma.student.delete({ where: { id: studentId } });
});
test.afterAll(async () => { if (prisma) await prisma.$disconnect(); });

async function assertFitsViewport(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

async function capture(page: Page, name: string) {
  const path = test.info().outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await test.info().attach(name, { path, contentType: 'image/png' });
}

for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`${viewport.name}: five-year shift identity, nature counts and safe empty filter`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/student/previous-year');
    const shifts = page.locator('section').filter({ has: page.getByRole('heading', { name: 'JEE Main historical shift practice', exact: true }) });
    const identities = [
      { year: 2021, session: 1, date: '2021-02-24', count: 66 },
      { year: 2022, session: 2, date: '2022-07-25', count: 33 },
      { year: 2023, session: 2, date: '2023-04-06', count: 46 },
      { year: 2024, session: 2, date: '2024-04-06', count: 37 },
      { year: 2025, session: 1, date: '2025-01-22', count: 36 },
    ];
    for (const identity of identities) {
      await shifts.locator('summary').filter({ hasText: new RegExp(`^${identity.year}$`) }).click();
      const year = shifts.locator('details').filter({ has: page.locator('summary').filter({ hasText: new RegExp(`^${identity.year}$`) }) });
      await year.locator('summary').filter({ hasText: `Session ${identity.session}` }).click();
      await year.locator('summary').filter({ hasText: identity.date }).click();
      await expect(year.getByRole('link', { name: `Shift 1 · Verified partial practice · ${identity.count} questions · Start`, exact: true })).toHaveAttribute(
        'href', `/student/tests/jee-main-${identity.year}-s${identity.session}-${identity.date}-shift-1-verified-partial/start`,
      );
      // A year aggregate is a distinct practice from its selected historical shift.
      await expect(page.locator(`a[href="/student/tests/jee-pyq-${identity.year}-year-practice/start"]`)).toBeVisible();
    }
    await assertFitsViewport(page);
    await capture(page, `${viewport.name}-catalogue`);
    await shifts.getByRole('link', { name: 'Shift 1 · Verified partial practice · 36 questions · Start', exact: true }).click();
    await expect(page.getByText('JEE Main 2025 · Session 1 · 2025-01-22 · Shift 1 — Verified partial practice', { exact: true })).toBeVisible();
    await expect(page.locator('dl').getByText('36', { exact: true })).toBeVisible();
    await assertFitsViewport(page);

    await page.goto(`/student/tests/${MIXED}/start`);
    await expect(page.getByRole('link', { name: 'All Questions (75)', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Conceptual / Theory (51)', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Numerical / Problem-solving (167)', exact: true })).toBeVisible();
    await expect(page.getByText('Each subject has 20 multiple-choice and 5 numerical-value questions.', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Conceptual / Theory (51)', exact: true }).click();
    await expect(page.locator('dl').getByText('51', { exact: true })).toBeVisible();
    await expect(page.getByText(/Filtered practice using validated questions/)).toBeVisible();
    await page.getByRole('link', { name: 'Numerical / Problem-solving (167)', exact: true }).click();
    await expect(page.locator('dl').getByText('75', { exact: true })).toBeVisible();
    await assertFitsViewport(page);

    await page.goto(`/student/tests/${MATH}/start?nature=CONCEPTUAL_THEORY`);
    await expect(page.getByRole('status')).toHaveText('No validated questions available for this filter.');
    await expect(page.getByRole('button', { name: 'Start Test', exact: true })).toBeDisabled();
    await expect(page.getByRole('link', { name: /^Conceptual \/ Theory/ })).toHaveCount(0);
    const rejected = await page.request.post('/api/attempts', { data: {
      testId: MATH, language: 'en', questionNature: 'CONCEPTUAL_THEORY',
    } });
    expect(rejected.status()).toBe(400);
    expect(await rejected.json()).toMatchObject({ ok: false, error: 'questionSetUnavailable' });
    expect(await prisma.testAttempt.count({ where: { studentId } })).toBe(0);
    await assertFitsViewport(page);
    await capture(page, `${viewport.name}-empty-filter`);
  });
}

test('conceptual JEE selection stays frozen and the server deadline automatically submits it', async ({ page }) => {
  await page.goto(`/student/tests/${MIXED}/start?nature=CONCEPTUAL_THEORY`);
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await expect(page).toHaveURL(/\/attempt$/);
  await expect(page.getByText('Question 1 of 51', { exact: true })).toBeVisible();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  const attempt = await prisma.testAttempt.findFirstOrThrow({ where: { studentId, testId: MIXED, status: 'IN_PROGRESS' }, include: { test: true } });
  expect(attempt.questionNature).toBe('CONCEPTUAL_THEORY');
  expect(attempt.questionOrder).toHaveLength(51);
  const selected = await prisma.question.findMany({ where: { id: { in: attempt.questionOrder } }, select: { externalId: true, questionNature: true, examYear: true, exam: true } });
  expect(selected.every(question => question.externalId && CANONICAL_IDS.has(question.externalId)
    && question.questionNature === 'CONCEPTUAL_THEORY' && question.exam === 'JEE')).toBe(true);
  expect([...new Set(selected.map(question => question.examYear))].sort()).toEqual([2021, 2022, 2023, 2024, 2025]);
  // Change only this disposable attempt's server clock; the stale cached value
  // must not extend the deadline. No clock manipulation reaches production.
  await prisma.testAttempt.update({ where: { id: attempt.id }, data: {
    startedAt: new Date(Date.now() - (attempt.test.durationMinutes * 60 - 2) * 1000),
    remainingSeconds: attempt.test.durationMinutes * 60,
  } });
  await page.reload();
  await expect(page).toHaveURL(`/student/results/${attempt.id}`, { timeout: 60_000 });
  const finalized = await prisma.testAttempt.findUniqueOrThrow({ where: { id: attempt.id }, include: { result: true } });
  expect(finalized.status).toBe('AUTO_SUBMITTED');
  expect(finalized.questionOrder).toEqual(attempt.questionOrder);
  expect(finalized.questionNature).toBe('CONCEPTUAL_THEORY');
  expect(finalized.result).toMatchObject({ totalQuestions: 51, correct: 0, wrong: 0, skipped: 51, score: 0 });
  await expect(page.getByRole('link', { name: 'Take Another Attempt', exact: true })).toHaveAttribute('href', `/student/tests/${MIXED}/start?nature=CONCEPTUAL_THEORY`);
  expect(await prisma.payment.count({ where: { studentId } })).toBe(0);
});

test('JEE mixed practice persists MCQ/numerical answers, resumes, scores, reviews and allows free retakes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/student/tests/${MIXED}/start`);
  await expect(page.getByText('Unlimited practice access is available for this test.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/student/tests/${MIXED}/attempt$`));
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  const initial = await prisma.testAttempt.findFirstOrThrow({ where: { studentId, testId: MIXED, status: 'IN_PROGRESS' } });
  expect(initial.questionOrder).toHaveLength(75);
  expect(new Set(initial.questionOrder).size).toBe(75);
  const questions = await prisma.question.findMany({ where: { id: { in: initial.questionOrder } }, include: {
    subject: { select: { code: true } }, translations: { where: { language: 'en' } },
  } });
  expect(questions.every(question => question.externalId && CANONICAL_IDS.has(question.externalId))).toBe(true);
  expect([...new Set(questions.map(question => question.examYear))].sort()).toEqual([2021, 2022, 2023, 2024, 2025]);
  for (const code of ['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS']) {
    expect(questions.filter(question => question.subject.code === code && question.questionType === 'SINGLE_CORRECT')).toHaveLength(20);
    expect(questions.filter(question => question.subject.code === code && question.questionType === 'NUMERICAL_VALUE')).toHaveLength(5);
  }
  const mcqs = initial.questionOrder.map(id => questions.find(question => question.id === id)!).filter(question => question.questionType === 'SINGLE_CORRECT');
  const numericals = initial.questionOrder.map(id => questions.find(question => question.id === id)!).filter(question => question.questionType === 'NUMERICAL_VALUE');
  const answered = [mcqs[0], numericals[0], mcqs[1], numericals[1]];
  const responses = new Map<string, OptLetter | number>();
  for (const [index, question] of answered.entries()) {
    const number = initial.questionOrder.indexOf(question.id) + 1;
    await page.getByRole('button', { name: new RegExp(`^${number}: `) }).click();
    await expect(page.getByText(`Question ${number} of 75`, { exact: true })).toBeVisible();
    const en = question.translations[0];
    const saved = page.waitForResponse(response => response.url().endsWith(`/api/attempts/${initial.id}/answer`)
      && response.request().postDataJSON()?.action === 'answer' && response.request().postDataJSON()?.questionId === question.id);
    if (question.questionType === 'NUMERICAL_VALUE') {
      const value = Number(en.numericAnswer) + (index === 3 ? 1 : 0);
      responses.set(question.id, value);
      await page.getByLabel('Numerical answer', { exact: true }).fill(String(value));
      await page.getByLabel('Numerical answer', { exact: true }).blur();
    } else {
      const order = optionDisplayOrder(initial.seed, question.id, initial.shuffleOptions && canShuffleOptions(en, question.questionType));
      const correct = canonicalToDisplay(order, en.correctOption!);
      const value = index === 2 ? (['A', 'B', 'C', 'D'] as const).find(option => option !== correct)! : correct;
      responses.set(question.id, value);
      await page.locator('label').filter({ has: page.getByRole('radio') }).nth(['A', 'B', 'C', 'D'].indexOf(value)).click();
    }
    expect((await saved).status()).toBe(200);
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    if (index === 1) await capture(page, 'desktop-numerical-attempt');
  }
  const records = await prisma.answer.findMany({ where: { attemptId: initial.id, questionId: { in: answered.map(question => question.id) } } });
  expect(records).toHaveLength(4);
  for (const answer of records) {
    const expected = responses.get(answer.questionId)!;
    if (typeof expected === 'number') {
      expect(Number(answer.numericResponse)).toBe(expected);
      expect(answer.selectedOption).toBeNull();
    } else {
      expect(answer.selectedOption).toBe(expected);
      expect(answer.numericResponse).toBeNull();
    }
  }

  const beforeTimer = await page.getByRole('timer').textContent();
  await expect.poll(() => page.getByRole('timer').textContent()).not.toBe(beforeTimer);
  const beforeResume = await page.request.post(`/api/attempts/${initial.id}/sync`, { data: {} });
  const clock = (await beforeResume.json()).remainingSeconds as number;
  // A different requested nature must preserve the existing attempt, rather
  // than change its frozen question set, answer display order or timer start.
  await page.goto(`/student/tests/${MIXED}/start?nature=CONCEPTUAL_THEORY`);
  await expect(page.getByText('Resume preserves the saved question selection: All Questions.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Resume Test', exact: true }).click();
  await expect(page).toHaveURL(/\/attempt$/);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  const resumed = await prisma.testAttempt.findUniqueOrThrow({ where: { id: initial.id } });
  expect(resumed.questionOrder).toEqual(initial.questionOrder);
  expect(resumed.seed).toBe(initial.seed);
  expect(resumed.startedAt).toEqual(initial.startedAt);
  expect(resumed.questionNature).toBeNull();
  expect(await prisma.testAttempt.count({ where: { studentId, testId: MIXED } })).toBe(1);
  const afterResume = await page.request.post(`/api/attempts/${initial.id}/sync`, { data: {} });
  expect((await afterResume.json()).remainingSeconds).toBeLessThanOrEqual(clock);
  for (const question of answered.slice(0, 2)) {
    const number = initial.questionOrder.indexOf(question.id) + 1;
    await page.getByRole('button', { name: new RegExp(`^${number}: `) }).click();
    if (question.questionType === 'NUMERICAL_VALUE') await expect(page.getByLabel('Numerical answer')).toHaveValue(String(responses.get(question.id)));
    else await expect(page.getByRole('radio').nth(['A', 'B', 'C', 'D'].indexOf(responses.get(question.id) as string))).toBeChecked();
  }
  await page.getByRole('banner').getByRole('button', { name: 'Submit test', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, submit', exact: true }).click();
  await expect(page).toHaveURL(`/student/results/${initial.id}`, { timeout: 60_000 });
  await expect(page.getByText('Score', { exact: true })).toBeVisible();
  const result = await prisma.result.findUniqueOrThrow({ where: { attemptId: initial.id } });
  expect(result).toMatchObject({ totalQuestions: 75, correct: 2, wrong: 2, skipped: 71, score: 6 });
  const finalized = await prisma.testAttempt.findUniqueOrThrow({ where: { id: initial.id } });
  expect(finalized.status).toBe('SUBMITTED');
  expect(finalized.submittedAt).not.toBeNull();
  expect(await prisma.answer.count({ where: { attemptId: initial.id, isCorrect: true } })).toBe(2);
  expect(await prisma.answer.count({ where: { attemptId: initial.id, isCorrect: false } })).toBe(2);
  await page.getByRole('tab', { name: 'Answer review', exact: true }).click();
  await expect(page.getByRole('button', { name: 'All (75)', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Wrong (2)', exact: true }).click();
  for (const question of answered.slice(2)) await expect(page.getByText(question.translations[0].questionText, { exact: true })).toBeVisible();
  await expect(page.getByText(`Correct answer: ${Number(numericals[1].translations[0].numericAnswer)}`, { exact: true })).toBeVisible();
  await expect(page.getByText(/Unlimited practice attempts are available/)).toBeVisible();
  await page.getByRole('link', { name: 'Take Another Attempt', exact: true }).click();
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await expect(page).toHaveURL(/\/attempt$/);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  const attempts = await prisma.testAttempt.findMany({ where: { studentId, testId: MIXED } });
  expect(attempts).toHaveLength(2);
  const fresh = attempts.find(attempt => attempt.id !== initial.id)!;
  expect(fresh.status).toBe('IN_PROGRESS');
  expect(fresh.seed).not.toBe(initial.seed);
  expect(fresh.questionOrder).toHaveLength(75);
  expect(await prisma.answer.count({ where: { attemptId: fresh.id, OR: [{ selectedOption: { not: null } }, { numericResponse: { not: null } }] } })).toBe(0);
  expect(await prisma.payment.count({ where: { studentId } })).toBe(0);
  expect(await prisma.paidAttemptCredit.count({ where: { studentId } })).toBe(0);
});
