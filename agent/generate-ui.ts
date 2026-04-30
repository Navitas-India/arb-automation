import * as path from 'path';
import { GenerationModeConfig, StoryHighlights, runGenerator } from './generator-core';

function buildUiPrompt(story: string, storyLabel: string, highlights: StoryHighlights): string {
  const acceptance = highlights.acceptanceHints.length
    ? highlights.acceptanceHints.map(item => `- ${item}`).join('\n')
    : '- Infer acceptance from feature behavior.';

  const negatives = highlights.negativeHints.length
    ? highlights.negativeHints.map(item => `- ${item}`).join('\n')
    : '- Infer one realistic validation or error-path behavior.';

  return [
    `Story file: ${storyLabel}`,
    `Feature name: ${highlights.featureName}`,
    '',
    'Acceptance hints:',
    acceptance,
    '',
    'Negative hints:',
    negatives,
    '',
    'Route rules:',
    '- Use only navigation/runtime/precondition details explicitly present in markdown.',
    '- Do not hardcode module-specific menu paths unless present in the story.',
    '',
    'Feature markdown:',
    story,
  ].join('\n');
}

function validateUiCode(code: string): string[] {
  const errors: string[] = [];

  if (!code.includes("from '@playwright/test'")) {
    errors.push('Missing Playwright test import.');
  }
  if (!code.includes('test.describe(')) {
    errors.push('Missing test.describe block.');
  }
  if (code.includes('runSteps(')) {
    errors.push('Third-party UI step DSL usage is not allowed.');
  }

  const allowedSyntheticKeys = new Set([
    'firstName',
    'lastName',
    'ssn',
    'confirmSsn',
    'phone',
    'personalEmail',
    'workEmail',
    'mailingStreet',
    'mailingCity',
    'mailingZip',
    'physicalStreet',
    'physicalCity',
    'physicalZip',
    'personnelNumber',
  ]);

  const dataRefs = [...code.matchAll(/data\.([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  for (const key of dataRefs) {
    if (!allowedSyntheticKeys.has(key)) {
      errors.push(`Unsupported synthetic key: data.${key}`);
      break;
    }
  }

  if (code.includes('data.address.')) {
    errors.push('Do not use nested data.address fields.');
  }

  return errors;
}

const UI_SYSTEM = `
You are a Playwright UI test generator for ARBenefits.

Return only valid TypeScript code for one spec file.

Rules:
1. Import { test, expect } from '@playwright/test'.
2. Import TEST_USERS, URLS from '../../fixtures/auth' and buildSyntheticMemberData from '../../fixtures/synthetic'.
3. Use pure Playwright APIs only; do not use Passmark.
4. Use test.describe() and test.describe.configure({ timeout: 420_000, retries: 0 }).
5. For each test: create data via buildSyntheticMemberData(), derive baseUrl/loginUrl, page.goto(loginUrl), and wait for domcontentloaded.
6. Log in with Playwright actions using TEST_USERS.admin credentials.
7. Use only story-provided navigation/preconditions; do not invent module-specific menu paths.
8. Create exactly 3 tests: happy path, validation/negative, business-rule.
9. Keep tests deterministic and concise.
10. Do not output markdown fences or explanations.
`.trim();

const config: GenerationModeConfig = {
  mode: 'ui',
  outputDir: path.resolve(__dirname, '../tests/ui'),
  outputSuffix: '.spec.ts',
  systemPrompt: UI_SYSTEM,
  buildPrompt: buildUiPrompt,
  validateGeneratedCode: validateUiCode,
};

runGenerator(config).catch(err => {
  console.error('UI generator error:', err.message);
  process.exit(1);
});
