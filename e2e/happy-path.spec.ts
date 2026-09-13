import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import { loadEnvConfig } from '@next/env';

/**
 * End-to-end happy path:
 *   register with password → buy a test → take it → view result → submit a
 *   consultancy lead.
 *
 * The Razorpay Checkout modal is a third-party iframe that cannot run headless
 * without a live gateway + manual UPI, so this test completes payment through
 * the SAME server endpoints the browser handler calls: `create-order` then
 * `verify` with a correctly-signed checkout signature. Everything else is driven
 * through the real UI. `RAZORPAY_KEY_SECRET` must match the running server's
 * (both come from the CI job env; set it locally to match your `.env`).
 */

loadEnvConfig(process.cwd());

const SECRET = process.env.RAZORPAY_KEY_SECRET ?? 'e2e_secret_xxxx';

// A unique, valid Indian mobile (starts 6-9, 10 digits) + email per run.
function unique() {
  const n = Date.now().toString().slice(-9);
  return { mobile: `9${n}`, email: `e2e_${n}@example.com` };
}

test('student can register, buy, take a test, see the result, and request guidance', async ({
  page,
}) => {
  const { mobile, email } = unique();
  const password = 'TestPassword123!';

  // 1) Register -----------------------------------------------------------
  await page.goto('/register');
  await page.getByLabel('Full name').fill('E2E Student');
  await page.getByLabel('Mobile number').fill(mobile);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();

  // Lands on the student dashboard.
  await expect(page).toHaveURL(/\/student$/);

  // 3) Open a test and buy it --------------------------------------------
  await page.goto('/student/tests');
  // The seeded fixed "Genetics" Botany chapter test is fully takeable.
  await page.getByText(/Genetics/i).first().click();
  await expect(page).toHaveURL(/\/student\/tests\/[^/]+$/);
  const testId = page.url().split('/student/tests/')[1].split(/[/?#]/)[0];

  // Complete payment via the real server path (see file header).
  const orderRes = await page.request.post('/api/payments/create-order', {
    data: { testId },
  });
  expect(orderRes.ok()).toBeTruthy();
  const order = await orderRes.json();
  const paymentId = `pay_e2e_${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${order.orderId}|${paymentId}`)
    .digest('hex');
  const verifyRes = await page.request.post('/api/payments/verify', {
    data: {
      razorpay_order_id: order.orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    },
  });
  expect(verifyRes.ok()).toBeTruthy();

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
      // "Next →" (not the Next.js dev-tools button, which also contains "Next").
      await page.getByRole('button', { name: 'Next →' }).click();
      await expect(page.getByText(`Question ${i + 2} of ${total}`)).toBeVisible();
    }
  }
  await page.getByRole('button', { name: 'Submit test' }).click();
  await expect(page.getByText('Submit your test?')).toBeVisible();
  await page.getByRole('button', { name: 'Yes, submit' }).click();

  // 5) See the result -----------------------------------------------------
  await page.waitForURL(/\/student\/results\//, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(page.getByText('Score')).toBeVisible();

  // 6) Submit a consultancy lead -----------------------------------------
  await page.goto('/student/admission-guidance');
  await expect(page.getByText('Request free guidance')).toBeVisible();
  await page.getByLabel('NEET score').fill('420');
  // Consent is required before the form can be submitted.
  await page.getByRole('checkbox').first().check();
  // Pick at least one interested country (first available option).
  const country = page.getByRole('checkbox').nth(1);
  if (await country.isVisible().catch(() => false)) await country.check();
  await page.getByRole('button', { name: 'Submit request' }).click();

  // The page flips to the submitted/status view.
  await expect(page.getByText(/request|submitted|under review/i).first()).toBeVisible();
});
