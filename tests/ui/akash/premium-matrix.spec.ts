import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const EMAIL      = process.env.TEST_ADMIN_EMAIL    || 'murali.miriyala@navitastech.com';
const PASSWORD   = process.env.TEST_ADMIN_PASSWORD || 'Murali@123';
const VALID_FILE = path.resolve(__dirname, '../../../test-data/matrix_2026.xlsx');

async function login(page: any) {
  await page.goto('/login');
  await page.locator('input[type="email"], input[name="email"], #email').fill(EMAIL);
  await page.locator('input[type="password"], input[name="password"], #password').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForLoadState('networkidle');
}

test.describe('UI — Premium Matrix', () => {

  test('Premium Matrix section is accessible after login', async ({ page }) => {
    await login(page);
    await page.click('text=Premium Matrix');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, [class*="title"]').first()).toBeVisible();
  });

  test('Premium Matrix data table is visible', async ({ page }) => {
    await login(page);
    await page.click('text=Premium Matrix');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table, [class*="grid"], [class*="matrix"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Upload valid Excel file shows success', async ({ page }) => {
    test.skip(!fs.existsSync(VALID_FILE), 'matrix_2026.xlsx not in test-data/');
    await login(page);
    await page.click('text=Premium Matrix');
    await page.waitForLoadState('networkidle');
    await page.setInputFiles('input[type="file"]', VALID_FILE);
    await page.selectOption('select[name="year"], #year', '2026').catch(() =>
      page.fill('input[name="year"], #year', '2026')
    );
    await page.locator('button:has-text("Upload")').click();
    await expect(page.locator('[class*="success"], [class*="toast"], text=/success/i').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Upload without file shows validation error', async ({ page }) => {
    await login(page);
    await page.click('text=Premium Matrix');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Upload")').click();
    await expect(page.locator('[class*="error"], [role="alert"]').first()).toBeVisible({ timeout: 5_000 });
  });

});
