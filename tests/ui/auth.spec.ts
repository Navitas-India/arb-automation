import { test, expect } from '@playwright/test';

const EMAIL    = process.env.TEST_ADMIN_EMAIL    || 'murali.miriyala@navitastech.com';
const PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Murali@123';

test.describe('UI — Authentication', () => {

  test('Admin can login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"], #email').fill(EMAIL);
    await page.locator('input[type="password"], input[name="password"], #password').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).not.toHaveURL(/login/, { timeout: 10_000 });
  });

  test('Login fails with wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"], #email').fill(EMAIL);
    await page.locator('input[type="password"], input[name="password"], #password').fill('WrongPassword999');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[class*="error"], [role="alert"]').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"], #email').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('Logged in user sees dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"], #email').fill(EMAIL);
    await page.locator('input[type="password"], input[name="password"], #password').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('nav, [class*="sidebar"], [class*="dashboard"]').first()).toBeVisible();
  });

});
