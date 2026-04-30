import { test, expect, APIRequestContext } from '@playwright/test';
import { URLS, getAuthToken } from '../../../fixtures/auth';

const getUniqueId = () => Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

const buildNonEbdEmployeePayload = (overrides = {}) => {
  const suffix = getUniqueId();
  const ssn = `900${suffix}`;
  return {
    firstName: `QA_First_${suffix}`,
    lastName: `QA_Last_${suffix}`,
    middleInitial: 'T',
    dob: '01/01/1985',
    ssn: ssn,
    confirmSsn: ssn,
    gender: 'Male',
    phoneNumber: '5015551234',
    phoneType: 'Mobile',
    personalEmailAddress: `personal_${suffix}@example.com`,
    workEmailAddress: `work_${suffix}@example.com`,
    addressLine1: '123 Main St',
    addressLine2: 'Apt 4B',
    city: 'Little Rock',
    state: 'AR',
    zip: '72201',
    country: 'USA',
    roleIds: [12],
    ...overrides
  };
};

async function createNonEbdEmployee(request: APIRequestContext, apiBase: string, token: string, payload: object) {
  return await request.post(`${apiBase}/admin-users/non-ebd-employees`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: payload
  });
}

test.describe('HEBA User Management - Add Non-EBD Employee API', () => {
  let apiBase: string;
  let authToken: string;

  test.beforeAll(async () => {
    apiBase = URLS.backend.endsWith('/api') ? URLS.backend : `${URLS.backend}/api`;
    authToken = await getAuthToken();
  });

  test('TC-ANEU-009: Save Creates Non-EBD User (Happy Path)', async ({ request }) => {
    const payload = buildNonEbdEmployeePayload();
    const response = await createNonEbdEmployee(request, apiBase, authToken, payload);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  test('TC-ANEU-008: Required Field Validation - Missing SSN (Negative Path)', async ({ request }) => {
    const payload = buildNonEbdEmployeePayload();
    // @ts-ignore
    delete payload.ssn;
    // @ts-ignore
    delete payload.confirmSsn;

    const response = await createNonEbdEmployee(request, apiBase, authToken, payload);
    
    // Accept 400 or 422 for validation errors per generator contract
    expect([400, 422]).toContain(response.status());
  });

  test('TC-ANEU-013: Unauthorized access to create Non-EBD employee', async ({ request }) => {
    const payload = buildNonEbdEmployeePayload();
    const response = await request.post(`${apiBase}/admin-users/non-ebd-employees`, {
      headers: {
        'Authorization': `Bearer invalid_token`,
        'Content-Type': 'application/json'
      },
      data: payload
    });

    // Accept 401 or 403 for auth errors per generator contract
    expect([401, 403]).toContain(response.status());
  });

  test('Verification: List Admin Users', async ({ request }) => {
    const response = await request.get(`${apiBase}/admin-users`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    // Verify response is a JSON container (object or array depending on exact search implementation)
    expect(typeof body).toBe('object');
  });
});
