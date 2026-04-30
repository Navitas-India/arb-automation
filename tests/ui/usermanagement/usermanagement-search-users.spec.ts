import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/auth';
import { buildSyntheticMemberData } from '../../fixtures/synthetic';

test.describe('HEBA User Management - Search Users', () => {
  test.describe.configure({ timeout: 420_000, retries: 0 });

  test('TC-ASU-002: Search by SSN Returns Results (Happy Path)', async ({ page }) => {
    const memberData = buildSyntheticMemberData();
    const baseUrl = URLS.baseUrl;
    const loginUrl = `${baseUrl}${URLS.loginPath}`;

    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Username').fill(TEST_USERS.admin.username);
    await page.getByLabel('Password').fill(TEST_USERS.admin.password);
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.getByPlaceholder('SSN').fill(memberData.ssn);
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText(memberData.ssn)).toBeVisible();
  });
});
