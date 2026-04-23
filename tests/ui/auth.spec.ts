import { test, expect } from '@playwright/test';
import { runSteps } from 'passmark';
import { URLS, TEST_USERS } from '../fixtures/auth';

test.describe('Authentication', () => {

  test('Admin can login with valid credentials', async ({ page }) => {
    await runSteps({
      page,
      userFlow: 'Admin Login - Valid',
      steps: [
        { description: `Navigate to ${URLS.frontend}/login` },
        { description: `Enter email ${TEST_USERS.admin.email} in the email field` },
        { description: `Enter password ${TEST_USERS.admin.password} in the password field` },
        { description: 'Click the Sign In or Login button' },
      ],
      assertions: [
        { assertion: 'User is redirected to the dashboard or home page after login' },
        { assertion: 'No error message is visible' },
      ],
      test,
      expect,
    });
  });

  test('Login fails with wrong password', async ({ page }) => {
    await runSteps({
      page,
      userFlow: 'Admin Login - Wrong Password',
      steps: [
        { description: `Navigate to ${URLS.frontend}/login` },
        { description: `Enter email ${TEST_USERS.admin.email} in the email field` },
        { description: 'Enter password WrongPassword123 in the password field' },
        { description: 'Click the Sign In or Login button' },
      ],
      assertions: [
        { assertion: 'An error message is displayed indicating invalid credentials' },
        { assertion: 'User is NOT redirected to dashboard — still on login page' },
      ],
      test,
      expect,
    });
  });

  test('Login fails with empty fields', async ({ page }) => {
    await runSteps({
      page,
      userFlow: 'Admin Login - Empty Fields',
      steps: [
        { description: `Navigate to ${URLS.frontend}/login` },
        { description: 'Click the Sign In or Login button without entering any credentials' },
      ],
      assertions: [
        { assertion: 'Validation error or required field message is shown' },
        { assertion: 'User remains on the login page' },
      ],
      test,
      expect,
    });
  });

});
