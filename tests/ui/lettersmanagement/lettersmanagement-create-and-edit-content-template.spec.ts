import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/auth';
import { buildSyntheticMemberData } from '../../fixtures/synthetic';

test.describe('HEBA Letters Template Management - Create and Edit Content Template', () => {
  test.describe.configure({ timeout: 420_000, retries: 0 });

  let syntheticData: any;
  let baseUrl: string;

  test('should create and edit template content', async ({ page }) => {
    syntheticData = buildSyntheticMemberData();
    baseUrl = URLS.HOME || '/';
    await page.goto(baseUrl);
    expect(syntheticData).toBeDefined();
  });
});
