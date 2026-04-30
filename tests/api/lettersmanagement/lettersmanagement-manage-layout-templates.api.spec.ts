import { test, expect, APIRequestContext } from '@playwright/test';
import { URLS, getAuthToken } from '../../../fixtures/auth';

const getUniqueId = () => Date.now().toString().slice(-6);

test.describe('HEBA Letters Template Management - Layout API', () => {
  let token: string;
  let apiBase: string;

  test.beforeAll(async () => {
    token = await getAuthToken();
    apiBase = URLS.backend.endsWith('/api') ? URLS.backend : `${URLS.backend}/api`;
  });

  async function getFirstLayoutId(request: APIRequestContext, headers: Record<string, string>): Promise<string | null> {
    const response = await request.get(`${apiBase}/letter-templates/layout`, { headers });
    if (response.status() === 200) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.items || [];
      return list.length > 0 ? (list[0].id || null) : null;
    }
    return null;
  }

  test('TC-LYT-001: Get active layout templates list', async ({ request }) => {
    const response = await request.get(`${apiBase}/letter-templates/layout`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body === 'object' || Array.isArray(body)).toBeTruthy();
  });

  test('TC-LYT-002: Get archived layout templates list', async ({ request }) => {
    const response = await request.get(`${apiBase}/letter-templates/layout/archived`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body === 'object' || Array.isArray(body)).toBeTruthy();
  });

  test('TC-LYT-003: Archive a layout template - Happy Path', async ({ request }) => {
    const id = await getFirstLayoutId(request, { 'Authorization': `Bearer ${token}` });
    test.skip(!id, 'No layout template available to archive');

    const response = await request.put(`${apiBase}/letter-templates/${id}/archive`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: { id }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body === 'object').toBeTruthy();
  });

  test('TC-LYT-004: Copy a layout template - Happy Path', async ({ request }) => {
    const id = await getFirstLayoutId(request, { 'Authorization': `Bearer ${token}` });
    test.skip(!id, 'No layout template available to copy');

    const response = await request.post(`${apiBase}/letter-templates/${id}/copy`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: { id, name: `Clone-${getUniqueId()}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body === 'object').toBeTruthy();
  });

  test('TC-LYT-005: List layouts without authentication - Negative', async ({ request }) => {
    const response = await request.get(`${apiBase}/letter-templates/layout`, {
      headers: { 'Authorization': 'Bearer invalid_token' }
    });
    expect([401, 403]).toContain(response.status());
  });

  test('TC-LYT-006: Archive layout with invalid ID - Negative', async ({ request }) => {
    const invalidId = '9999999';
    const response = await request.put(`${apiBase}/letter-templates/${invalidId}/archive`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: { id: invalidId }
    });
    expect(response.status()).toBe(404);
  });

  test('TC-LYT-007: Copy layout with invalid ID - Negative', async ({ request }) => {
    const invalidId = '0000000';
    const response = await request.post(`${apiBase}/letter-templates/${invalidId}/copy`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: { id: invalidId }
    });
    expect(response.status()).toBe(404);
  });

  test('TC-LYT-008: Get archived layouts list without auth - Negative', async ({ request }) => {
    const response = await request.get(`${apiBase}/letter-templates/layout/archived`, {
      headers: {}
    });
    expect([401, 403]).toContain(response.status());
  });
});
