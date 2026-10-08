import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', testMatch: ['full-site-sanity.spec.ts', 'production-blockers.spec.ts', 'production-blocker-controls.spec.ts'], workers: 1,
  timeout: 120_000, expect: { timeout: 20_000 },
  reporter: [['list']], use: { baseURL: 'http://localhost:3010', screenshot: 'only-on-failure' },
});
