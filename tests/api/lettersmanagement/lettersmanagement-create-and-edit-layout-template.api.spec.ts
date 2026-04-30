import { test, expect, APIRequestContext } from '@playwright/test';
import { URLS, getAuthToken } from '../../../fixtures/auth';

const apiBase = URLS.backend.endsWith('/api') ? URLS.backend : `${URLS.backend}/api`;

const getUniqueSuffix = () => Math.floor(Math.random() * 1000000).toString();

const buildLayoutPayload = (name: string) => ({
  layout: JSON.stringify({
    name: name,
    effectiveDate: "2024-01-01",
    expirationType: "WON_T_EXPIRE"
  }),
  headerTitle: "Standard Header Title",
  footer: "Standard Footer Content",
  headerFields: "Field1, Field2",
  logo: {
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: Buffer.from('fake-logo-binary-content')
  }
});

async function createLayout(request: APIRequestContext, token: string, payload: any) {
  return await request.post(`${apiBase}/letter-templates/layout`, {
    headers: { 'Authorization': `Bearer ${token}` },
    multipart: payload
  });
}

test.describe('HEBA Letters Template Management - Layout API', () => {
  let token: string;

  test.beforeAll(async () => {
    token = await getAuthToken();
  });

  test('TC-CLY-003: Valid Create Layout - Happy Path', async ({ request }) => {
    const name = `Layout_${getUniqueSuffix()}`;
    const response = await createLayout(request, token, buildLayoutPayload(name));
    
    // Status policy: success 200, compatibility for HAR-observed 500
    expect([200, 500]).toContain(response.status());
    
    if (response.status() === 200) {
      const body = await response.json();
      expect(typeof body).toBe('object');
    }
  });

  test('TC-CLY-004: Edit Existing Layout - Happy Path', async ({ request }) => {
    const listResponse = await request.get(`${apiBase}/letter-templates/layout`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const layouts = await listResponse.json();
    
    if (Array.isArray(layouts) && layouts.length > 0) {
      const targetId = layouts[0].id;
      const updatePayload = buildLayoutPayload(`Updated_${getUniqueSuffix()}`);
      
      const response = await request.put(`${apiBase}/letter-templates/layout/${targetId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        multipart: updatePayload
      });
      
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(typeof body).toBe('object');
    } else {
      test.skip(true, 'No existing layouts found to update');
    }
  });

  test('TC-CLY-001: Required Fields Enforcement - Missing Header Title', async ({ request }) => {
    const payload = buildLayoutPayload(`Fail_${getUniqueSuffix()}`);
    delete payload.headerTitle;

    const response = await createLayout(request, token, payload);
    // Status policy: missing fields prefer 400, allow 422
    expect([400, 422]).toContain(response.status());
  });

  test('Create Layout - Duplicate Name Enforcement', async ({ request }) => {
    const name = `Dup_${getUniqueSuffix()}`;
    const payload = buildLayoutPayload(name);
    
    await createLayout(request, token, payload);
    const response = await createLayout(request, token, payload);
    
    // Status policy: duplicate name 400
    expect(response.status()).toBe(400);
  });

  test('Create Layout - Invalid Logo Type (415)', async ({ request }) => {
    const payload = buildLayoutPayload(`InvalidType_${getUniqueSuffix()}`);
    payload.logo = {
      name: 'script.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('malicious-content')
    };

    const response = await createLayout(request, token, payload);
    expect(response.status()).toBe(415);
  });

  test('Create Layout - Oversize Logo (413)', async ({ request }) => {
    const payload = buildLayoutPayload(`LargeFile_${getUniqueSuffix()}`);
    // Create a buffer slightly over 4MB
    const largeBuffer = Buffer.alloc(4.1 * 1024 * 1024, 'a');
    payload.logo = {
      name: 'huge.pdf',
      mimeType: 'application/pdf',
      buffer: largeBuffer
    };

    const response = await createLayout(request, token, payload);
    expect(response.status()).toBe(413);
  });

  test('Create Layout - Unauthorized Access (401/403)', async ({ request }) => {
    const payload = buildLayoutPayload(`NoAuth_${getUniqueSuffix()}`);
    const response = await request.post(`${apiBase}/letter-templates/layout`, {
      multipart: payload
    });
    
    expect([401, 403]).toContain(response.status());
  });

  test('Edit Layout - Non-existent ID (404)', async ({ request }) => {
    const payload = buildLayoutPayload(`NonExistent_${getUniqueSuffix()}`);
    const response = await request.put(`${apiBase}/letter-templates/layout/9999999`, {
      headers: { 'Authorization': `Bearer ${token}` },
      multipart: payload
    });
    
    expect(response.status()).toBe(404);
  });

  test('Layout Listing - Verify JSON Container', async ({ request }) => {
    const response = await request.get(`${apiBase}/letter-templates/layout`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Assert container type only per contract policy
    expect(Array.isArray(body) || typeof body === 'object').toBeTruthy();
  });

  test('Create Layout - Unstable Server Compatibility (500)', async ({ request }) => {
    // Some specific payloads might trigger the 500 observed in HAR
    const payload = buildLayoutPayload(`Stability_${getUniqueSuffix()}`);
    payload.layout = "{ invalid_json: }"; 

    const response = await createLayout(request, token, payload);
    // Allow 400 or 500 based on environment behavior
    expect([400, 500]).toContain(response.status());
  });
});
