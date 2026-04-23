import { test, expect } from '@playwright/test';
import { runSteps } from 'passmark';
import { URLS, TEST_USERS, getAuthToken } from '../fixtures/auth';

test.describe('Threads', () => {

  test('EBD Staff can view thread list', async ({ page }) => {
    await runSteps({
      page,
      userFlow: 'Threads - View List',
      steps: [
        { description: `Navigate to ${URLS.frontend}/login` },
        { description: `Login with email ${TEST_USERS.admin.email} and password ${TEST_USERS.admin.password}` },
        { description: 'Navigate to the Threads section from the menu' },
      ],
      assertions: [
        { assertion: 'A list of threads is visible on the screen' },
        { assertion: 'Each thread item shows a subject or title' },
      ],
      test,
      expect,
    });
  });

  test('EBD Staff can open a thread', async ({ page }) => {
    await runSteps({
      page,
      userFlow: 'Threads - Open Thread',
      steps: [
        { description: `Navigate to ${URLS.frontend}/login` },
        { description: `Login with email ${TEST_USERS.admin.email} and password ${TEST_USERS.admin.password}` },
        { description: 'Navigate to the Threads section' },
        { description: 'Click on the first thread in the list' },
      ],
      assertions: [
        { assertion: 'Thread detail view is shown with messages or conversation' },
        { assertion: 'Thread subject or title is visible at the top' },
      ],
      test,
      expect,
    });
  });

  test('API returns thread list', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.get(
      `${URLS.backend}/api/admin-portal/threads`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body) || typeof body === 'object').toBeTruthy();
  });

  test('Threads API requires authentication', async ({ request }) => {
    const res = await request.get(`${URLS.backend}/api/admin-portal/threads`);
    expect(res.status()).toBe(401);
  });

});
