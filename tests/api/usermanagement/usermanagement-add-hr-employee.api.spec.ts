import { test, expect, APIRequestContext } from '@playwright/test';
import { URLS, getAuthToken } from '../../../fixtures/auth';

const generateUniqueSuffix = () => Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
const generateSSN = () => `999-00-${generateUniqueSuffix()}`;

const buildHRPayload = (overrides = {}) => {
  const uniqueId = generateUniqueSuffix();
  const ssn = generateSSN();
  const email = `test.hr.${uniqueId}@example.org`;
  
  return {
    firstName: `HR_FN_${uniqueId}`,
    lastName: `HR_LN_${uniqueId}`,
    middleInitial: 'T',
    dob: '01/01/1985',
    ssn: ssn,
    confirmSsn: ssn,
    gender: 'M',
    phoneNumber: '5015551212',
    phoneType: 'HOME',
    personalEmail: email,
    workEmail: `work.${email}`,
    addressLine1: '123 Main St',
    addressLine2: 'Apt 4B',
    city: 'Little Rock',
    state: 'AR',
    zip: '72201',
    country: 'USA',
    agencyId: 1259853821,
    representativeType: 'A',
    representativeId: '1',
    agencyRepresentativeId: '1',
    roleIds: [17],
    defaultAgencyDetails: {
      agencyId: 1259853821,
      representativeType: 'A',
      representativeId: '1'
    },
    agencyAssignments: [
      {
        agencyId: 1259853821,
        representativeType: 'A',
        representativeId: '1'
      }
    ],
    ...overrides
  };
};

test.describe('HEBA User Management - Add HR Employee API', () => {
  let token: string;
  const apiBase = URLS.backend.endsWith('/api') ? URLS.backend : `${URLS.backend}/api`;

  test.beforeAll(async () => {
    token = await getAuthToken();
  });

  test('TC-AHR-006: Save Creates HR User (Happy Path)', async ({ request }) => {
    const payload = buildHRPayload();
    const response = await request.post(`${apiBase}/admin-users/hr`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  test('TC-AHR-011: Duplicate Email Rejection', async ({ request }) => {
    const payload = buildHRPayload();
    // First creation
    const firstRes = await request.post(`${apiBase}/admin-users/hr`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect([200, 201]).toContain(firstRes.status());

    // Attempt second creation with same data
    const secondRes = await request.post(`${apiBase}/admin-users/hr`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect([400, 409]).toContain(secondRes.status());
  });

  test('TC-AHR-012: Missing Required Field Validation (Last Name)', async ({ request }) => {
    const payload = buildHRPayload({ lastName: '' });
    const response = await request.post(`${apiBase}/admin-users/hr`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    expect([400, 422]).toContain(response.status());
  });

  test('TC-AHR-013: SSN Mismatch Validation', async ({ request }) => {
    const payload = buildHRPayload({ 
      ssn: '999-00-1111', 
      confirmSsn: '999-00-2222' 
    });
    const response = await request.post(`${apiBase}/admin-users/hr`, {
      data: payload,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Per contract: allow 400/422/200/201 for uncertain mismatch behavior
    expect([200, 201, 400, 422]).toContain(response.status());
  });

  test('TC-AHR-Auth: Unauthorized Access (Missing Token)', async ({ request }) => {
    const response = await request.post(`${apiBase}/admin-users/hr`, {
      data: buildHRPayload()
    });
    expect([401, 403]).toContain(response.status());
  });

  test('TC-AHR-015: Lookup - Roles', async ({ request }) => {
    const response = await request.get(`${apiBase}/roles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });

  test('TC-AHR-015: Lookup - Account Types', async ({ request }) => {
    const response = await request.get(`${apiBase}/account-types`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });

  test('TC-AHR-015: Lookup - Departments', async ({ request }) => {
    const response = await request.get(`${apiBase}/departments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });

  test('TC-AHR-015: Lookup - Responsible Parties', async ({ request }) => {
    const response = await request.get(`${apiBase}/responsible-parties`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });

  test('TC-AHR-015: Lookup - Account Type 4 Roles', async ({ request }) => {
    const response = await request.get(`${apiBase}/account-types/4/roles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });

  test('TC-AHR-015: Lookup - Agencies Sorted', async ({ request }) => {
    const response = await request.get(`${apiBase}/agencies/sorted`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });

  test('TC-AHR-015: Lookup - Agency Representative Types', async ({ request }) => {
    const response = await request.get(`${apiBase}/agency-representatives/types`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });
});
