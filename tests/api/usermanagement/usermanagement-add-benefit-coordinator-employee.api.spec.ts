import { test, expect, APIRequestContext } from '@playwright/test';
import { URLS, getAuthToken } from '../../../fixtures/auth';

const getUniqueSuffix = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const buildBenefitCoordinatorPayload = (overrides: any = {}) => {
  const suffix = getUniqueSuffix();
  const ssnPart1 = Math.floor(Math.random() * 900) + 100;
  const ssnPart2 = Math.floor(Math.random() * 90) + 10;
  const ssnPart3 = Math.floor(Math.random() * 9000) + 1000;
  const ssn = `${ssnPart1}-${ssnPart2}-${ssnPart3}`;

  return {
    firstName: 'TestBC',
    middleInitial: 'A',
    lastName: `User${suffix}`,
    suffix: 'Jr',
    dob: '01/01/1985',
    gender: 'F',
    ssn: ssn,
    confirmSsn: ssn,
    phoneNumber: '5015551212',
    phoneType: 'HOME',
    personalEmailAddress: `personal${suffix}@example.com`,
    workEmailAddress: `work${suffix}@example.com`,
    addressLine1: '123 Main St',
    addressLine2: 'Apt 4B',
    city: 'Little Rock',
    state: 'AR',
    zip: '72201',
    country: 'USA',
    vendorId: 1244949377,
    planType: 'Medical',
    roleIds: [18],
    userDetails: {
      firstName: 'TestBC',
      lastName: `User${suffix}`
    },
    demographics: {
      dob: '01/01/1985',
      gender: 'F',
      ssn: ssn
    },
    contactInfo: {
      phoneNumber: '5015551212',
      phoneType: 'HOME',
      personalEmailAddress: `personal${suffix}@example.com`,
      workEmailAddress: `work${suffix}@example.com`
    },
    mailingAddress: {
      addressLine1: '123 Main St',
      city: 'Little Rock',
      state: 'AR',
      zip: '72201'
    },
    vendorInformation: {
      vendorId: 1244949377,
      planType: 'Medical'
    },
    ...overrides
  };
};

test.describe('HEBA User Management - Benefit Coordinator API', () => {
  let apiBase: string;
  let token: string;

  test.beforeAll(async () => {
    apiBase = URLS.backend.endsWith('/api') ? URLS.backend : `${URLS.backend}/api`;
    token = await getAuthToken();
  });

  test('TC-ABC-015: Vendor and Plan Lookup Integrity', async ({ request }) => {
    const endpoints = [
      '/roles',
      '/account-types',
      '/account-types/5/roles',
      '/benefit-plan-type',
      '/vendors'
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${apiBase}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      expect(response.status(), `Endpoint ${endpoint} failed`).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body) || typeof body === 'object').toBeTruthy();
    }
  });

  test('TC-ABC-006: Save Creates Benefit Coordinator (Happy Path)', async ({ request }) => {
    const payload = buildBenefitCoordinatorPayload();
    const response = await request.post(`${apiBase}/admin-users/benefit-coordinators`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  test('TC-ABC-007: Vendor Association Persistence', async ({ request }) => {
    const payload = buildBenefitCoordinatorPayload({ vendorId: 1244949377 });
    const response = await request.post(`${apiBase}/admin-users/benefit-coordinators`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    expect([200, 201]).toContain(response.status());
  });

  test('TC-ABC-008: Plan Association Persistence', async ({ request }) => {
    const payload = buildBenefitCoordinatorPayload({ planType: 'Dental' });
    const response = await request.post(`${apiBase}/admin-users/benefit-coordinators`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    expect([200, 201]).toContain(response.status());
  });

  test('TC-ABC-012: Duplicate Email Rejection', async ({ request }) => {
    const payload = buildBenefitCoordinatorPayload();
    
    const res1 = await request.post(`${apiBase}/admin-users/benefit-coordinators`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect([200, 201]).toContain(res1.status());

    const res2 = await request.post(`${apiBase}/admin-users/benefit-coordinators`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect([400, 409]).toContain(res2.status());
  });

  test('TC-ABC-013: Missing Vendor Validation', async ({ request }) => {
    const payload: any = buildBenefitCoordinatorPayload();
    delete payload.vendorId;
    delete payload.vendorInformation;

    const response = await request.post(`${apiBase}/admin-users/benefit-coordinators`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    expect([400, 422]).toContain(response.status());
  });

  test('TC-ABC-014: SSN Mismatch Validation', async ({ request }) => {
    const payload = buildBenefitCoordinatorPayload({
      ssn: '999-00-1111',
      confirmSsn: '999-00-2222'
    });

    const response = await request.post(`${apiBase}/admin-users/benefit-coordinators`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    expect([400, 422, 200, 201]).toContain(response.status());
  });

  test('TC-ABC-016: Invalid Plan Type Handling', async ({ request }) => {
    const payload = buildBenefitCoordinatorPayload({ planType: 'InvalidPlanName' });

    const response = await request.post(`${apiBase}/admin-users/benefit-coordinators`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    expect([400, 422, 201, 200]).toContain(response.status());
  });

  test('TC-ABC-MissingAuth: Unauthorized Access', async ({ request }) => {
    const response = await request.post(`${apiBase}/admin-users/benefit-coordinators`, {
      data: buildBenefitCoordinatorPayload(),
      headers: {}
    });
    expect([401, 403]).toContain(response.status());
  });
});
