import { test, expect, APIRequestContext } from '@playwright/test';
import { URLS, getAuthToken } from '../../../fixtures/auth';

const getUniqueId = () => `AUTO_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

const buildTemplateMetadata = (overrides = {}) => ({
  name: `Template ${getUniqueId()}`,
  description: 'Automated test template content',
  effectiveDate: new Date().toISOString().split('T')[0],
  expirationOption: 'NEVER',
  isBatchEnabled: false,
  layoutTemplateId: 1,
  ...overrides
});

test.describe('HEBA Letters Content Template Management API', () => {
  let token: string;
  let apiBase: string;

  test.beforeAll(async () => {
    token = await getAuthToken();
    apiBase = URLS.backend.endsWith('/api') ? URLS.backend : `${URLS.backend}/api`;
  });

  async function postContentTemplate(request: APIRequestContext, metadata: object, fileName: string, fileBuffer: Buffer, contentType: string) {
    return await request.post(`${apiBase}/letter-templates/content`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        templateMetadata: JSON.stringify(metadata),
        templateContent: '<div>Template Body</div>',
        files: {
          name: fileName,
          mimeType: contentType,
          buffer: fileBuffer,
        }
      }
    });
  }

  test('GET /letter-templates/layout/names - Retrieve Layout Names Success', async ({ request }) => {
    const response = await request.get(`${apiBase}/letter-templates/layout/names`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /letter-types/tags - Retrieve Template Tags Success', async ({ request }) => {
    const response = await request.get(`${apiBase}/letter-types/tags`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /batch-jobs/jobs-list-by-status - Retrieve Active Batch Jobs Success', async ({ request }) => {
    const response = await request.get(`${apiBase}/batch-jobs/jobs-list-by-status?status=ACTIVE`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('POST /letter-templates/content - Create Content Template Happy Path', async ({ request }) => {
    const metadata = buildTemplateMetadata();
    const response = await postContentTemplate(request, metadata, 'test.docx', Buffer.from('mock content'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(response.status()).toBe(200);
    expect(typeof await response.json()).toBe('object');
  });

  test('PUT /letter-templates/content/{id} - Update Content Template Success', async ({ request }) => {
    const templateId = 374; 
    const metadata = buildTemplateMetadata({ name: `Updated ${getUniqueId()}` });
    const response = await request.put(`${apiBase}/letter-templates/content/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        templateMetadata: JSON.stringify(metadata),
        templateContent: '<div>Updated Content</div>'
      }
    });
    expect(response.status()).toBe(200);
    expect(typeof await response.json()).toBe('object');
  });

  test('POST /convert/word-html - Word to HTML Conversion Success', async ({ request }) => {
    const response = await request.post(`${apiBase}/convert/word-html`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: 'test.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: Buffer.from('mock docx content'),
        }
      }
    });
    expect(response.status()).toBe(200);
    expect(typeof await response.json()).toBe('object');
  });

  test('POST /convert/pdf-html - PDF to HTML Conversion Success', async ({ request }) => {
    const response = await request.post(`${apiBase}/convert/pdf-html`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 mock content'),
        }
      }
    });
    expect(response.status()).toBe(200);
    expect(typeof await response.json()).toBe('object');
  });

  test('POST /letter-templates/content - Validation Failure Missing Required Fields', async ({ request }) => {
    const response = await request.post(`${apiBase}/letter-templates/content`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        templateContent: '<div>Incomplete Data</div>'
      }
    });
    expect([400, 422]).toContain(response.status());
  });

  test('POST /letter-templates/content - Validation Failure Invalid File Type', async ({ request }) => {
    const metadata = buildTemplateMetadata();
    const response = await postContentTemplate(request, metadata, 'virus.exe', Buffer.from('malicious code'), 'application/x-msdownload');
    expect(response.status()).toBe(415);
  });

  test('POST /letter-templates/content - Validation Failure Oversize File', async ({ request }) => {
    const metadata = buildTemplateMetadata();
    const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
    const response = await postContentTemplate(request, metadata, 'big.pdf', largeBuffer, 'application/pdf');
    expect(response.status()).toBe(413);
  });

  test('POST /letter-templates/content - Unauthorized Request Returns 401 or 403', async ({ request }) => {
    const response = await request.post(`${apiBase}/letter-templates/content`, {
      headers: { Authorization: `Bearer invalid_token` }
    });
    expect([401, 403]).toContain(response.status());
  });

  test('PUT /letter-templates/content/{id} - Update Content Template Validation Failure', async ({ request }) => {
    const response = await request.put(`${apiBase}/letter-templates/content/374`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        templateMetadata: JSON.stringify({ name: '' }), 
        templateContent: ''
      }
    });
    expect([400, 422]).toContain(response.status());
  });
});
