import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { SESSION_COOKIE, signSession } from '../lib/auth/jwt';
import { assertNeetE2eTarget } from '../scripts/prepare-neet-navigation-e2e';
import { canShuffleOptions, canonicalToDisplay, optionDisplayOrder } from '../lib/attempts/options';

let db: PrismaClient;
let studentId: string;
test.beforeAll(() => { assertNeetE2eTarget(); db = new PrismaClient(); });
test.beforeEach(async ({ context }) => {
  const student = await db.student.create({ data: { name: 'Disposable NEET E2E', email: `${randomUUID()}@example.invalid`, isEmailVerified: true } });
  studentId = student.id;
  await context.addCookies([{ name: SESSION_COOKIE, value: await signSession({ sub: student.id, kind: 'student', role: 'STUDENT', name: student.name }),
    url: 'http://127.0.0.1:3017', httpOnly: true, sameSite: 'Lax' }]);
});
test.afterEach(async () => { if (studentId) await db.student.delete({ where: { id: studentId } }); });
test.afterAll(async () => { await db?.$disconnect(); });

for (const width of [390, 1440]) test(`all thirteen years and unpublished isolation at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/student/previous-year');
  const section = page.locator('section[aria-labelledby="neet-pyq-years"]');
  await expect(section.locator('li')).toHaveCount(13);
  for (let year = 2013; year <= 2025; year++) {
    const card = section.locator('li').filter({ has: page.getByRole('heading', { name: String(year), exact: true }) });
    if (year <= 2020) {
      await expect(card).toContainText('Questions coming soon');
      await expect(card.locator('a')).toHaveCount(0);
      expect(await card.innerText()).not.toMatch(/\d+ (approved )?questions/);
    } else {
      const count = { 2021: 113, 2022: 157, 2023: 172, 2024: 171, 2025: 167 }[year]!;
      await expect(card.getByRole('link')).toHaveAttribute('href', `/student/tests/neet-pyq-${year}-verified-partial/start`);
      await expect(card).toContainText(`${count} approved questions available`);
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await db.question.count({ where: { year: { in: [2019, 2020] } } })).toBe(0);
  for (const year of [2019, 2020]) {
    await page.goto(`/student/tests/neet-pyq-${year}-verified-partial/start`);
    await expect(page.getByRole('button', { name: 'Start Test', exact: true })).toHaveCount(0);
    expect((await page.request.post('/api/attempts', { data: { testId: `neet-pyq-${year}-verified-partial`, language: 'en' } })).status()).toBe(404);
  }
  expect(await db.testAttempt.count({ where: { studentId } })).toBe(0);
});

for (const year of [2021, 2022, 2023, 2024, 2025]) test(`${year}: authenticated launch, answer, resume and idempotent result`, async ({ page }) => {
  const id = `neet-pyq-${year}-verified-partial`;
  await page.goto(`/student/tests/${id}/start`);
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/student/tests/${id}/attempt$`));
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  const attempt = await db.testAttempt.findFirstOrThrow({ where: { studentId, testId: id } });
  const questions = await db.question.findMany({ where: { id: { in: attempt.questionOrder } }, include: { translations: { where: { language: 'en' } } } });
  const expectedCount = { 2021: 113, 2022: 157, 2023: 172, 2024: 171, 2025: 167 }[year]!;
  expect(questions).toHaveLength(expectedCount);
  expect(questions.every(q => q.year === year && q.reviewState === 'APPROVED')).toBe(true);
  const q = questions.find(q => q.id === attempt.questionOrder[0])!;
  const en = q.translations[0];
  await expect(page.getByText(en.questionText, { exact: true })).toBeVisible();
  const order = optionDisplayOrder(attempt.seed, q.id, attempt.shuffleOptions && canShuffleOptions(en, q.questionType));
  const letter = canonicalToDisplay(order, en.correctOption!);
  const saved = page.waitForResponse(r => r.url().endsWith(`/api/attempts/${attempt.id}/answer`) && r.request().postDataJSON()?.action === 'answer');
  await page.locator('label').filter({ has: page.getByRole('radio') }).nth('ABCD'.indexOf(letter)).click();
  expect((await saved).status()).toBe(200);
  await page.goto(`/student/tests/${id}/start`);
  await page.getByRole('button', { name: 'Resume Test', exact: true }).click();
  await expect(page).toHaveURL(/\/attempt$/);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await expect(page.getByRole('radio').nth('ABCD'.indexOf(letter))).toBeChecked();
  expect(await db.testAttempt.count({ where: { studentId, testId: id } })).toBe(1);
  await page.getByRole('banner').getByRole('button', { name: 'Submit test', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, submit', exact: true }).click();
  await expect(page).toHaveURL(`/student/results/${attempt.id}`);
  await expect(page.getByText('Score', { exact: true })).toBeVisible();
  const result = await db.result.findUniqueOrThrow({ where: { attemptId: attempt.id } });
  expect(result).toMatchObject({ correct: 1, wrong: 0, skipped: expectedCount - 1, totalQuestions: expectedCount, score: 4 });
  const retry = await page.request.post(`/api/attempts/${attempt.id}/submit`, { data: {} });
  expect(retry.status()).toBe(200);
  expect(await db.result.count({ where: { attemptId: attempt.id } })).toBe(1);
  expect(await db.testAttempt.count({ where: { studentId, testId: id } })).toBe(1);
});
