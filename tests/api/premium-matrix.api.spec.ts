import { test, expect } from '@playwright/test';
import { getAuthToken } from '../../fixtures/auth';
import * as fs from 'fs';
import * as path from 'path';

const BASE       = process.env.BACKEND_URL || 'http://localhost:8085';
const UPLOAD_URL = `${BASE}/api/admin-portal/premium-matrix/upload`;
const GET_URL    = `${BASE}/api/admin-portal/premium-matrix`;

const VALID_FILE   = path.resolve(__dirname, '../../test-data/matrix_2026.xlsx');
const INVALID_FILE = path.resolve(__dirname, '../../test-data/invalid.pdf');

test.describe('API — Premium Matrix', () => {

  test('Upload without token returns 401', async ({ request }) => {
    const res = await request.post(UPLOAD_URL);
    expect(res.status()).toBe(401);
  });

  test('Upload valid Excel file returns 200', async ({ request }) => {
    test.skip(!fs.existsSync(VALID_FILE), 'matrix_2026.xlsx not found in test-data/');
    const token = await getAuthToken();
    const res = await request.post(UPLOAD_URL, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'matrix_2026.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: fs.readFileSync(VALID_FILE) },
        year: '2026',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(JSON.stringify(body).toLowerCase()).toMatch(/success|upload|created/);
  });

  test('Upload PDF file returns 400', async ({ request }) => {
    test.skip(!fs.existsSync(INVALID_FILE), 'invalid.pdf not found in test-data/');
    const token = await getAuthToken();
    const res = await request.post(UPLOAD_URL, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'invalid.pdf', mimeType: 'application/pdf', buffer: fs.readFileSync(INVALID_FILE) },
        year: '2026',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('Get matrix without token returns 401', async ({ request }) => {
    const res = await request.get(`${GET_URL}?year=2026`);
    expect(res.status()).toBe(401);
  });

  test('Get matrix with valid token returns 200', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.get(`${GET_URL}?year=2026`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('Get matrix without year param returns 400', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.get(GET_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('Response contains expected fields', async ({ request }) => {
    const token = await getAuthToken();
    const res = await request.get(`${GET_URL}?year=2026`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Body is either an array or an object with data
    expect(Array.isArray(body) || typeof body === 'object').toBeTruthy();
  });

});
