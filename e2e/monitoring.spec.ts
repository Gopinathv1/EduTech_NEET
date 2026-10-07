import { randomUUID } from 'node:crypto';
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { SESSION_COOKIE, signSession } from '../lib/auth/jwt';
import { canShuffleOptions, canonicalToDisplay, optionDisplayOrder } from '../lib/attempts/options';
import { MONITORING_EVENT_TYPES, MONITORING_NOTICE, type ClientMonitoringEvent } from '../lib/attempts/monitoring-contract';

const JEE_MIXED = 'jee-pyq-mixed-2021-2025';
const CLIPBOARD_SENTINEL = 'private clipboard content must never leave this document';
let prisma: PrismaClient;
let studentId: string | undefined;
let neetTestId: string;

test.beforeAll(async () => {
  // Every mutation below belongs to a disposable CI student, attempt, or new
  // monitoring table. Reject BOTH unsafe URLs before constructing the client.
  if (process.env.CI !== 'true') throw new Error('Monitoring E2E requires the disposable CI database.');
  for (const name of ['DATABASE_URL', 'DIRECT_URL'] as const) {
    const url = new URL(process.env[name] ?? '');
    if (!['postgres:', 'postgresql:'].includes(url.protocol)
      || !['localhost', '127.0.0.1'].includes(url.hostname)
      || url.port !== '5432' || url.pathname !== '/neet_test'
      || url.searchParams.has('host') || url.searchParams.get('pgbouncer') === 'true') {
      throw new Error('Monitoring E2E requires both URLs to target localhost:5432/neet_test.');
    }
  }
  prisma = new PrismaClient();
  neetTestId = (await prisma.test.findFirstOrThrow({ where: {
    title: { path: ['en'], equals: 'Botany: Genetics Chapter Test' },
    contentClass: 'PRODUCTION', isPublished: true,
  }, select: { id: true } })).id;
});

test.beforeEach(async ({ context }) => {
  const student = await prisma.student.create({ data: {
    name: 'Monitoring E2E student', email: `monitoring_${randomUUID()}@example.com`, isEmailVerified: true,
  } });
  studentId = student.id;
  await context.addCookies([{ name: SESSION_COOKIE,
    value: await signSession({ sub: student.id, kind: 'student', role: 'STUDENT', name: student.name }),
    url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax',
  }]);
});

test.afterEach(async () => {
  if (studentId && prisma) await prisma.student.delete({ where: { id: studentId } });
  studentId = undefined;
});
test.afterAll(async () => { if (prisma) await prisma.$disconnect(); });

function signal(eventType: ClientMonitoringEvent['eventType'], sequence = 1): ClientMonitoringEvent {
  return { clientEventId: randomUUID(), eventType, sequence, clientTimestamp: new Date().toISOString() };
}

async function startApi(request: APIRequestContext, testId: string) {
  const response = await request.post('/api/attempts', { data: { testId, language: 'en' } });
  expect(response.status()).toBe(200);
  const body = await response.json() as { attemptId: string };
  expect(body.attemptId).toBeTruthy();
  return body.attemptId;
}

async function startUi(page: Page, testId: string) {
  await page.goto(`/student/tests/${testId}/start`);
  await expect(page.getByText(MONITORING_NOTICE, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await expect(page).toHaveURL(`/student/tests/${testId}/attempt`);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  return prisma.testAttempt.findFirstOrThrow({ where: { studentId, testId, status: 'IN_PROGRESS' } });
}

async function capture(page: Page, name: string) {
  const path = test.info().outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await test.info().attach(name, { path, contentType: 'image/png' });
}

async function submitUi(page: Page, attemptId: string) {
  await page.getByRole('banner').getByRole('button', { name: 'Submit test', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, submit', exact: true }).click();
  await expect(page).toHaveURL(`/student/results/${attemptId}`, { timeout: 60_000 });
  await expect(page.getByText('Score', { exact: true })).toBeVisible();
}

test('monitoring enforces ownership, strict metadata, deduplication, caps and the server deadline without changing attempts', async ({ page, browser }) => {
  // Starting through the API avoids incidental browser signals and provides a
  // stable before/after check of every existing attempt/answer field.
  const attemptId = await startApi(page.request, neetTestId);
  const endpoint = `/api/attempts/${attemptId}/monitoring`;
  const initial = await prisma.testAttempt.findUniqueOrThrow({ where: { id: attemptId } });
  const post = (events: ClientMonitoringEvent[]) => page.request.post(endpoint, { data: { events } });

  const anonymous = await browser.newContext();
  try {
    expect((await anonymous.request.post(`http://localhost:3000${endpoint}`, { data: { events: [signal('TAB_HIDDEN')] } })).status()).toBe(401);
    const foreignStudent = await prisma.student.create({ data: {
      name: 'Other monitoring student', email: `monitoring_other_${randomUUID()}@example.com`, isEmailVerified: true,
    } });
    try {
      await anonymous.addCookies([{ name: SESSION_COOKIE,
        value: await signSession({ sub: foreignStudent.id, kind: 'student', role: 'STUDENT', name: foreignStudent.name }),
        url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax',
      }]);
      expect((await anonymous.request.post(`http://localhost:3000${endpoint}`, { data: { events: [signal('TAB_HIDDEN')] } })).status()).toBe(404);
    } finally { await prisma.student.delete({ where: { id: foreignStudent.id } }); }
  } finally { await anonymous.close(); }
  expect((await page.request.post('/api/attempts/unknown-monitoring-attempt/monitoring', { data: { events: [signal('TAB_HIDDEN')] } })).status()).toBe(404);

  for (const invalid of [
    { events: [] },
    { events: [signal('TAB_HIDDEN')], studentId: 'forged-owner' },
    { events: [{ ...signal('TAB_HIDDEN'), clipboardText: CLIPBOARD_SENTINEL }] },
    { events: [{ ...signal('TAB_HIDDEN'), recordedAt: new Date().toISOString() }] },
    { events: [{ ...signal('TAB_HIDDEN'), eventType: 'CHEATING_SCORE' }] },
    { events: [{ ...signal('TAB_HIDDEN'), clientEventId: 'not-a-uuid' }] },
    { events: [{ ...signal('TAB_HIDDEN'), sequence: -1 }] },
    { events: [{ ...signal('TAB_HIDDEN'), clientTimestamp: 'invalid-date' }] },
    { events: Array.from({ length: 21 }, () => signal('TAB_HIDDEN')) },
  ]) {
    expect((await page.request.post(endpoint, { data: invalid })).status()).toBe(400);
  }
  expect(await prisma.attemptMonitoringEvent.count({ where: { attemptId } })).toBe(0);

  const events = MONITORING_EVENT_TYPES.map((eventType, sequence) => ({
    ...signal(eventType, sequence), clientTimestamp: '2000-01-01T00:00:00.000Z',
  }));
  const receivedAfter = Date.now();
  expect((await post(events)).status()).toBe(200);
  expect((await post(events)).status()).toBe(200);
  const stored = await prisma.attemptMonitoringEvent.findMany({ where: { attemptId } });
  expect(stored).toHaveLength(9);
  expect(new Set(stored.map(row => row.clientEventId)).size).toBe(9);
  expect(stored.every(row => row.recordedAt.getTime() >= receivedAfter - 1_000
    && row.clientTimestamp?.getUTCFullYear() === 2000)).toBe(true);
  expect(stored.every(row => Object.keys(row).sort().join(',')
    === 'attemptId,clientEventId,clientTimestamp,eventType,id,recordedAt,sequence')).toBe(true);
  // One noisy native action cannot generate an unbounded stream of rows.
  expect((await post(Array.from({ length: 20 }, () => signal('TAB_HIDDEN')))).status()).toBe(200);
  expect(await prisma.attemptMonitoringEvent.count({ where: { attemptId } })).toBeLessThanOrEqual(10);
  expect(await prisma.testAttempt.findUniqueOrThrow({ where: { id: attemptId } })).toEqual(initial);
  expect(await prisma.answer.count({ where: { attemptId } })).toBe(0);
  expect(await prisma.result.count({ where: { attemptId } })).toBe(0);

  // Exercise the database-wide rate cap without waiting a minute or mutating
  // protected content. These rows are in the new table in disposable CI only.
  await prisma.attemptMonitoringEvent.deleteMany({ where: { attemptId } });
  await prisma.attemptMonitoringEvent.createMany({ data: Array.from({ length: 60 }, (_, sequence) => ({
    attemptId, clientEventId: randomUUID(), eventType: 'COPY_ATTEMPT' as const,
    sequence, recordedAt: new Date(Date.now() - 10_000),
  })) });
  expect((await post([signal('TAB_HIDDEN')])).status()).toBe(429);
  expect(await prisma.attemptMonitoringEvent.count({ where: { attemptId } })).toBe(60);
  expect(await prisma.testAttempt.findUniqueOrThrow({ where: { id: attemptId } })).toEqual(initial);

  const duration = (await prisma.test.findUniqueOrThrow({ where: { id: neetTestId } })).durationMinutes;
  await prisma.testAttempt.update({ where: { id: attemptId }, data: {
    startedAt: new Date(Date.now() - (duration * 60 + 1) * 1_000), remainingSeconds: duration * 60,
  } });
  const expired = await prisma.testAttempt.findUniqueOrThrow({ where: { id: attemptId } });
  expect((await post([signal('WINDOW_BLUR')])).status()).toBe(409);
  expect(await prisma.testAttempt.findUniqueOrThrow({ where: { id: attemptId } })).toEqual(expired);
  expect(await prisma.attemptMonitoringEvent.count({ where: { attemptId } })).toBe(60);
  const finalized = await page.request.post(`/api/attempts/${attemptId}/submit`, { data: {} });
  expect((await finalized.json()).status).toBe('AUTO_SUBMITTED');
  expect((await post([signal('TAB_VISIBLE')])).status()).toBe(409);
  expect((await page.request.post(`/api/attempts/${attemptId}/submit`, { data: {} })).status()).toBe(200);
  expect(await prisma.result.count({ where: { attemptId } })).toBe(1);
  expect(await prisma.result.findUniqueOrThrow({ where: { attemptId } })).toMatchObject({ score: 0, skipped: 3 });
});

test('NEET browser signals stay neutral, preserve clipboard defaults and display read-only result history', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/student/tests/${neetTestId}/start`);
  await expect(page.getByText(MONITORING_NOTICE, { exact: true })).toBeVisible();
  await capture(page, 'desktop-monitoring-notice');
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await expect(page).toHaveURL(/\/attempt$/);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  const attempt = await prisma.testAttempt.findFirstOrThrow({ where: { studentId, testId: neetTestId, status: 'IN_PROGRESS' } });
  const uploads: string[] = [];
  page.on('request', request => {
    if (request.url().endsWith(`/api/attempts/${attempt.id}/monitoring`)) uploads.push(request.postData() ?? '');
  });

  // Dispatch the same DOM events the browser emits. Controlled visibility is
  // used because headless Chromium does not reliably hide background tabs.
  const defaultsPreserved = await page.evaluate(sentinel => {
    const descriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    try {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    } finally {
      if (descriptor) Object.defineProperty(document, 'visibilityState', descriptor);
      else delete (document as unknown as Record<string, unknown>).visibilityState;
    }
    window.dispatchEvent(new Event('blur'));
    window.dispatchEvent(new Event('focus'));
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', sentinel);
    return ['copy', 'paste'].map(type => {
      const event = new ClipboardEvent(type, { bubbles: true, cancelable: true, clipboardData });
      return document.dispatchEvent(event) && !event.defaultPrevented;
    }).concat(document.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })));
  }, CLIPBOARD_SENTINEL);
  expect(defaultsPreserved).toEqual([true, true, true]);
  // Exercise the actual standard Fullscreen API; it remains optional and no
  // resize/F11 inference or forced fullscreen is involved.
  await page.evaluate(() => document.documentElement.requestFullscreen());
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  // Wait for the asynchronous browser event to be captured before exiting;
  // an immediate enter/exit can otherwise coalesce before listeners run.
  await expect.poll(() => prisma.attemptMonitoringEvent.count({ where: {
    attemptId: attempt.id, eventType: 'FULLSCREEN_ENTER',
  } }), { timeout: 25_000 }).toBeGreaterThan(0);
  await page.evaluate(() => document.exitFullscreen());
  await expect.poll(async () => {
    const rows = await prisma.attemptMonitoringEvent.findMany({ where: { attemptId: attempt.id } });
    return [...new Set(rows.map(row => row.eventType))].sort();
  }, { timeout: 25_000 }).toEqual([...MONITORING_EVENT_TYPES].sort());
  expect(uploads.length).toBeGreaterThan(0);
  expect(uploads.join('')).not.toContain(CLIPBOARD_SENTINEL);
  for (const upload of uploads) {
    const body = JSON.parse(upload) as { events: Array<Record<string, unknown>> };
    expect(Object.keys(body)).toEqual(['events']);
    expect(body.events.every(event => Object.keys(event).every(key =>
      ['clientEventId', 'eventType', 'clientTimestamp', 'sequence'].includes(key)))).toBe(true);
  }

  const secondTab = await context.newPage();
  await secondTab.goto(`/student/tests/${neetTestId}/attempt`);
  await expect(secondTab.getByText('Saved', { exact: true })).toBeVisible();
  const retry = await prisma.attemptMonitoringEvent.findFirstOrThrow({ where: { attemptId: attempt.id } });
  expect((await secondTab.request.post(`/api/attempts/${attempt.id}/monitoring`, { data: { events: [{
    clientEventId: retry.clientEventId, eventType: retry.eventType,
    ...(retry.clientTimestamp ? { clientTimestamp: retry.clientTimestamp.toISOString() } : {}),
    ...(retry.sequence === null ? {} : { sequence: retry.sequence }),
  }] } })).status()).toBe(200);
  expect(await prisma.attemptMonitoringEvent.count({ where: { attemptId: attempt.id, clientEventId: retry.clientEventId } })).toBe(1);
  await secondTab.evaluate(() => {
    document.dispatchEvent(new ClipboardEvent('paste', { bubbles: true }));
    window.dispatchEvent(new Event('pagehide'));
  });
  await secondTab.close();
  await page.bringToFront();
  const questions = await prisma.question.findMany({ where: { id: { in: attempt.questionOrder } }, include: {
    translations: { where: { language: 'en' } },
  } });
  const first = questions.find(question => question.id === attempt.questionOrder[0])!;
  const en = first.translations[0];
  const correct = canonicalToDisplay(optionDisplayOrder(attempt.seed, first.id, attempt.shuffleOptions && canShuffleOptions(en, first.questionType)), en.correctOption!);
  await page.locator('label').filter({ has: page.getByRole('radio') }).nth(['A', 'B', 'C', 'D'].indexOf(correct)).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await submitUi(page, attempt.id);
  const count = await prisma.attemptMonitoringEvent.count({ where: { attemptId: attempt.id } });
  const summary = page.getByRole('region', { name: 'Monitoring summary', exact: true });
  await expect(summary.getByText(`Monitoring events: ${count}`, { exact: true })).toBeVisible();
  await summary.getByText('View monitoring history', { exact: true }).click();
  await expect(summary.getByText('Copy attempt', { exact: true })).toBeVisible();
  await expect(summary.getByText('Fullscreen exit', { exact: true })).toBeVisible();
  await expect(summary.getByRole('columnheader', { name: 'Time', exact: true })).toBeVisible();
  await expect(summary.getByRole('columnheader', { name: 'Event', exact: true })).toBeVisible();
  await capture(page, 'desktop-monitoring-result');
  expect(await prisma.result.findUniqueOrThrow({ where: { attemptId: attempt.id } })).toMatchObject({ score: 4, correct: 1, wrong: 0, skipped: 2 });
  expect(await prisma.result.count({ where: { attemptId: attempt.id } })).toBe(1);
  const rows = await prisma.attemptMonitoringEvent.findMany({ where: { attemptId: attempt.id } });
  expect(new Set(rows.map(row => row.clientEventId)).size).toBe(rows.length);
  await page.request.post(`/api/attempts/${attempt.id}/submit`, { data: {} });
  expect(await prisma.result.count({ where: { attemptId: attempt.id } })).toBe(1);
  expect((await page.request.post(`/api/attempts/${attempt.id}/monitoring`, { data: { events: [signal('COPY_ATTEMPT')] } })).status()).toBe(409);
  expect(await prisma.attemptMonitoringEvent.count({ where: { attemptId: attempt.id } })).toBe(count);
  await page.getByRole('link', { name: 'Take Another Attempt', exact: true }).click();
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await expect(page).toHaveURL(/\/attempt$/);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  const fresh = await prisma.testAttempt.findFirstOrThrow({ where: { studentId, testId: neetTestId, status: 'IN_PROGRESS' } });
  expect(fresh.id).not.toBe(attempt.id);
  expect(fresh.seed).not.toBe(attempt.seed);
  expect(await prisma.answer.count({ where: { attemptId: fresh.id, selectedOption: { not: null } } })).toBe(0);
  expect(await prisma.attemptMonitoringEvent.count({ where: { attemptId: attempt.id } })).toBe(count);
});

test('mobile JEE monitoring failures and offline refresh do not block MCQ/numerical saves, timer, navigation or scoring', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const attempt = await startUi(page, JEE_MIXED);
  const endpoint = `**/api/attempts/${attempt.id}/monitoring`;
  let failedUploads = 0;
  await page.route(endpoint, async route => { failedUploads++; await route.abort('failed'); });
  await page.evaluate(() => {
    document.dispatchEvent(new ClipboardEvent('copy', { bubbles: true }));
    window.dispatchEvent(new Event('pagehide'));
  });
  await expect.poll(() => failedUploads, { timeout: 15_000 }).toBeGreaterThan(0);
  const beforeClock = (await (await page.request.post(`/api/attempts/${attempt.id}/sync`, { data: {} })).json()).remainingSeconds as number;
  const questions = await prisma.question.findMany({ where: { id: { in: attempt.questionOrder } }, include: {
    translations: { where: { language: 'en' } },
  } });
  const mcq = attempt.questionOrder.map(id => questions.find(question => question.id === id)!).find(question => question.questionType === 'SINGLE_CORRECT')!;
  const numeric = attempt.questionOrder.map(id => questions.find(question => question.id === id)!).find(question => question.questionType === 'NUMERICAL_VALUE')!;
  await page.getByRole('button', { name: 'Questions', exact: true }).click();
  const jump = async (questionId: string) => {
    const number = attempt.questionOrder.indexOf(questionId) + 1;
    await page.getByRole('button', { name: new RegExp(`^${number}: `) }).click();
    await expect(page.getByText(`Question ${number} of 75`, { exact: true })).toBeVisible();
  };
  await jump(mcq.id);
  const correct = canonicalToDisplay(optionDisplayOrder(attempt.seed, mcq.id,
    attempt.shuffleOptions && canShuffleOptions(mcq.translations[0], mcq.questionType)), mcq.translations[0].correctOption!);
  const savedMcq = page.waitForResponse(response => response.url().endsWith(`/api/attempts/${attempt.id}/answer`)
    && response.request().postDataJSON()?.action === 'answer' && response.request().postDataJSON()?.questionId === mcq.id);
  await page.locator('label').filter({ has: page.getByRole('radio') }).nth(['A', 'B', 'C', 'D'].indexOf(correct)).click();
  expect((await savedMcq).status()).toBe(200);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await jump(numeric.id);
  const numericValue = Number(numeric.translations[0].numericAnswer);
  const savedNumeric = page.waitForResponse(response => response.url().endsWith(`/api/attempts/${attempt.id}/answer`)
    && response.request().postDataJSON()?.action === 'answer' && response.request().postDataJSON()?.questionId === numeric.id);
  await page.getByLabel('Numerical answer', { exact: true }).fill(String(numericValue));
  await page.getByLabel('Numerical answer', { exact: true }).blur();
  expect((await savedNumeric).status()).toBe(200);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  expect(await prisma.answer.findUniqueOrThrow({ where: { attemptId_questionId: { attemptId: attempt.id, questionId: mcq.id } } })).toMatchObject({ selectedOption: correct });
  expect(Number((await prisma.answer.findUniqueOrThrow({ where: { attemptId_questionId: { attemptId: attempt.id, questionId: numeric.id } } })).numericResponse)).toBe(numericValue);
  const timerText = await page.getByRole('timer').textContent();
  await expect.poll(() => page.getByRole('timer').textContent()).not.toBe(timerText);
  await context.setOffline(true);
  await page.evaluate(() => {
    document.dispatchEvent(new ClipboardEvent('paste', { bubbles: true }));
    document.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
  });
  await expect(page.getByLabel('Numerical answer', { exact: true })).toHaveValue(String(numericValue));
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  const resumed = await prisma.testAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
  expect(resumed.startedAt).toEqual(attempt.startedAt);
  expect(resumed.questionOrder).toEqual(attempt.questionOrder);
  expect(resumed.seed).toBe(attempt.seed);
  expect(await prisma.testAttempt.count({ where: { studentId, testId: JEE_MIXED } })).toBe(1);
  await page.unroute(endpoint);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(() => prisma.attemptMonitoringEvent.count({ where: { attemptId: attempt.id, eventType: 'COPY_ATTEMPT' } }), { timeout: 25_000 }).toBe(1);
  await expect.poll(() => prisma.attemptMonitoringEvent.count({ where: { attemptId: attempt.id, eventType: 'PASTE_ATTEMPT' } }), { timeout: 25_000 }).toBeGreaterThan(0);
  const afterClock = (await (await page.request.post(`/api/attempts/${attempt.id}/sync`, { data: {} })).json()).remainingSeconds as number;
  expect(afterClock).toBeLessThanOrEqual(beforeClock);
  await page.getByRole('button', { name: 'Questions', exact: true }).click();
  await jump(numeric.id);
  await expect(page.getByLabel('Numerical answer', { exact: true })).toHaveValue(String(numericValue));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await capture(page, 'mobile-monitoring-attempt');
  // Keep the upload path failed during submit: it must not join the answer
  // chain, delay navigation, cancel the attempt, or affect the score.
  await page.route(endpoint, route => route.abort('failed'));
  await page.evaluate(() => document.dispatchEvent(new ClipboardEvent('copy', { bubbles: true })));
  await submitUi(page, attempt.id);
  expect(await prisma.result.findUniqueOrThrow({ where: { attemptId: attempt.id } })).toMatchObject({
    totalQuestions: 75, correct: 2, wrong: 0, skipped: 73, score: 8,
  });
  const count = await prisma.attemptMonitoringEvent.count({ where: { attemptId: attempt.id } });
  await expect(page.getByRole('region', { name: 'Monitoring summary', exact: true })
    .getByText(`Monitoring events: ${count}`, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await capture(page, 'mobile-monitoring-result');
  expect(await prisma.payment.count({ where: { studentId } })).toBe(0);
  expect(await prisma.paidAttemptCredit.count({ where: { studentId } })).toBe(0);
});
