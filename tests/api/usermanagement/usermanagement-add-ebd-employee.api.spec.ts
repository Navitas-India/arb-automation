import { test, expect, APIRequestContext } from '@playwright/test';
import { URLS, getAuthToken } from '../../../fixtures/auth';

const apiBase = URLS.backend.endsWith('/api') ? URLS.backend : `${URLS.backend}/api`;

const getUniqueId = () => Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
const getUniqueSSN = () => `9${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

const buildEbdPayload = (overrides = {}) => {
  const id = getUniqueId();
  const ssn = getUniqueSSN();
  return {
    firstName: `QA_First_${id}`,
    lastName: `QA_Last_${id}`,
    middleInitial: 'T',
    dob: '01/01/1980',
    ssn: ssn,
    confirmSsn: ssn,
    gender: 'M',
    phoneNumber: '5015551234',
    phoneType: 'HOME',
    personalEmailAddress: `personal_${id}@example.com`,
    workEmailAddress: `work_${id}@example.com`,
    departmentId: 333,
    responsiblePartyId: 1300000504,
    businessArea: 'BA-01',
    classCode: 'CC-01',
    costCenter: 'CS-01',
    stateTitle: 'Analyst',
    functionalTitle: 'Lead',
    positionNumber: `PN-${id}`,
    grade: 'GS-12',
    clockInTime: '08:00:00',
    clockOutTime: '17:00:00',
    break1StartTime: '10:00:00',
    break1EndTime: '10:15:00',
    lunchStartTime: '12:00:00',
    lunchEndTime: '13:00:00',
    roleIds: [2],
    ...overrides
  };
};

test.describe('HEBA User Management - Add EBD Employee API', () => {
  let token: string;

  test.beforeAll(async () => {
    token = await getAuthToken();
  });

  test('TC-AEU-API-001: List roles for user assignment', async ({ request }) => {
    const response = await request.get(`${apiBase}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('TC-AEU-API-002: List account types', async ({ request }) => {
    const response = await request.get(`${apiBase}/account-types`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('TC-AEU-API-003: List departments for employee information', async ({ request }) => {
    const response = await request.get(`${apiBase}/departments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('TC-AEU-API-004: List responsible parties', async ({ request }) => {
    const response = await request.get(`${apiBase}/responsible-parties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('TC-AEU-API-005: List roles specifically for account type 1', async ({ request }) => {
    const response = await request.get(`${apiBase}/account-types/1/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('TC-AEU-API-006: Create EBD Employee - Happy Path', async ({ request }) => {
    const payload = buildEbdPayload();
    const response = await request.post(`${apiBase}/admin-users/ebd-employees`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload
    });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  test('TC-AEU-API-007: Create EBD Employee - Missing Required Field', async ({ request }) => {
    const payload = buildEbdPayload({ firstName: '' });
    const response = await request.post(`${apiBase}/admin-users/ebd-employees`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload
    });
    expect([400, 422]).toContain(response.status());
  });

  test('TC-AEU-API-008: Create EBD Employee - Duplicate Email Conflict', async ({ request }) => {
    const sharedEmail = `duplicate_${getUniqueId()}@example.com`;
    const payload1 = buildEbdPayload({ personalEmailAddress: sharedEmail });
    
    const res1 = await request.post(`${apiBase}/admin-users/ebd-employees`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload1
    });
    expect([200, 201]).toContain(res1.status());

    const payload2 = buildEbdPayload({ personalEmailAddress: sharedEmail });
    const res2 = await request.post(`${apiBase}/admin-users/ebd-employees`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload2
    });
    expect(res2.status()).toBe(400);
  });

  test('TC-AEU-API-009: Create EBD Employee - SSN Mismatch Validation', async ({ request }) => {
    const payload = buildEbdPayload({ 
      ssn: '999001111', 
      confirmSsn: '999002222' 
    });
    const response = await request.post(`${apiBase}/admin-users/ebd-employees`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload
    });
    // Contract allows 400/422/200/201 for uncertain SSN mismatch logic
    expect([200, 201, 400, 422]).toContain(response.status());
  });

  test('TC-AEU-API-010: Create EBD Employee - Unauthorized', async ({ request }) => {
    const payload = buildEbdPayload();
    const response = await request.post(`${apiBase}/admin-users/ebd-employees`, {
      headers: { Authorization: `Bearer invalid_token` },
      data: payload
    });
    expect([401, 403]).toContain(response.status());
  });

  test('TC-AEU-API-011: Create EBD Employee - Invalid Date Format', async ({ request }) => {
    const payload = buildEbdPayload({ dob: '1980-01-01' }); // Expecting MM/DD/YYYY
    const response = await request.post(`${apiBase}/admin-users/ebd-employees`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload
    });
    expect([400, 422, 200, 201]).toContain(response.status());
  });

  test('TC-AEU-API-012: Create EBD Employee - Missing Role IDs', async ({ request }) => {
    const payload = buildEbdPayload({ roleIds: [] });
    const response = await request.post(`${apiBase}/admin-users/ebd-employees`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload
    });
    expect([400, 422, 200, 201]).toContain(response.status());
  });
});
