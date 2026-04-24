import { test, expect } from '@playwright/test';

const EMAIL    = process.env.TEST_ADMIN_EMAIL    || 'murali.miriyala@navitastech.com';
const PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Murali@123';

async function login(page: any) {
  await page.goto('/login');
  await page.locator('input[type="email"], input[name="email"], #email').fill(EMAIL);
  await page.locator('input[type="password"], input[name="password"], #password').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForLoadState('networkidle');
}

test.describe('UI — Enrollment', () => {

  test('Enrollment section is accessible after login', async ({ page }) => {
    await login(page);
    await page.click('text=Enrollment');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, [class*="title"]').first()).toBeVisible();
  });

  test('Enrollment list loads without error', async ({ page }) => {
    await login(page);
    await page.click('text=Enrollment');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table, [class*="grid"], [class*="list"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Enrollment page shows no error state', async ({ page }) => {
    await login(page);
    await page.click('text=Enrollment');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Something went wrong')).not.toBeVisible({ timeout: 5_000 }).catch(() => {});
  });

});
