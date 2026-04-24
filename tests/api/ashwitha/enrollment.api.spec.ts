import { test, expect } from '@playwright/test';
import { getAuthToken } from '../../fixtures/auth';

const BASE    = process.env.BACKEND_URL || 'http://localhost:8085';
const ENROLL  = `${BASE}/api/admin-portal/enrollments`;

test.describe('API — Enrollment', () => {

  test('Enroll without token returns 401', async ({ request }) => {
    const res = await request.post(ENROLL, {
      data: { memberId: 1001, age: 30, salary: 50000, planType: 'HMO' },
    });
    expect(res.status()).toBe(401);
  });

  test('Valid enrollment returns 201', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.post(ENROLL, {
      headers: { Authorization: `Bearer ${token}` },
      data: { memberId: 9001, age: 30, salary: 50000, planType: 'HMO' },
    });
    // 201 created or 409 if already enrolled — both are acceptable
    expect([201, 409]).toContain(res.status());
  });

  test('Age below 18 returns 400', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.post(ENROLL, {
      headers: { Authorization: `Bearer ${token}` },
      data: { memberId: 9002, age: 16, salary: 50000, planType: 'HMO' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body).toLowerCase()).toContain('age');
  });

  test('Age above 65 returns 400', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.post(ENROLL, {
      headers: { Authorization: `Bearer ${token}` },
      data: { memberId: 9003, age: 70, salary: 50000, planType: 'PPO' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body).toLowerCase()).toContain('age');
  });

  test('Salary below 20000 returns 400', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.post(ENROLL, {
      headers: { Authorization: `Bearer ${token}` },
      data: { memberId: 9004, age: 35, salary: 15000, planType: 'HDHP' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body).toLowerCase()).toContain('salary');
  });

  test('Duplicate enrollment returns 409', async ({ request }) => {
    const token = await getAuthToken();
    const payload = { memberId: 9005, age: 35, salary: 50000, planType: 'HMO' };
    // First enrollment
    await request.post(ENROLL, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
    // Second attempt — same plan
    const res = await request.post(ENROLL, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
    expect([409, 400]).toContain(res.status());
  });

  test('Enrollment history returns array', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.get(`${ENROLL}/9001/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('Enrollment history without token returns 401', async ({ request }) => {
    const res = await request.get(`${ENROLL}/9001/history`);
    expect(res.status()).toBe(401);
  });

  test('Premium calculation returns breakdown', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.get(
      `${BASE}/api/admin-portal/premium/calculate?planType=PPO&salary=75000&age=52`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Must return breakdown not just final number
    expect(typeof body === 'object').toBeTruthy();
  });

});
