/**
 * ARB Automation — Spec Generator Agent
 *
 * Reads every .md file in user-stories/
 * Validates required sections first (linter)
 * Sends each to Claude
 * Writes matching .spec.ts into tests/ui/
 *
 * Usage:
 *   npx ts-node agent/generate.ts                   — generate all
 *   npx ts-node agent/generate.ts premium-matrix    — generate one
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs   from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const client  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const STORIES = path.resolve(__dirname, '../user-stories');
const TESTS   = path.resolve(__dirname, '../tests/ui');

// ── Required sections in every user story ────────────────────────────────────
const REQUIRED_SECTIONS = [
  '## As',
  '## I want to',
  '## So that',
  '## Acceptance Criteria',
  '## Negative Cases',
];

// ── Linter — validate user story before sending to AI ────────────────────────
function lintStory(content: string, filename: string): string[] {
  const errors: string[] = [];
  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(section)) {
      errors.push(`Missing section: "${section}"`);
    }
  }
  if (content.trim().split('\n').filter(l => l.trim()).length < 8) {
    errors.push('Story is too short — add more detail to Acceptance Criteria and Negative Cases');
  }
  return errors;
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM = `
You are a Playwright test automation engineer for ARBenefits — a Spring Boot healthcare portal.
Frontend runs on: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
Admin login: email = ${process.env.TEST_ADMIN_EMAIL || 'murali.miriyala@navitastech.com'}, password = ${process.env.TEST_ADMIN_PASSWORD || 'Murali@123'}

Your job: read a user story and generate a complete Playwright TypeScript spec file using PURE Playwright only.
DO NOT use Passmark, runSteps, or any AI-based browser control. Use direct Playwright selectors.

Rules:
1. Import ONLY from '@playwright/test' — no passmark, no other imports
2. Use page.goto(), page.locator(), page.fill(), page.click(), page.waitForLoadState()
3. Use forgiving selectors: 'input[type="email"], input[name="email"], #email' (try multiple)
4. Always add async login helper function at the top of each file
5. Cover: happy path + all negative cases from the story
6. Use test.describe() to group by feature name
7. Use test.skip() for tests that need test data files that may not exist
8. Return ONLY the TypeScript code — no markdown, no explanation, no code fences
`.trim();

// ── Generate one spec ─────────────────────────────────────────────────────────
async function generateSpec(storyFile: string): Promise<void> {
  const storyPath = path.join(STORIES, storyFile);
  const storyName = storyFile.replace('.md', '');
  const outPath   = path.join(TESTS, `${storyName}.spec.ts`);
  const content   = fs.readFileSync(storyPath, 'utf-8');

  // ── Lint first ──────────────────────────────────────────────────────────
  const errors = lintStory(content, storyFile);
  if (errors.length > 0) {
    console.log(`\n❌  ${storyFile} has errors — fix before generating:\n`);
    errors.forEach(e => console.log(`     • ${e}`));
    console.log(`\n   Open user-stories/${storyFile} and add the missing sections.\n`);
    return;
  }

  console.log(`\n📖  Reading:    ${storyFile}`);
  console.log(`✍️   Generating: tests/ui/${storyName}.spec.ts ...`);

  const response = await client.messages.create({
    model:      'claude-opus-4-5',
    max_tokens: 4096,
    system:     SYSTEM,
    messages: [{
      role:    'user',
      content: `Generate a Playwright spec file for this user story:\n\n${content}`,
    }],
  });

  const code  = (response.content[0] as { type: string; text: string }).text.trim();
  const clean = code
    .replace(/^```typescript\n?/, '')
    .replace(/^```ts\n?/, '')
    .replace(/```$/, '')
    .trim();

  fs.writeFileSync(outPath, clean + '\n', 'utf-8');
  console.log(`💾  Saved: tests/ui/${storyName}.spec.ts`);
}

// ── Validate env ──────────────────────────────────────────────────────────────
function validateEnv(): void {
  const missing: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY)           missing.push('ANTHROPIC_API_KEY');
  if (!process.env.FRONTEND_URL)                missing.push('FRONTEND_URL (optional — defaults to localhost:5173)');
  if (!process.env.TEST_ADMIN_EMAIL)            missing.push('TEST_ADMIN_EMAIL (optional — has default)');

  if (missing.some(m => !m.includes('optional'))) {
    console.error('\n❌  Missing required environment variables:');
    missing.filter(m => !m.includes('optional')).forEach(m => console.error(`     • ${m}`));
    console.error('\n   Copy .env.example to .env and fill in the values.\n');
    process.exit(1);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  validateEnv();

  const filter = process.argv[2];

  const files = fs
    .readdirSync(STORIES)
    .filter(f => f.endsWith('.md'))
    .filter(f => !filter || f.includes(filter));

  if (files.length === 0) {
    console.error(`\n❌  No user stories found${filter ? ` matching "${filter}"` : ''} in user-stories/\n`);
    process.exit(1);
  }

  console.log(`\n🤖  ARB Spec Generator`);
  console.log(`📂  Found ${files.length} user stor${files.length === 1 ? 'y' : 'ies'}`);
  console.log(`🔍  Linting stories before generating...\n`);

  for (const file of files) {
    await generateSpec(file);
  }

  console.log(`\n✅  Done — run: npm test\n`);
}

main().catch(err => {
  console.error('❌  Agent error:', err.message);
  process.exit(1);
});
