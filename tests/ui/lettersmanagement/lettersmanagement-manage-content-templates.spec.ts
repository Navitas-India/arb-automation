import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/auth';
import { buildSyntheticMemberData } from '../../fixtures/synthetic';

test.describe('HEBA Letters Content Template Management', () => {
  test.describe.configure({ timeout: 420_000, retries: 0 });

  test.beforeEach(async ({ page }) => {
    const syntheticData = buildSyntheticMemberData();
  });
});
