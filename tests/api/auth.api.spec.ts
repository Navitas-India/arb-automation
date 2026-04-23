import { test, expect } from '@playwright/test';

const BASE = process.env.BACKEND_URL || 'http://localhost:8085';
const SIGNIN = `${BASE}/api/admin-portal/auth/signin`;

test.describe('API — Authentication', () => {

  test('Valid credentials return accessToken', async ({ request }) => {
    const res = await request.post(SIGNIN, {
      data: {
        username:    process.env.TEST_ADMIN_EMAIL    || 'murali.miriyala@navitastech.com',
        password:    process.env.TEST_ADMIN_PASSWORD || 'Murali@123',
        accountType: 'E',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(20);
  });

  test('Wrong password returns 401', async ({ request }) => {
    const res = await request.post(SIGNIN, {
      data: {
        username:    process.env.TEST_ADMIN_EMAIL || 'murali.miriyala@navitastech.com',
        password:    'WrongPassword999',
        accountType: 'E',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('Missing credentials returns 400', async ({ request }) => {
    const res = await request.post(SIGNIN, { data: {} });
    expect([400, 401]).toContain(res.status());
  });

  test('Unknown email returns 401', async ({ request }) => {
    const res = await request.post(SIGNIN, {
      data: {
        username:    'nobody@navitastech.com',
        password:    'SomePassword123',
        accountType: 'E',
      },
    });
    expect(res.status()).toBe(401);
  });

});
