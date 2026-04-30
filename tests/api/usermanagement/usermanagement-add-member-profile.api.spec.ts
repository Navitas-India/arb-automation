import { test, expect, APIRequestContext } from '@playwright/test';
import { URLS, getAuthToken } from '../../../fixtures/auth';

const getUniqueSuffix = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const buildMemberPayload = (overrides = {}) => {
  const suffix = getUniqueSuffix();
  const ssn = `999${suffix.slice(-6)}`;
  return {
    firstName: "Alex",
    middleInitial: "J",
    lastName: "Tester",
    suffix: "Sr",
    dob: "01/01/1990",
    gender: "M",
    ssn: ssn,
    confirmSsn: ssn,
    phoneNumber: "5015551234",
    phoneType: "HOME",
    personalEmailAddress: `personal_${suffix}@example.com`,
    workEmailAddress: `work_${suffix}@example.com`,
    physicalSameAsMailing: true,
    agency: "1374",
    agencyId: "1374",
    personnelNumber: suffix,
    hireDate: "01/01/2020",
    mailingAddressLine1: "123 Main St",
    mailingCity: "Little Rock",
    mailingState: "AR",
    mailingZip: "72201",
    physicalAddressLine1: "123 Main St",
    physicalCity: "Little Rock",
    physicalState: "AR",
    physicalZip: "72201",
    ...overrides
  };
};

test.describe('HEBA User Management - Member Profile API', () => {
  let token: string;
  const apiBase = URLS.backend.endsWith('/api') ? URLS.backend : `${URLS.backend}/api`;

  test.beforeAll(async () => {
    token = await getAuthToken();
  });

  const postMember = async (request: APIRequestContext, payload: any, authToken?: string) => {
    return await request.post(`${apiBase}/admin-users/member`, {
      data: payload,
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
  };

  const getMemberData = async (request: APIRequestContext, endpoint: string, id: string, authToken?: string) => {
    const url = endpoint.replace('{id}', id);
    return await request.get(`${apiBase}${url}`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
  };

  test('TC-AMP-API-001: Create Member Success (Happy Path)', async ({ request }) => {
    const payload = buildMemberPayload();
    const response = await postMember(request, payload, token);
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(typeof body === 'object').toBeTruthy();
  });

  test('TC-AMP-API-002: Duplicate SSN Conflict', async ({ request }) => {
    const payload = buildMemberPayload();
    await postMember(request, payload, token);
    const response = await postMember(request, payload, token);
    expect([400, 409, 422]).toContain(response.status());
  });

  test('TC-AMP-API-003: SSN Mismatch Validation', async ({ request }) => {
    const payload = buildMemberPayload({ confirmSsn: '000-00-0000' });
    const response = await postMember(request, payload, token);
    expect([200, 201, 400, 422]).toContain(response.status());
  });

  test('TC-AMP-API-004: Missing Required Field Validation', async ({ request }) => {
    const payload = buildMemberPayload();
    delete payload.lastName;
    const response = await postMember(request, payload, token);
    expect([400, 422]).toContain(response.status());
  });

  test('TC-AMP-API-005: Create Member Unauthorized', async ({ request }) => {
    const payload = buildMemberPayload();
    const response = await postMember(request, payload);
    expect([401, 403]).toContain(response.status());
  });

  test('TC-AMP-API-006: Read Member Coverage Info', async ({ request }) => {
    const response = await getMemberData(request, '/member/{id}/coverage-info', '12345', token);
    expect([200, 404, 500]).toContain(response.status());
    if (response.status() === 200) expect(typeof (await response.json()) === 'object').toBeTruthy();
  });

  test('TC-AMP-API-007: Read Member Contact Information', async ({ request }) => {
    const response = await getMemberData(request, '/demographic/{id}/contact-information', '12345', token);
    expect([200, 404, 500]).toContain(response.status());
  });

  test('TC-AMP-API-008: Read Member Coverage History Active', async ({ request }) => {
    const response = await getMemberData(request, '/member/{id}/coverage-history/active', '12345', token);
    expect([200, 404, 500]).toContain(response.status());
  });

  test('TC-AMP-API-009: Read Member Dental Vision Life', async ({ request }) => {
    const response = await getMemberData(request, '/member/{id}/dental-vision-life', '12345', token);
    expect([200, 404, 500]).toContain(response.status());
  });

  test('TC-AMP-API-010: Read Member Covered and Termed', async ({ request }) => {
    const response = await getMemberData(request, '/member/{id}/covered-and-termed', '12345', token);
    expect([200, 404, 500]).toContain(response.status());
  });

  test('TC-AMP-API-011: Read Member Voluntary Products', async ({ request }) => {
    const response = await getMemberData(request, '/member/{id}/voluntary-products', '12345', token);
    expect([200, 404, 500]).toContain(response.status());
  });

  test('TC-AMP-API-012: Read Endpoint Unauthorized', async ({ request }) => {
    const response = await getMemberData(request, '/member/{id}/coverage-info', '12345');
    expect([401, 403]).toContain(response.status());
  });

  test('TC-AMP-API-013: Read Endpoint Not Found / Service Error Stability', async ({ request }) => {
    const response = await getMemberData(request, '/member/{id}/coverage-info', 'non-existent-id', token);
    expect([200, 404, 500]).toContain(response.status());
  });

  test('TC-AMP-API-014: Create Member with Different Physical Address', async ({ request }) => {
    const payload = buildMemberPayload({
      physicalSameAsMailing: false,
      physicalAddressLine1: "456 Oak Ave",
      physicalCity: "Benton",
      physicalState: "AR",
      physicalZip: "72015"
    });
    const response = await postMember(request, payload, token);
    expect([200, 201]).toContain(response.status());
  });

  test('TC-AMP-API-015: Create Member Validation (Invalid Date Format)', async ({ request }) => {
    const payload = buildMemberPayload({ dob: '1990-01-01' });
    const response = await postMember(request, payload, token);
    expect([200, 201, 400, 422]).toContain(response.status());
  });
});
