import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', testMatch: 'admissions-v2.spec.ts', timeout: 90000,
  expect: { timeout: 15000 }, workers: 1, retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/admissions-v2', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3107', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } }, { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
});
