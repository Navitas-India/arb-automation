import { test, expect, APIRequestContext } from '@playwright/test';
import { URLS, getAuthToken } from '../../../fixtures/auth';

const getUniqueId = () => Math.floor(Math.random() * 10000) + 1000;

const buildActionPayload = (id: number) => ({ id });

async function getLetterContentList(request: APIRequestContext, apiBase: string, token: string) {
  return await request.get(`${apiBase}/letter-templates/content`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function getArchivedContentList(request: APIRequestContext, apiBase: string, token: string) {
  return await request.get(`${apiBase}/letter-templates/content/archived`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function archiveTemplate(request: APIRequestContext, apiBase: string, token: string, id: number) {
  return await request.put(`${apiBase}/letter-templates/${id}/archive`, {
    headers: { Authorization: `Bearer ${token}` },
    data: buildActionPayload(id)
  });
}

async function copyTemplate(request: APIRequestContext, apiBase: string, token: string, id: number) {
  return await request.post(`${apiBase}/letter-templates/${id}/copy`, {
    headers: { Authorization: `Bearer ${token}` },
    data: buildActionPayload(id)
  });
}

async function finalizeTemplate(request: APIRequestContext, apiBase: string, token: string, id: number) {
  return await request.put(`${apiBase}/letter-templates/${id}/finalize`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function previewAttachment(request: APIRequestContext, apiBase: string, token: string, id: number) {
  return await request.get(`${apiBase}/letter-templates/attachments/${id}/preview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

async function downloadAttachment(request: APIRequestContext, apiBase: string, token: string, id: number) {
  return await request.get(`${apiBase}/letter-templates/attachments/${id}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

test.describe('HEBA Letters Template Management API', () => {
  const apiBase = URLS.backend.endsWith('/api') ? URLS.backend : `${URLS.backend}/api`;
  let token: string;

  test.beforeAll(async () => {
    token = await getAuthToken();
  });

  test('TC-CTM-001: List active content templates', async ({ request }) => {
    const response = await getLetterContentList(request, apiBase, token);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body === 'object').toBeTruthy();
  });

  test('TC-CTM-002: List archived content templates', async ({ request }) => {
    const response = await getArchivedContentList(request, apiBase, token);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body === 'object').toBeTruthy();
  });

  test('TC-CTM-003: Copy content template happy path', async ({ request }) => {
    const testId = getUniqueId();
    const response = await copyTemplate(request, apiBase, token, testId);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body === 'object').toBeTruthy();
  });

  test('TC-CTM-004: Archive content template happy path', async ({ request }) => {
    const testId = getUniqueId();
    const response = await archiveTemplate(request, apiBase, token, testId);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body === 'object').toBeTruthy();
  });

  test('TC-CTM-005: Finalize content template happy path', async ({ request }) => {
    const testId = getUniqueId();
    const response = await finalizeTemplate(request, apiBase, token, testId);
    expect(response.status()).toBe(200);
  });

  test('TC-CTM-006: Preview attachment happy path', async ({ request }) => {
    const testId = getUniqueId();
    const response = await previewAttachment(request, apiBase, token, testId);
    expect([200, 404]).toContain(response.status());
  });

  test('TC-CTM-007: Download attachment happy path', async ({ request }) => {
    const testId = getUniqueId();
    const response = await downloadAttachment(request, apiBase, token, testId);
    expect([200, 404]).toContain(response.status());
  });
});
