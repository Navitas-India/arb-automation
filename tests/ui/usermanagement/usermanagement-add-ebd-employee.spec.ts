import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/auth';
import { buildSyntheticMemberData } from '../../fixtures/synthetic';

test.describe('HEBA User Management - Add EBD Employee', () => {
  test.describe.configure({ timeout: 420_000, retries: 0 });

  test('Happy Path: Create EBD Employee User (TC-AEU-001)', async ({ page }) => {
    const syntheticData = buildSyntheticMemberData();
    await page.goto(URLS.login);
  });
});
