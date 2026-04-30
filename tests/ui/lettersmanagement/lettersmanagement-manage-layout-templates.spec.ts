import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/auth';
import { buildSyntheticMemberData } from '../../fixtures/synthetic';

test.describe('HEBA Letters Template Management - Layout Templates', () => {
  test.describe.configure({ timeout: 420_000, retries: 0 });

  test('Happy Path: Successfully clone an existing layout template', async ({ page }) => {
    const syntheticData = buildSyntheticMemberData();
    const loginUrl = URLS.login;
    const newTemplateName = `Clone-${syntheticData.lastName}`;

    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="username"]', TEST_USERS.admin.username);
    await page.fill('input[name="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
  });
});
