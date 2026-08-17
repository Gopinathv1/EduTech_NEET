import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config. The suite drives the real app + a real database, so it
 * runs the dev server (development mode is required so OTPs are echoed as
 * `devOtp` and Razorpay stays in mock-order mode — no third-party gateway).
 *
 * Local run:
 *   1. Postgres up + `DATABASE_URL` set, `npm run db:push && npm run db:seed`
 *   2. `npx playwright install chromium`
 *   3. `npm run test:e2e`
 */
export default defineConfig({
  testDir: './e2e',
  // Generous: in dev mode each route compiles on first hit, and this single
  // spec walks the whole app (register → pay → exam → result → lead).
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Force development so devOtp is returned and payments use mock orders.
    env: { NODE_ENV: 'development' },
  },
});
