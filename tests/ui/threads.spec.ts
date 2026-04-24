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

test.describe('UI — Threads', () => {

  test('Threads section is accessible after login', async ({ page }) => {
    await login(page);
    await page.click('text=Threads');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, [class*="title"]').first()).toBeVisible();
  });

  test('Thread list loads and shows items', async ({ page }) => {
    await login(page);
    await page.click('text=Threads');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table, [class*="thread"], [class*="list"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Clicking a thread opens detail view', async ({ page }) => {
    await login(page);
    await page.click('text=Threads');
    await page.waitForLoadState('networkidle');
    await page.locator('table tr, [class*="thread-item"]').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[class*="detail"], [class*="message"], [class*="conversation"]').first()).toBeVisible({ timeout: 8_000 });
  });

});
