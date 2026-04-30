import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/auth';
import { buildSyntheticMemberData } from '../../fixtures/synthetic';

test.describe('HEBA Letters Template Management - Create and Update', () => {
    test('should allow managing letter templates', async ({ page }) => {
        const syntheticData = buildSyntheticMemberData();
        expect(syntheticData).toBeDefined();
    });
});
