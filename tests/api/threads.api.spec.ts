import { test, expect } from '@playwright/test';
import { getAuthToken } from '../../fixtures/auth';

const BASE    = process.env.BACKEND_URL || 'http://localhost:8085';
const THREADS = `${BASE}/api/admin-portal/threads`;

test.describe('API — Threads', () => {

  test('Get threads without token returns 401', async ({ request }) => {
    const res = await request.get(THREADS);
    expect(res.status()).toBe(401);
  });

  test('Get threads with valid token returns 200', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.get(THREADS, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('Thread list is an array or paginated object', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.get(THREADS, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body) || typeof body === 'object').toBeTruthy();
  });

  test('Get single thread without token returns 401', async ({ request }) => {
    const res = await request.get(`${THREADS}/1`);
    expect(res.status()).toBe(401);
  });

  test('Get non-existent thread returns 404', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.get(`${THREADS}/999999`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('Response time is under 3 seconds', async ({ request }) => {
    const token = await getAuthToken();
    const start = Date.now();
    await request.get(THREADS, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(3000);
  });

});
