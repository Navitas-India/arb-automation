import { Page } from '@playwright/test';

export const TEST_USERS = {
  admin: {
    email:    process.env.TEST_ADMIN_EMAIL    || 'murali.miriyala@navitastech.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'Murali@123',
  },
};

export const URLS = {
  frontend: process.env.FRONTEND_URL || 'http://localhost:5173',
  backend:  process.env.BACKEND_URL  || 'http://localhost:8085',
};

export async function getAuthToken(): Promise<string> {
  const res = await fetch(`${URLS.backend}/api/admin-portal/auth/signin`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      username:    TEST_USERS.admin.email,
      password:    TEST_USERS.admin.password,
      accountType: 'E',
    }),
  });
  const data = await res.json();
  if (!data.accessToken) throw new Error('Failed to get auth token');
  return data.accessToken;
}
