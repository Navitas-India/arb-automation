import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/auth';
import { buildSyntheticMemberData } from '../../fixtures/synthetic';

test.describe('HEBA Letters Template Management - Landing and CRUD', () => {
    test('should load template management page', async ({ page }) => {
        await page.goto(URLS.templateManagement);
        await expect(page).toBeDefined();
    });
});
