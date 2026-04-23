import { test, expect } from '@playwright/test';
import { runSteps } from 'passmark';
import { URLS, TEST_USERS, getAuthToken } from '../fixtures/auth';
import * as path from 'path';

const FILE_VALID   = path.resolve(__dirname, '../test-data/matrix_2026.xlsx');
const FILE_INVALID = path.resolve(__dirname, '../test-data/invalid.pdf');

test.describe('Premium Matrix', () => {

  test('EBD Staff uploads valid Premium Matrix for 2026', async ({ page }) => {
    await runSteps({
      page,
      userFlow: 'Premium Matrix - Valid Upload',
      steps: [
        { description: `Navigate to ${URLS.frontend}/login` },
        { description: `Login with email ${TEST_USERS.admin.email} and password ${TEST_USERS.admin.password}` },
        { description: 'Navigate to the Premium Matrix section from the menu or sidebar' },
        { description: `Upload the file at path ${FILE_VALID} using the file upload input` },
        { description: 'Select year 2026 from the year dropdown or input' },
        { description: 'Click the Upload button to submit' },
      ],
      assertions: [
        { assertion: 'A success message or confirmation is visible after upload' },
        { assertion: 'No error message is shown' },
      ],
      test,
      expect,
    });
  });

  test('Premium Matrix data is visible after upload', async ({ page }) => {
    await runSteps({
      page,
      userFlow: 'Premium Matrix - Verify Data',
      steps: [
        { description: `Navigate to ${URLS.frontend}/login` },
        { description: `Login with email ${TEST_USERS.admin.email} and password ${TEST_USERS.admin.password}` },
        { description: 'Navigate to the Premium Matrix section' },
        { description: 'Select or filter by year 2026' },
      ],
      assertions: [
        { assertion: 'Premium Matrix data for year 2026 is displayed in the table' },
        { assertion: 'Rows with plan types HMO, PPO, or HDHP are visible' },
      ],
      test,
      expect,
    });
  });

  test('Upload without login returns unauthorised', async ({ request }) => {
    const res = await request.post(
      `${URLS.backend}/api/admin-portal/premium-matrix/upload`
    );
    expect(res.status()).toBe(401);
  });

  test('Upload invalid file format shows error', async ({ page }) => {
    await runSteps({
      page,
      userFlow: 'Premium Matrix - Invalid File',
      steps: [
        { description: `Navigate to ${URLS.frontend}/login` },
        { description: `Login with email ${TEST_USERS.admin.email} and password ${TEST_USERS.admin.password}` },
        { description: 'Navigate to the Premium Matrix section' },
        { description: `Upload the file at path ${FILE_INVALID} using the file upload input` },
        { description: 'Click the Upload button' },
      ],
      assertions: [
        { assertion: 'An error message is shown indicating invalid file format or unsupported file type' },
        { assertion: 'Upload does NOT succeed' },
      ],
      test,
      expect,
    });
  });

  test('Upload with mismatched year shows validation error', async ({ page }) => {
    await runSteps({
      page,
      userFlow: 'Premium Matrix - Year Mismatch',
      steps: [
        { description: `Navigate to ${URLS.frontend}/login` },
        { description: `Login with email ${TEST_USERS.admin.email} and password ${TEST_USERS.admin.password}` },
        { description: 'Navigate to the Premium Matrix section' },
        { description: `Upload the file at path ${FILE_VALID}` },
        { description: 'Select year 2030 which does not match the file content year 2026' },
        { description: 'Click the Upload button' },
      ],
      assertions: [
        { assertion: 'A validation error is shown about year mismatch' },
      ],
      test,
      expect,
    });
  });

});
