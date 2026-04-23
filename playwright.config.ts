import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : 2,
  timeout: 60_000,

  reporter: [
    ['html',  { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],

  use: {
    baseURL:       process.env.FRONTEND_URL || 'http://localhost:5173',
    trace:         'on-first-retry',
    screenshot:    'only-on-failure',
    video:         'on-first-retry',
    actionTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
