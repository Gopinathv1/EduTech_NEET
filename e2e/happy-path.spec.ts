import { test, expect } from '@playwright/test';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import type { OtpPurpose } from '@prisma/client';

const prisma = new PrismaClient();
const TEST_EMAIL_OTP = '246810';

test.afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * End-to-end happy path:
 *   register with password → start a free test → take it → view result → submit a
 *   consultancy lead.
 */

// A unique, valid Indian mobile (starts 6-9, 10 digits) + email per run.
function unique() {
  const n = Date.now().toString().slice(-9);
  return { mobile: `9${n}`, email: `e2e_${n}@example.com` };
}

/**
 * Replace the delivery-generated code with a deterministic code inside the
 * isolated E2E database. Verification still goes through the real endpoint,
 * including hash comparison, one-time consumption, and session creation.
 */
async function installTestEmailVerificationOtp(mobile: string, email: string) {
  const normalizedMobile = `+91${mobile}`;
  const purpose = 'EMAIL_VERIFICATION' as OtpPurpose;

  await prisma.otpToken.updateMany({
    where: { mobile: normalizedMobile, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.otpToken.create({
    data: {
      mobile: normalizedMobile,
      email,
      otpHash: await bcrypt.hash(TEST_EMAIL_OTP, 8),
      purpose,
      channel: 'EMAIL',
      expiresAt: new Date(Date.now() + 5 * 60_000),
    },
  });
}

test('student can register, take a free test, see the result, and request guidance', async ({
  page,
}) => {
  const { mobile, email } = unique();
  const password = 'TestPassword123!';

  // 1) Register -----------------------------------------------------------
  await page.goto('/register?callbackUrl=%2Fstudent');
  await page.getByLabel('Full name').fill('E2E Student');
  await page.getByLabel('Mobile number').fill(mobile);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();

  // Registration requires real email verification before creating a session.
  await expect(page).toHaveURL(/\/verify-email\?/);
  expect(new URL(page.url()).searchParams.get('callbackUrl')).toBe('/student');
  await page.waitForLoadState('networkidle');

  await installTestEmailVerificationOtp(mobile, email);
  await page.getByLabel('Verification code').fill(TEST_EMAIL_OTP);
  await page.getByRole('button', { name: 'Verify' }).click();

  // A successful verification creates the authenticated session and honors
  // the safe callback URL.
  await expect(page).toHaveURL(/\/student$/);

  // 3) Open a test --------------------------------------------------------
  await page.goto('/student/tests');
  // The seeded fixed "Genetics" Botany chapter test is fully takeable.
  await page.getByText(/Genetics/i).first().click();
  await expect(page).toHaveURL(/\/student\/tests\/[^/]+$/);
  const testId = page.url().split('/student/tests/')[1].split(/[/?#]/)[0];

  // 4) Take the test ------------------------------------------------------
  await page.goto(`/student/tests/${testId}/start`);
  await page.getByRole('button', { name: 'Start Test' }).click();
  await expect(page).toHaveURL(/\/attempt$/);

  // Wait for the exam to be interactive (hydrated) before answering. The
  // "Question N of M" text is server-rendered, so it appears before handlers
  // attach; the "Saved" autosave indicator only shows after the client mount
  // effect runs, which is a reliable "the page is now interactive" signal.
  await expect(page.getByText(/Question 1 of \d+/)).toBeVisible();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  const counter = await page.getByText(/Question \d+ of \d+/).textContent();
  const total = Number(counter!.match(/of (\d+)/)![1]);

  // Options are <label>s wrapping a visually-hidden radio input; click the
  // label so React's onChange fires (force-checking the hidden input does not).
  const optionLabels = page.locator('label').filter({ has: page.getByRole('radio') });
  for (let i = 0; i < total; i++) {
    await optionLabels.first().click();
    if (i < total - 1) {
      await page.getByRole('button', { name: /Save & Next/ }).click();
      await expect(page.getByText(`Question ${i + 2} of ${total}`)).toBeVisible();
    }
  }
  await page.getByRole('banner').getByRole('button', { name: 'Submit test' }).click();
  await expect(page.getByText('Submit your test?')).toBeVisible();
  await page.getByRole('button', { name: 'Yes, submit' }).click();

  // 5) See the result -----------------------------------------------------
  await page.waitForURL(/\/student\/results\//, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(page.getByText('Score', { exact: true })).toBeVisible();

  // 6) Submit a counselling lead through the current consent/validation flow.
  await page.goto('/student/admission-guidance');
  await expect(page.getByRole('heading', { name: 'Request free guidance', exact: true })).toBeVisible();
  await page.locator('#neetScore').fill('420');
  await page.locator('#category').selectOption('General');
  await page.locator('#budget').selectOption('UNSURE');
  await page.locator('#parentContact').fill(mobile);
  await page.locator('form button[aria-pressed]').first().click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Submit request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Request received', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Track your request', exact: true }).click();
  await expect(page.getByText('Counselling request status only.', { exact: false })).toBeVisible();
  const student = await prisma.student.findUniqueOrThrow({ where: { mobile: `+91${mobile}` } });
  const lead = await prisma.admissionLead.findFirstOrThrow({ where: { studentId: student.id } });
  expect(lead.neetScore).toBe(420);
  expect(lead.consentAt).not.toBeNull();
});
