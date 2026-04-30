import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '../../fixtures/auth';
import { buildSyntheticMemberData } from '../../fixtures/synthetic';

test.describe('HEBA User Management - Add Non-EBD Employee', () => {
  test.describe.configure({ timeout: 420_000, retries: 0 });

  test('TC-ANEU-009: Happy Path - Create Non-EBD Employee successfully', async ({ page }) => {
    const memberData = buildSyntheticMemberData();
    const loginUrl = new URL(URLS.login, URLS.baseUrl).toString();

    await page.goto(loginUrl);
    await page.waitForLoadState('domcontentloaded');

    await page.getByLabel('Username').fill(TEST_USERS.admin.username);
    await page.getByLabel('Password').fill(TEST_USERS.admin.password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Navigation
    const menuToggle = page.getByRole('button', { name: 'Collapse Menu' });
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
    }
    await page.getByText('System Administration').click();
    await page.getByText('Security Management').click();
    await page.getByText('Manage Selected User').click();
    await page.getByText('Add Users').click();
    await page.getByText('Add Non-EBD Employee').click();

    // Form Filling - User Role
    await page.getByLabel('User Role').click();
    await page.getByRole('option').first().click();

    // Name Section
    await page.getByLabel('First Name').fill(memberData.firstName);
    await page.getByLabel('Last Name').fill(memberData.lastName);

    // Demographics Section
    await page.getByLabel('Date of Birth').fill(memberData.dob);
    await page.getByLabel('Gender').click();
    await page.getByRole('option').first().click();
    await page.getByLabel('Social Security Number', { exact: true }).fill(memberData.ssn);
    await page.getByLabel('Confirm Social Security Number').fill(memberData.ssn);

    // Contact Information Section
    await page.getByLabel('Phone Number').fill(memberData.phone);
    await page.getByLabel('Phone Type').click();
    await page.getByRole('option').first().click();
    await page.getByLabel('Personal Email Address').fill(memberData.email);
    await page.getByLabel('Work Email Address').fill(`work_${memberData.email}`);

    // Mailing Address Section
    await page.getByLabel('Street address', { exact: true }).fill(memberData.addressLine1);
    await page.getByLabel('City').fill(memberData.city);
    await page.getByLabel('State').click();
    await page.getByRole('option').first().click();
    await page.getByLabel('ZIP Code').fill(memberData.zipCode);

    // API Interception and Save
    const createPromise = page.waitForResponse(res => 
      res.url().includes('/admin-users/non-ebd-employees') && res.status() === 200
    );
    await page.getByRole('button', { name: 'Save' }).click();
    await createPromise;
  });

  test('TC-ANEU-008: Validation - SSN Mismatch and Required Fields', async ({ page }) => {
    const memberData = buildSyntheticMemberData();
    const loginUrl = new URL(URLS.login, URLS.baseUrl).toString();

    await page.goto(loginUrl);
    await page.waitForLoadState('domcontentloaded');

    await page.getByLabel('Username').fill(TEST_USERS.admin.username);
    await page.getByLabel('Password').fill(TEST_USERS.admin.password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.getByText('System Administration').click();
    await page.getByText('Security Management').click();
    await page.getByText('Manage Selected User').click();
    await page.getByText('Add Users').click();
    await page.getByText('Add Non-EBD Employee').click();

    // Trigger Required Validations
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('First Name is required')).toBeVisible();
    await expect(page.getByText('Last Name is required')).toBeVisible();

    // Trigger SSN Mismatch
    await page.getByLabel('Social Security Number', { exact: true }).fill('123456789');
    await page.getByLabel('Confirm Social Security Number').fill('987654321');
    await page.getByLabel('Confirm Social Security Number').blur();
    
    await expect(page.getByText(/SSN.*match/i)).toBeVisible();
  });

  test('TC-ANEU-007: Business Rule - Section Visibility Restrictions', async ({ page }) => {
    const loginUrl = new URL(URLS.login, URLS.baseUrl).toString();

    await page.goto(loginUrl);
    await page.waitForLoadState('domcontentloaded');

    await page.getByLabel('Username').fill(TEST_USERS.admin.username);
    await page.getByLabel('Password').fill(TEST_USERS.admin.password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.getByText('System Administration').click();
    await page.getByText('Security Management').click();
    await page.getByText('Manage Selected User').click();
    await page.getByText('Add Users').click();
    await page.getByText('Add Non-EBD Employee').click();

    // Allowed Sections
    await expect(page.getByText('Name', { exact: true })).toBeVisible();
    await expect(page.getByText('Demographics', { exact: true })).toBeVisible();
    await expect(page.getByText('Contact Information', { exact: true })).toBeVisible();
    await expect(page.getByText('Mailing Address', { exact: true })).toBeVisible();

    // Forbidden Sections (Non-EBD Employee specific rules)
    await expect(page.getByText('Employee Information', { exact: true })).not.toBeVisible();
    await expect(page.getByText('Time Card', { exact: true })).not.toBeVisible();
  });
});
