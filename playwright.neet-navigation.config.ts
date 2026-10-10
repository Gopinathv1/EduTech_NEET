import { defineConfig } from '@playwright/test';
import { assertNeetE2eTarget } from './scripts/prepare-neet-navigation-e2e';
assertNeetE2eTarget();
export default defineConfig({ testDir: './e2e', testMatch: 'neet-navigation.spec.ts', workers: 1, retries: 0,
  timeout: 180000, expect: { timeout: 30000 }, outputDir: 'tmp/neet-navigation-e2e/results',
  reporter: [['list'], ['json', { outputFile: 'tmp/neet-navigation-e2e/results.json' }]],
  use: { baseURL: 'http://127.0.0.1:3017', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev -- --hostname 127.0.0.1 --port 3017', url: 'http://127.0.0.1:3017',
    reuseExistingServer: false, timeout: 120000, env: { NODE_ENV: 'development' } },
});
