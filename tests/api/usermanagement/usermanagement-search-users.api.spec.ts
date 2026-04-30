import { test, expect, APIRequestContext } from '@playwright/test';
import { URLS, getAuthToken } from '../../../fixtures/auth';

const apiBase = URLS.backend.endsWith('/api') ? URLS.backend : `${URLS.backend}/api`;

/**
 * Helper to generate a unique suffix for identity fields
 */
const getUniqueSuffix = () => Date.now().toString().slice(-6);

/**
 * Request helper for Search Users
 */
async function searchUsers(request: APIRequestContext, token: string | null, params: Record<string, string | number>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    query.append(key, String(value));
  }
  
  return await request.get(`${apiBase}/admin-users/page?${query.toString()}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
}

/**
 * Request helper for Roles lookup
 */
async function getRoles(request: APIRequestContext, token: string) {
  return await request.get(`${apiBase}/roles`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

/**
 * Request helper for Account Types lookup
 */
async function getAccountTypes(request: APIRequestContext, token: string) {
  return await request.get(`${apiBase}/account-types`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

test.describe('HEBA User Management - Search Users API', () => {
  let validToken: string;

  test.beforeAll(async () => {
    validToken = await getAuthToken();
  });

  test('API-UM-SU-001: Search by SSN returns 200 with JSON container', async ({ request }) => {
    const response = await searchUsers(request, validToken, {
      page: 0,
      size: 10,
      ssn: '666-66-6666'
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  test('API-UM-SU-002: Search by firstName and lastName returns 200', async ({ request }) => {
    const response = await searchUsers(request, validToken, {
      page: 0,
      size: 10,
      firstName: 'Test',
      lastName: 'User'
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  test('API-UM-SU-003: Search by webUserId returns 200', async ({ request }) => {
    const response = await searchUsers(request, validToken, {
      page: 0,
      size: 10,
      webUserId: `WEB${getUniqueSuffix()}`
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  test('API-UM-SU-004: Search by role and status returns 200', async ({ request }) => {
    const response = await searchUsers(request, validToken, {
      page: 0,
      size: 10,
      role: 'Admin',
      status: 'Active'
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  test('API-UM-SU-005: Missing bearer token returns unauthorized status', async ({ request }) => {
    const response = await searchUsers(request, null, {
      page: 0,
      size: 10
    });

    // Accept 401 (preferred) or 403
    expect([401, 403]).toContain(response.status());
  });

  test('API-UM-SU-006: Invalid bearer token returns unauthorized status', async ({ request }) => {
    const response = await searchUsers(request, 'invalid_token_string', {
      page: 0,
      size: 10
    });

    expect([401, 403]).toContain(response.status());
  });

  test('API-UM-SU-007: Malformed SSN filter handling', async ({ request }) => {
    const response = await searchUsers(request, validToken, {
      page: 0,
      size: 10,
      ssn: '123'
    });

    // Compatibility: prefer 400, allow 200 with empty results
    expect([200, 400, 422]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(typeof body).toBe('object');
    }
  });

  test('API-UM-SU-008: Invalid pagination parameters handling', async ({ request }) => {
    const response = await searchUsers(request, validToken, {
      page: -1,
      size: 'invalid'
    });

    // Compatibility: prefer 400, allow 422
    expect([400, 422]).toContain(response.status());
  });

  test('API-UM-SU-009: Lookup roles endpoint returns 200', async ({ request }) => {
    const response = await getRoles(request, validToken);
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Expect array based on lookup nature
    expect(Array.isArray(body)).toBe(true);
  });

  test('API-UM-SU-010: Lookup account types endpoint returns 200', async ({ request }) => {
    const response = await getAccountTypes(request, validToken);
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Expect array based on lookup nature
    expect(Array.isArray(body)).toBe(true);
  });
});
