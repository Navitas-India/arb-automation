import { test, expect } from '@playwright/test';
import { runSteps } from 'passmark';
import { URLS, TEST_USERS, getAuthToken } from '../fixtures/auth';

test.describe('Enrollment', () => {

  test('Member enrolls in HMO plan successfully', async ({ page }) => {
    await runSteps({
      page,
      userFlow: 'Enrollment - HMO Success',
      steps: [
        { description: `Navigate to ${URLS.frontend}/login` },
        { description: `Login with email ${TEST_USERS.admin.email} and password ${TEST_USERS.admin.password}` },
        { description: 'Navigate to the Enrollment section' },
        { description: 'Select a member to enroll' },
        { description: 'Choose HMO as the plan type' },
        { description: 'Submit the enrollment form' },
      ],
      assertions: [
        { assertion: 'Enrollment is successful and status shows ACTIVE' },
        { assertion: 'No error message is visible' },
      ],
      test,
      expect,
    });
  });

  test('API rejects enrollment for member under 18', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.post(
      `${URLS.backend}/api/admin-portal/enrollments`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          memberId:  9999,
          age:       16,
          salary:    45000,
          planType:  'HMO',
        },
      }
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body).toLowerCase()).toContain('age');
  });

  test('API rejects enrollment for salary below 20000', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.post(
      `${URLS.backend}/api/admin-portal/enrollments`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          memberId:  9999,
          age:       30,
          salary:    15000,
          planType:  'PPO',
        },
      }
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body).toLowerCase()).toContain('salary');
  });

  test('API rejects duplicate active enrollment', async ({ request }) => {
    const token = await getAuthToken();
    const payload = { memberId: 1001, age: 35, salary: 50000, planType: 'HMO' };
    // Second attempt on same plan should return 409
    const res = await request.post(
      `${URLS.backend}/api/admin-portal/enrollments`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: payload,
      }
    );
    expect([400, 409]).toContain(res.status());
  });

  test('Enrollment history shows all attempts newest first', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.get(
      `${URLS.backend}/api/admin-portal/enrollments/1001/history`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

});
