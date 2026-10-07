import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { PrismaClient, type QuestionType, type QuestionNature, type AnswerOption } from '@prisma/client';
import manifest from '../data/question-translations-v1/proof-manifest.json';
import { assertDisposableCiDatabase } from '../lib/testing/disposable-database';
import { SESSION_COOKIE, signSession } from '../lib/auth/jwt';
import { canShuffleOptions, canonicalToDisplay, optionDisplayOrder } from '../lib/attempts/options';

let db: PrismaClient;
let adminContext: BrowserContext;
let adminId: string;
let studentId: string;
const prefix = `translation-ci-${randomUUID()}`;
const fixtures = new Map<string, { questionId: string; testId: string }>();
let canonicalBefore: string;
async function canonicalSnapshot() {
  return JSON.stringify(await db.question.findMany({ where: { id: { in: [...fixtures.values()].map(row => row.questionId) } },
    include: { translations: { where: { language: 'en' } }, versions: true }, orderBy: { id: 'asc' } }));
}
test.beforeAll(async ({ browser }) => {
  assertDisposableCiDatabase(); // Both URLs guarded before client construction or any DB operation.
  db = new PrismaClient();
  const admin = await db.admin.create({ data: { name: 'Translation CI reviewer', email: `${prefix}@example.com`, passwordHash: 'CI unusable password', role: 'ADMIN' } }); adminId = admin.id;
  adminContext = await browser.newContext({ baseURL: 'http://localhost:3000' });
  await adminContext.addCookies([{ name: SESSION_COOKIE, value: await signSession({ sub: admin.id, kind: 'admin', role: 'ADMIN', name: admin.name }), url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' }]);
  const sources = [...JSON.parse(await readFile('data/previous-year/neet/2021/questions.json', 'utf8')), ...JSON.parse(await readFile('data/previous-year/jee/2021/questions.json', 'utf8'))] as Array<{ externalId: string; questionText: string; options: string[] | null; correctOption: AnswerOption | null; numericAnswer: number | null; explanation: string }>;
  const unique = manifest.records.filter(row => row.language === 'ta');
  for (const [index, record] of unique.entries()) {
    const source = sources.find(row => row.externalId === record.externalId)!;
    const subject = await db.subject.findUniqueOrThrow({ where: { code: record.subjectCode }, include: { chapters: { take: 1 } } });
    const question = await db.question.create({ data: { id: `${prefix}-q${index}`, externalId: `${prefix}:${record.externalId}`, subjectId: subject.id, chapterId: subject.chapters[0].id,
      questionType: record.questionType as QuestionType, questionNature: record.questionNature as QuestionNature, contentClass: 'PRODUCTION', status: 'PUBLISHED', reviewState: 'APPROVED',
      sourceType: 'SIVORA_AUTHORED', sourceName: 'Disposable translation fixture', reviewer: admin.name, reviewedAt: new Date(), isActive: true,
      translations: { create: { language: 'en', questionText: source.questionText, optionA: source.options?.[0] ?? null, optionB: source.options?.[1] ?? null,
        optionC: source.options?.[2] ?? null, optionD: source.options?.[3] ?? null, correctOption: source.correctOption ?? null, numericAnswer: source.numericAnswer ?? null,
        numericTolerance: record.questionType === 'NUMERICAL_VALUE' ? 0 : null, explanation: source.explanation, reviewed: true } } } });
    const examTest = await db.test.create({ data: { id: `${prefix}-t${index}`, title: { en: `Translation proof ${record.exam} ${index}` }, testType: 'CHAPTER_TEST',
      totalQuestions: 1, durationMinutes: 10, price: 0, isPublished: true, contentClass: 'PRODUCTION', availableLanguages: ['en'], rules: { exam: record.exam, payment: 'NONE', retake: 'FREE_UNLIMITED' },
      testQuestions: { create: { questionId: question.id, order: 1 } } } });
    fixtures.set(record.externalId, { questionId: question.id, testId: examTest.id });
    for (const translation of manifest.records.filter(row => row.externalId === record.externalId)) {
      const endpoint = `/api/admin/questions/${question.id}/translations/${translation.language}`;
      const save = await adminContext.request.patch(endpoint, { data: { ...translation.content, revision: 0, translationSource: 'SIVORA_TRANSLATION', sourceReference: 'Disposable CI proof fixture', submitForReview: true } });
      expect(save.status()).toBe(200);
      const approve = await adminContext.request.post(endpoint, { data: { revision: 1, action: 'APPROVE', note: 'Controlled test fixture approval', meaningAndOptionIdentityChecked: true } });
      expect(approve.status()).toBe(200);
    }
  }
  canonicalBefore = await canonicalSnapshot();
});
test.beforeEach(async ({ context }) => {
  const student = await db.student.create({ data: { name: 'Translation test student', email: `${randomUUID()}@example.com`, isEmailVerified: true } }); studentId = student.id;
  await context.addCookies([{ name: SESSION_COOKIE, value: await signSession({ sub: student.id, kind: 'student', role: 'STUDENT', name: student.name }), url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' }]);
});
test.afterEach(async () => {
  if (db && studentId) await db.student.delete({ where: { id: studentId } });
  expect(await canonicalSnapshot()).toBe(canonicalBefore);
});
test.afterAll(async () => {
  await adminContext?.close();
  if (db) {
    await db.test.deleteMany({ where: { id: { startsWith: prefix } } });
    await db.question.deleteMany({ where: { id: { startsWith: prefix } } });
    if (adminId) await db.admin.delete({ where: { id: adminId } });
    await db.$disconnect();
  }
});
async function start(page: Page, testId: string) {
  await page.goto(`/student/tests/${testId}/start`);
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await expect(page).toHaveURL(`/student/tests/${testId}/attempt`);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  return db.testAttempt.findFirstOrThrow({ where: { studentId, testId, status: 'IN_PROGRESS' } });
}
async function screenshot(page: Page, name: string) {
  const path = test.info().outputPath(`${name}.png`); await page.screenshot({ path, fullPage: true }); await test.info().attach(name, { path, contentType: 'image/png' });
}
const cases = [
  { name: 'NEET MCQ', externalId: 'historical-verified:neet:2021:m4:3', mobile: false },
  { name: 'JEE MCQ', externalId: 'jee-main-2021-s1-2021-02-24-shift-1-q63-nta-70819115216', mobile: false },
  { name: 'JEE NUMERICAL_VALUE mobile', externalId: 'jee-main-2021-s1-2021-02-24-shift-1-q29-nta-70819115182', mobile: true },
];
for (const example of cases) test(`${example.name}: language changes preserve answers, clock, refresh, score, retake and monitoring`, async ({ page }) => {
  if (example.mobile) await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const fixture = fixtures.get(example.externalId)!;
  const attempt = await start(page, fixture.testId);
  const q = await db.question.findUniqueOrThrow({ where: { id: fixture.questionId }, include: { translations: { where: { language: 'en' } } } });
  const en = q.translations[0];
  const numerical = q.questionType === 'NUMERICAL_VALUE';
  const order = optionDisplayOrder(attempt.seed, q.id, attempt.shuffleOptions && canShuffleOptions(en, q.questionType));
  const answerOption = numerical ? null : canonicalToDisplay(order, en.correctOption!);
  if (numerical) { await page.getByLabel('Numerical answer', { exact: true }).fill(String(en.numericAnswer)); await page.getByText('Question 1 of 1', { exact: true }).click(); }
  else await page.locator('label').filter({ has: page.getByRole('radio') }).nth(['A', 'B', 'C', 'D'].indexOf(answerOption!)).click();
  await expect.poll(() => db.answer.findUnique({ where: { attemptId_questionId: { attemptId: attempt.id, questionId: q.id } } }).then(row => numerical ? Number(row?.numericResponse) : row?.selectedOption)).toBe(numerical ? Number(en.numericAnswer) : answerOption);
  const answerBefore = await db.answer.findUniqueOrThrow({ where: { attemptId_questionId: { attemptId: attempt.id, questionId: q.id } } });
  for (const [language, label] of [['ta', 'தமிழ்'], ['hi', 'हिन्दी']] as const) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByText(manifest.records.find(row => row.externalId === example.externalId && row.language === language)!.content.questionText, { exact: true })).toBeVisible();
    await expect(page.getByText('Question 1 of 1', { exact: true })).toBeVisible();
    if (numerical) await expect(page.getByLabel('Numerical answer', { exact: true })).toHaveValue(String(en.numericAnswer));
    else await expect(page.getByRole('radio').nth(['A', 'B', 'C', 'D'].indexOf(answerOption!))).toBeChecked();
    const after = await db.testAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
    expect(after.startedAt).toEqual(attempt.startedAt); expect(after.remainingSeconds).toBe(attempt.remainingSeconds);
    expect(after.questionOrder).toEqual(attempt.questionOrder); expect(after.selectedLanguage).toBe('en');
    expect(await db.answer.findUniqueOrThrow({ where: { attemptId_questionId: { attemptId: attempt.id, questionId: q.id } } })).toEqual(answerBefore);
  }
  await page.reload(); await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'हिन्दी', exact: true })).toHaveAttribute('aria-pressed', 'true');
  if (numerical) await expect(page.getByLabel('Numerical answer', { exact: true })).toHaveValue(String(en.numericAnswer));
  else await expect(page.getByRole('radio').nth(['A', 'B', 'C', 'D'].indexOf(answerOption!))).toBeChecked();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new ClipboardEvent('copy', { bubbles: true })); document.dispatchEvent(new ClipboardEvent('paste', { bubbles: true }));
    document.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true })); window.dispatchEvent(new Event('pagehide'));
  });
  await expect.poll(async () => (await db.attemptMonitoringEvent.findMany({ where: { attemptId: attempt.id } })).map(row => row.eventType)).toEqual(expect.arrayContaining(['TAB_HIDDEN', 'WINDOW_BLUR', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CONTEXT_MENU_ATTEMPT']));
  // Actual fullscreen transitions, without inferring exits from resize or F11.
  await page.evaluate(async () => { if (document.fullscreenEnabled) await document.documentElement.requestFullscreen(); });
  await expect.poll(() => db.attemptMonitoringEvent.count({ where: { attemptId: attempt.id, eventType: 'FULLSCREEN_ENTER' } })).toBeGreaterThan(0);
  await page.evaluate(async () => { if (document.fullscreenElement) await document.exitFullscreen(); window.dispatchEvent(new Event('pagehide')); });
  await expect.poll(async () => (await db.attemptMonitoringEvent.findMany({ where: { attemptId: attempt.id } })).map(row => row.eventType)).toEqual(expect.arrayContaining(['FULLSCREEN_EXIT']));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await screenshot(page, `translation-${example.name.replaceAll(' ', '-')}`);
  await page.getByRole('banner').getByRole('button', { name: 'Submit test', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, submit', exact: true }).click();
  await expect(page).toHaveURL(`/student/results/${attempt.id}`);
  expect((await db.result.findUniqueOrThrow({ where: { attemptId: attempt.id } })).score).toBe(4);
  await page.getByRole('tab', { name: /review/i }).click();
  await expect(page.getByText(manifest.records.find(row => row.externalId === example.externalId && row.language === 'hi')!.content.questionText, { exact: true })).toBeVisible();
  await screenshot(page, `translation-result-${example.name.replaceAll(' ', '-')}`);
  const retake = await page.request.post('/api/attempts', { data: { testId: fixture.testId, language: 'en' } }); expect(retake.status()).toBe(200);
  const retakeId = (await retake.json()).attemptId; expect(retakeId).not.toBe(attempt.id);
  expect(await db.answer.count({ where: { attemptId: retakeId, selectedOption: { not: null } } })).toBe(0);
  await page.goto(`/student/tests/${fixture.testId}/attempt`);
  await expect(page.getByRole('button', { name: 'English', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('missing, draft and rejected translations fall back; admin edits reset only translation review', async ({ page }) => {
  const fixture = fixtures.get('historical-verified:neet:2021:m4:52')!;
  const endpoint = (language: string) => `/api/admin/questions/${fixture.questionId}/translations/${language}`;
  // CI-only fixture mutations: every fallback state is tested independently.
  await db.questionTranslation.delete({ where: { questionId_language: { questionId: fixture.questionId, language: 'ta' } } });
  await db.questionTranslation.update({ where: { questionId_language: { questionId: fixture.questionId, language: 'hi' } }, data: { reviewState: 'DRAFT' } });
  await start(page, fixture.testId);
  for (const label of ['தமிழ்', 'हिन्दी']) { await page.getByRole('button', { name: label, exact: true }).click(); await expect(page.getByText('Translation unavailable — showing English', { exact: true })).toBeVisible(); }
  await db.questionTranslation.update({ where: { questionId_language: { questionId: fixture.questionId, language: 'hi' } }, data: { reviewState: 'REJECTED' } });
  await page.reload(); await expect(page.getByText('Translation unavailable — showing English', { exact: true })).toBeVisible();
  await db.questionTranslation.delete({ where: { questionId_language: { questionId: fixture.questionId, language: 'hi' } } });
  await page.reload(); await expect(page.getByText('Translation unavailable — showing English', { exact: true })).toBeVisible();
  const record = manifest.records.find(row => row.externalId === 'historical-verified:neet:2021:m4:52' && row.language === 'ta')!;
  expect((await adminContext.request.patch(endpoint('ta'), { data: { ...record.content, revision: 0, translationSource: 'SIVORA_TRANSLATION', sourceReference: 'CI editorial fixture', submitForReview: true } })).status()).toBe(200);
  expect((await adminContext.request.post(endpoint('ta'), { data: { revision: 1, action: 'APPROVE', note: 'CI meaning and identity checked', meaningAndOptionIdentityChecked: true } })).status()).toBe(200);
  expect((await page.request.patch(endpoint('ta'), { data: {} })).status()).toBe(401);
  const adminPage = await adminContext.newPage(); await adminPage.goto(`/admin/question-bank/${fixture.questionId}/translations`);
  await expect(adminPage.getByText('Canonical English · SINGLE_CORRECT', { exact: true })).toBeVisible();
  await screenshot(adminPage, 'translation-admin-review');
  expect((await adminContext.request.patch(endpoint('ta'), { data: { ...record.content, revision: 2, translationSource: 'SIVORA_TRANSLATION', sourceReference: 'CI edited fixture', submitForReview: false } })).status()).toBe(200);
  expect((await db.questionTranslation.findUniqueOrThrow({ where: { questionId_language: { questionId: fixture.questionId, language: 'ta' } } })).reviewState).toBe('REVIEW_REQUIRED');
  await page.getByRole('button', { name: 'தமிழ்', exact: true }).click(); await page.reload(); await expect(page.getByText('Translation unavailable — showing English', { exact: true })).toBeVisible();
  await adminPage.close();
});
