// Run after verify-neet-local.ts and a local server using that isolated database.
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const fixture = JSON.parse(readFileSync('test-results/neet-fixture.json', 'utf8'));
const base = 'http://localhost:3100';
async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    assert.equal((await context.request.post(`${base}/api/attempts`, { data: { testId: fixture.testId, language: 'en' } })).status(), 401);
    await page.goto(`${base}/login`);
    await page.getByLabel('Mobile number', { exact: true }).fill(fixture.mobile);
    await page.getByLabel('Password', { exact: true }).fill(fixture.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/student$/);
    await page.goto(`${base}/exam-preparation`);
    await page.goto(`${base}/exam-preparation/neet`);
    await page.getByRole('link', { name: /Full NEET Mock Tests/i }).click();
    await page.locator(`a[href="/student/tests/${fixture.testId}"]`).first().click();
    await page.locator(`a[href="/student/tests/${fixture.testId}/start"]`).first().click();
    await page.getByRole('button', { name: /^(Start|Resume) Test$/ }).click();
    await page.waitForURL(/\/attempt$/);
    await page.getByText('Saved', { exact: true }).waitFor();
    await page.locator('label').filter({ hasText: '2000' }).click();
    await page.getByRole('button', { name: 'Mark for Review & Next', exact: true }).click();
    await page.getByRole('button', { name: /Chemistry 0\/45/ }).click();
    await page.getByText('Question 46 of 180', { exact: true }).waitFor();
    await page.locator('label').filter({ hasText: /^.*200$/ }).click();
    await page.getByText('Saved', { exact: true }).waitFor();
    await page.reload();
    await page.getByText('Saved', { exact: true }).waitFor();
    assert.equal(await page.getByRole('radio', { checked: true }).count(), 1);
    await page.getByRole('button', { name: '1: Answered & Marked for Review', exact: true }).waitFor();
    for (const width of [360, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow at ${width}`);
      assert(await page.getByRole('timer').isVisible());
      if (width < 1024) {
        const palette = page.getByRole('button', { name: 'Questions', exact: true });
        if ((await palette.getAttribute('aria-expanded')) !== 'true') await palette.click();
      }
      await page.getByRole('button', { name: '1: Answered & Marked for Review', exact: true }).waitFor();
      await page.screenshot({ path: `test-results/neet-${width}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: 'Submit test', exact: true }).first().click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', { name: 'Yes, submit', exact: true }).click();
    await page.waitForURL(/\/student\/results\//);
    await page.getByRole('heading', { name: 'NEET Mock Test Result', exact: true }).waitFor();
    assert((await page.locator('body').innerText()).includes('720'));
    await page.getByRole('button', { name: /review/i }).click();
    await page.getByText('2 × 1000 = 2000.', { exact: true }).first().waitFor();
    await page.getByRole('heading', { name: 'Attempt history' }).waitFor();
    await page.screenshot({ path: 'test-results/neet-result.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: login, NEET catalogue, instructions, start, answer, review mark, subjects, refresh, desktop/mobile palette, submit, result, answer review, history; widths 360/390/430/768/1440.');
  } catch (error) { console.log('Failed page', page.url(), (await page.locator('body').innerText()).slice(0, 5000)); await page.screenshot({path:'test-results/neet-failure.png'}); throw error; } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
