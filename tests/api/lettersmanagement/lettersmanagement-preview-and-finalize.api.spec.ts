import { test, expect, APIRequestContext } from '@playwright/test';
import { URLS, getAuthToken } from '../../../fixtures/auth';

const apiBase = URLS.backend.endsWith('/api') ? URLS.backend : `${URLS.backend}/api`;

const generateUniqueId = () => `test_${Math.floor(Math.random() * 1000000)}`;

const buildPreviewPayload = (overrides = {}) => ({
  contentBody: '<html><body>Letter Content {{name}}</body></html>',
  variables: { name: 'Member Name' },
  ...overrides
});

const buildFinalizePayload = (overrides = {}) => ({
  templateMetadata: {
    status: 'FINALIZED',
    version: '1.0'
  },
  ...overrides
});

const postPreviewFromLayout = async (request: APIRequestContext, id: string, token: string, body: any) => {
  return await request.post(`${apiBase}/letter-templates/${id}/preview-from-layout`, {
    headers: { 'Authorization': `Bearer ${token}` },
    data: body
  });
};

const postPreviewFromContent = async (request: APIRequestContext, id: string, token: string, body: any) => {
  return await request.post(`${apiBase}/letter-templates/${id}/preview-from-content`, {
    headers: { 'Authorization': `Bearer ${token}` },
    data: body
  });
};

const postPreviewHtml = async (request: APIRequestContext, id: string, token: string, body: any) => {
  return await request.post(`${apiBase}/letter-templates/${id}/preview-html`, {
    headers: { 'Authorization': `Bearer ${token}` },
    data: body
  });
};

const putFinalize = async (request: APIRequestContext, id: string, token: string, body: any) => {
  return await request.put(`${apiBase}/letter-templates/${id}/finalize`, {
    headers: { 'Authorization': `Bearer ${token}` },
    data: body
  });
};

test.describe('HEBA Letters Template Management - Preview and Finalize', () => {
  let token: string;
  const validTemplateId = '374'; // Example ID from contract logic
  const nonExistentId = '999999';

  test.beforeAll(async () => {
    token = await getAuthToken();
  });

  test('API-LTR-PRV-001: Preview from layout succeeds with PDF output', async ({ request }) => {
    const payload = buildPreviewPayload();
    const response = await postPreviewFromLayout(request, validTemplateId, token, payload);
    
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/pdf');
  });

  test('API-LTR-PRV-002: Preview from layout returns validation error for missing body', async ({ request }) => {
    const response = await postPreviewFromLayout(request, validTemplateId, token, {});
    
    expect([400, 422]).toContain(response.status());
  });

  test('API-LTR-PRV-003: Preview from content succeeds with PDF output', async ({ request }) => {
    const payload = buildPreviewPayload();
    const response = await postPreviewFromContent(request, validTemplateId, token, payload);
    
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/pdf');
  });

  test('API-LTR-PRV-004: Preview from content returns 404 for invalid template ID', async ({ request }) => {
    const payload = buildPreviewPayload();
    const response = await postPreviewFromContent(request, nonExistentId, token, payload);
    
    expect(response.status()).toBe(404);
  });

  test('API-LTR-PRV-005: HTML preview returns 200 and JSON container', async ({ request }) => {
    const payload = buildPreviewPayload();
    const response = await postPreviewHtml(request, validTemplateId, token, payload);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  test('API-LTR-PRV-006: Preview HTML returns 401/403 for unauthorized request', async ({ request }) => {
    const payload = buildPreviewPayload();
    const response = await request.post(`${apiBase}/letter-templates/${validTemplateId}/preview-html`, {
      data: payload
    });
    
    expect([401, 403]).toContain(response.status());
  });

  test('API-LTR-FIN-001: Finalize content template returns 200', async ({ request }) => {
    const payload = buildFinalizePayload();
    const response = await putFinalize(request, validTemplateId, token, payload);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  test('API-LTR-FIN-002: Finalize content template returns validation error for missing metadata', async ({ request }) => {
    const response = await putFinalize(request, validTemplateId, token, { templateMetadata: null });
    
    expect([400, 422]).toContain(response.status());
  });
});
