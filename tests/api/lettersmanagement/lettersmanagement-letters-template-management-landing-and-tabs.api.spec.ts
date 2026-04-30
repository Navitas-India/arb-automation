import { test, expect, APIRequestContext } from '@playwright/test';
import { URLS, getAuthToken } from '../../../fixtures/auth';

/**
 * HEBA Letters Template Management - Landing and Tabs
 * This spec covers the listing of Layout and Content templates.
 */

const getApiBase = () => {
  const backend = URLS.backend;
  return backend.endsWith('/api') ? backend : `${backend}/api`;
};

const getRequestHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/json',
});

/**
 * Helper to fetch template lists
 */
async function fetchTemplates(request: APIRequestContext, endpoint: string, token: string) {
  const apiBase = getApiBase();
  return await request.get(`${apiBase}${endpoint}`, {
    headers: getRequestHeaders(token),
  });
}

test.describe('Letters Template Management - Landing and Tabs API', () => {
  let token: string;

  test.beforeAll(async () => {
    token = await getAuthToken();
  });

  test('TC-LTM-API-001: Get active layout templates (Happy Path)', async ({ request }) => {
    const response = await fetchTemplates(request, '/letter-templates/layout', token);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    
    // Contract-safe: Assert response is a JSON container (object or array)
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
  });

  test('TC-LTM-API-002: Get active content templates (Happy Path)', async ({ request }) => {
    const response = await fetchTemplates(request, '/letter-templates/content', token);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    
    // Contract-safe: Assert response is a JSON container
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
  });

  test('TC-LTM-API-003: Get archived layout templates (Happy Path)', async ({ request }) => {
    const response = await fetchTemplates(request, '/letter-templates/layout/archived', token);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    
    expect(typeof body).toBe('object');
  });

  test('TC-LTM-API-004: Access templates without authorization (Negative Path)', async ({ request }) => {
    const apiBase = getApiBase();
    const response = await request.get(`${apiBase}/letter-templates/layout`, {
      headers: {
        'Accept': 'application/json',
        // No Authorization header
      },
    });

    // Per Generator Contract: Preferred 401, acceptable 403
    expect([401, 403]).toContain(response.status());
  });

  test('TC-LTM-API-005: Fetch layout names for content-template selection (Happy Path)', async ({ request }) => {
    const response = await fetchTemplates(request, '/letter-templates/layout/names', token);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    
    // Assert JSON container type
    expect(typeof body).toBe('object');
  });
});
