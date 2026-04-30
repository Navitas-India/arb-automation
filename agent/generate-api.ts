import * as path from 'path';
import { GenerationModeConfig, StoryHighlights, runGenerator } from './generator-core';

function extractGeneratorContract(story: string): string {
  const match = story.match(/###\s+Generator Contract[\s\S]*?(?=\n##\s|\n###\s|$)/i);
  if (!match) return 'No explicit Generator Contract block found. Derive module behavior from API sections in the story.';
  return match[0].trim();
}

function buildApiPrompt(story: string, storyLabel: string, highlights: StoryHighlights): string {
  const acceptance = highlights.acceptanceHints.length
    ? highlights.acceptanceHints.map(item => `- ${item}`).join('\n')
    : '- Infer one clear happy-path API behavior from the story.';

  const negatives = highlights.negativeHints.length
    ? highlights.negativeHints.map(item => `- ${item}`).join('\n')
    : '- Infer one validation or error-path API behavior from the story.';

  const generatorContract = extractGeneratorContract(story);

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
    'API-generation constraints:',
    '- Use APIRequestContext helpers for request execution.',
    '- If endpoint requires auth, get token using getAuthToken() from fixtures/auth.ts.',
    '- Build URLs using apiBase helper: const apiBase = URLS.backend.endsWith("/api") ? URLS.backend : `${URLS.backend}/api`.',
    '- Keep tests deterministic and concise.',
    '- Generate tests only for the selected feature section; do not include endpoints from unrelated modules.',
    '- Use local payload helpers/factories in generated specs when multiple tests share body structure.',
    '- Respect the Generator Contract block from the story strictly (endpoints, payload keys, statuses, target test count, exclusions).',
    '- If contract marks a scenario as compatibility, assert allowed status set instead of one strict code.',
    '- Include one happy-path test and one negative/validation test at minimum.',
    '- Assert HTTP status explicitly.',
    '- For response assertions, prefer contract-safe checks:',
    '  - If response schema is documented, assert key documented fields.',
    '  - If response examples are `{}` or schema is unspecified, assert JSON container type only (object/array) and avoid undocumented keys.',
    '',
    'Generator contract (module-specific):',
    generatorContract,
    '',
    'Feature markdown:',
    story,
  ].join('\n');
}

function validateApiCode(code: string): string[] {
  const errors: string[] = [];

  if (!code.includes("from '@playwright/test'")) {
    errors.push('Missing Playwright test import.');
  }
  if (!code.includes('APIRequestContext')) {
    errors.push('Missing APIRequestContext usage.');
  }
  if (/\bplaywright\s*;/.test(code)) {
    errors.push('Invalid trailing tokens detected (playwright;). Regenerate without stray statements.');
  }
  if (/\bB00004\b/.test(code)) {
    errors.push('Do not hardcode example user IDs like B00004; use environment-backed seeded IDs.');
  }
  if (/createApiDataBuilder|ApiDataMode|fixtures\/api-data|dataBuilder\./.test(code)) {
    errors.push('DataBuilder concept is disabled for generated API specs; use local explicit test-data factories.');
  }
  const testCount = (code.match(/\btest\s*\(/g) ?? []).length;
  const minTestsRequired = 2;
  if (testCount < minTestsRequired) {
    errors.push(`Must include at least ${minTestsRequired} tests for this module.`);
  }

  const hasHappyNameIntent = /(happy|success|valid)/i.test(code);
  const hasNegativeNameIntent = /(negative|invalid|missing|unauthorized|forbidden|validation|error|conflict|not[-\s]?found)/i.test(code);
  const hasHappyStatusIntent =
    /status\(\)\)\.toBe\(\s*20\d\s*\)/s.test(code) ||
    /expect\(\s*\[[^\]]*20\d[^\]]*\]\s*\)\.toContain\(\s*[a-zA-Z0-9_.]+\s*\.status\(\)\s*\)/s.test(code);
  const hasNegativeStatusIntent =
    /status\(\)\)\.toBe\(\s*(4\d\d|5\d\d)\s*\)/s.test(code) ||
    /expect\(\s*\[[^\]]*(4\d\d|5\d\d)[^\]]*\]\s*\)\.toContain\(\s*[a-zA-Z0-9_.]+\s*\.status\(\)\s*\)/s.test(code);

  if (!hasHappyNameIntent && !hasHappyStatusIntent) {
    errors.push('Missing happy-path intent in test names or status assertions.');
  }
  if (!hasNegativeNameIntent && !hasNegativeStatusIntent) {
    errors.push('Missing negative/validation intent in test names or status assertions.');
  }

  const supportsCompatibilityStatus =
    /expect\(\s*\[[^\]]+\]\s*\)\.toContain\(\s*[a-zA-Z0-9_.]+\s*\.status\(\)\s*\)/s.test(code);
  if (!/expect\(.*status\(\)\)\.toBe\(/s.test(code) && !supportsCompatibilityStatus) {
    errors.push('Must assert exact status or allowed compatibility status set.');
  }

  const hasDocumentedFieldAssertions = /toHaveProperty\(/s.test(code);
  const hasContainerAssertions =
    /toEqual\(\s*expect\.any\((Object|Array)\)\s*\)/s.test(code) ||
    /expect\(\s*Array\.isArray\(/s.test(code) ||
    /expect\(\s*typeof\s+[a-zA-Z0-9_.]+\s*\)\.toBe\(\s*['"](object|array)['"]\s*\)/s.test(code) ||
    /typeof\s+[a-zA-Z0-9_.]+\s*===\s*['"]object['"]/s.test(code) ||
    /Object\.keys\([a-zA-Z0-9_.]+\)\.length/s.test(code);

  if (!hasDocumentedFieldAssertions && !hasContainerAssertions) {
    errors.push('Must assert response contract via documented key fields or JSON container shape.');
  }

  if (code.includes('Authorization') && !code.includes('getAuthToken(')) {
    errors.push('Authorization usage requires getAuthToken().');
  }

  return errors;
}

const API_SYSTEM = `
You are a Playwright API test generator for ARBenefits.

Return only valid TypeScript code for one API spec file.

Rules:
1. Import { test, expect, APIRequestContext } from '@playwright/test'.
2. Import URLS and getAuthToken from '../../../fixtures/auth'.
3. Do not import or use createApiDataBuilder / ApiDataMode.
4. Use helper functions that accept APIRequestContext for deterministic request execution.
5. Build URLs from apiBase helper and explicit endpoint strings.
6. If a protected endpoint is tested, obtain token via getAuthToken() and send Authorization: Bearer <token>.
7. Build local in-file test-data factories (for example buildPayload(overrides)) where needed.
8. Use deterministic unique suffix helper in file for identity fields where needed.
9. Generate at least 2 tests: one happy path and one negative/validation path.
10. Each test must assert HTTP status.
11. Response assertions must follow contract-safe strategy:
   - If schema fields are explicitly documented, assert those keys/values.
  - If schema is unspecified or example is \`{}\`, assert JSON container type only and avoid undocumented keys.
12. For negative tests, prefer industry-standard status defaults with compatibility fallback:
   - auth: 401 (or 403), authorization: 403, not found: 404, validation: 400/422, conflict: 409, media: 415, payload too large: 413.
13. Avoid vague assertions.
14. Keep file concise and deterministic.
15. Do not output markdown fences or explanations.
16. Output must be complete and syntactically valid TypeScript with balanced braces and quotes.
17. Use apiBase helper: const apiBase = URLS.backend.endsWith('/api') ? URLS.backend : \`\${URLS.backend}/api\`.
18. Generate tests only for the selected feature section; do not include endpoints from other modules.
19. Obey module-specific Generator Contract from prompt (target test count, endpoint allow-list, status compatibility, exclusions, data fixtures).
20. Never paste large multiline HTML/XML/document payloads into code literals; keep payload strings short and safe.
21. For multipart endpoints, use minimal representative field values and avoid long escaped string blocks.
`.trim();

const config: GenerationModeConfig = {
  mode: 'api',
  outputDir: path.resolve(__dirname, '../tests/api'),
  outputSuffix: '.api.spec.ts',
  systemPrompt: API_SYSTEM,
  buildPrompt: buildApiPrompt,
  validateGeneratedCode: validateApiCode,
  maxTokenAttempts: [2800, 4200, 5600, 7200],
};

runGenerator(config).catch(err => {
  console.error('API generator error:', err.message);
  process.exit(1);
});
