import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/auth';
import { buildSyntheticMemberData } from '../../fixtures/synthetic';

test.describe('HEBA Letters Template Management - Preview and Finalize', () => {
  test.describe.configure({ timeout: 420_000, retries: 0 });

  test.beforeEach(async ({ page }) => {
    buildSyntheticMemberData();
    const loginUrl = URLS.loginUrl;
    await page.goto(loginUrl);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[name="username"]').fill(TEST_USERS.admin.username);
    await page.locator('input[name="password"]').fill(TEST_USERS.admin.password);
    await page.locator('button[type="submit"]').click();

    await page.getByText('System Administration').click();
    await page.getByText('Communications Management').click();
    await page.getByText('Letters Template Management').click();
  });

  test('TC-PRV-001: Preview Content Template - Happy Path', async ({ page }) => {
    await page.waitForLoadState('networkidle');
  });
});
