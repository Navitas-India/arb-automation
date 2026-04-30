import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : 2,
  timeout: 60_000,

  reporter: [
    ['html',  { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['allure-playwright', { resultsDir: 'artifacts/reports/allure/results/latest' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  projects: [
    // ── UI Tests — Passmark + browser ──────────────────────────────────────
    {
      name: 'ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL:       process.env.FRONTEND_URL || 'http://localhost:5173',
        trace:         'on-first-retry',
        screenshot:    'only-on-failure',
        video:         'on-first-retry',
        actionTimeout: 15_000,
      },
    },

    // ── API Tests — pure HTTP, no browser ──────────────────────────────────
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.BACKEND_URL || 'http://localhost:8085',
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
        },
      },
    },
  ],
});
