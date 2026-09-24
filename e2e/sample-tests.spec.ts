import { test, expect } from '@playwright/test';
import bcrypt from 'bcryptjs';
import { PrismaClient, type OtpPurpose } from '@prisma/client';

const prisma = new PrismaClient();
const OTP = '246810';
let studentId: string | undefined;
let studentEmail: string | undefined;

test.afterAll(async () => {
  if (studentId) await prisma.student.delete({ where: { id: studentId } }).catch(() => undefined);
  else if (studentEmail) await prisma.student.delete({ where: { email: studentEmail } }).catch(() => undefined);
  await prisma.$disconnect();
});

async function register(page: import('@playwright/test').Page) {
  const suffix = Date.now().toString().slice(-9);
  const mobile = `9${suffix}`;
  const email = `sample_e2e_${suffix}@example.com`;
  studentEmail = email;
  await page.goto('/register?callbackUrl=%2Fstudent');
  await page.getByLabel('Full name').fill('Sample E2E Student');
  await page.getByLabel('Mobile number').fill(mobile);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('TestPassword123!');
  await page.getByLabel('Confirm password').fill('TestPassword123!');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/verify-email\?/);
  await page.waitForLoadState('networkidle');
  const normalizedMobile = `+91${mobile}`;
  await prisma.otpToken.updateMany({ where: { mobile: normalizedMobile, purpose: 'EMAIL_VERIFICATION', consumedAt: null }, data: { consumedAt: new Date() } });
  await prisma.otpToken.create({ data: { mobile: normalizedMobile, email, otpHash: await bcrypt.hash(OTP, 8), purpose: 'EMAIL_VERIFICATION' as OtpPurpose, channel: 'EMAIL', expiresAt: new Date(Date.now() + 300_000) } });
  await page.getByLabel('Verification code').fill(OTP);
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page).toHaveURL(/\/student$/);
  studentId = (await prisma.student.findUniqueOrThrow({ where: { email }, select: { id: true } })).id;
}

async function submitSample(page: import('@playwright/test').Page, title: string) {
  await page.goto('/student/tests');
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByText(title, { exact: true }).locator('xpath=ancestor::article').getByText('Repeat practice is free')).toBeVisible();
  await page.getByText(title, { exact: true }).click();
  await page.getByRole('link', { name: /Start Test/i }).click();
  await page.getByRole('button', { name: 'Start Test' }).click();
  await expect(page).toHaveURL(/\/attempt$/);
  await expect(page.getByText(/Question 1 of \d+/)).toBeVisible();
  await expect(page.getByLabel('Open WhatsApp support')).toHaveCount(0);
  await expect(page.getByLabel(/Open Ask SIVORA.*AI assistant/)).toHaveCount(0);
  await page.locator('label').filter({ has: page.getByRole('radio') }).first().click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await page.getByRole('banner').getByRole('button', { name: 'Submit test' }).click();
  await page.getByRole('button', { name: 'Yes, submit' }).click();
  await expect(page).toHaveURL(/\/student\/results\//, { timeout: 60_000 });
  await expect(page.getByText('Score')).toBeVisible();
  await expect(page.getByText('Unlimited practice attempts are available.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Take Another Attempt' })).toBeVisible();
  await expect(page.getByLabel('Open WhatsApp support')).toBeVisible();
  await expect(page.getByLabel(/Open Ask SIVORA.*AI assistant/)).toBeVisible();
}

test('controlled NEET and JEE samples complete the student UI lifecycle', async ({ page }) => {
  await register(page);
  await expect(page.getByLabel('Open WhatsApp support')).toBeVisible();
  await expect(page.getByLabel(/Open Ask SIVORA.*AI assistant/)).toBeVisible();

  await submitSample(page, 'SIVORA NEET Sample Practice Test');
  await submitSample(page, 'SIVORA JEE Sample Practice Test');

  await page.goto('/student');
  await expect(page.getByText('SIVORA NEET Sample Practice Test', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('SIVORA JEE Sample Practice Test', { exact: true }).first()).toBeVisible();
  const attempts = await prisma.testAttempt.findMany({ where: { studentId }, include: { result: true } });
  expect(attempts).toHaveLength(2);
  expect(attempts.every((attempt) => attempt.status === 'SUBMITTED' && attempt.result)).toBe(true);
  expect(await prisma.payment.count({ where: { studentId } })).toBe(0);
  expect(await prisma.paidAttemptCredit.count({ where: { studentId } })).toBe(0);
});
