import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/auth';
import { buildSyntheticMemberData } from '../../fixtures/synthetic';

test.describe('HEBA User Management - Add Member Profile', () => {
  test.describe.configure({ timeout: 420_000, retries: 0 });

  test('TC-AMP-004: Create Member Success (Unique SSN)', async ({ page }) => {
    const data = buildSyntheticMemberData();
    const loginUrl = URLS.admin.login;

    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

    // Login
    await page.locator('input[name="username"]').fill(TEST_USERS.admin.username);
    await page.locator('input[name="password"]').fill(TEST_USERS.admin.password);
  });
});
