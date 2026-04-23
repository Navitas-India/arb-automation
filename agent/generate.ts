/**
 * ARB Automation — Spec Generator Agent
 *
 * Reads every .md file in user-stories/
 * Sends each to Claude
 * Writes a matching .spec.ts into tests/
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
const TESTS   = path.resolve(__dirname, '../tests');

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM = `
You are a Playwright test automation engineer for ARBenefits — a Spring Boot healthcare portal.

Your job: read a user story and generate a complete Playwright TypeScript spec file using Passmark's runSteps() for UI tests and Playwright's request fixture for API tests.

Rules:
1. Import runSteps from 'passmark' for any UI/browser test
2. Use request fixture directly for pure API tests (no browser)
3. Import TEST_USERS, URLS, getAuthToken from '../fixtures/auth'
4. Always cover: happy path + all negative cases from the story
5. Use test.describe() to group tests by feature
6. Each step description must be plain English — no selectors, no CSS, no XPath
7. Assertions must be plain English sentences
8. Return ONLY the TypeScript code — no markdown, no explanation
`.trim();

// ── Generate one spec ────────────────────────────────────────────────────────
async function generateSpec(storyFile: string): Promise<void> {
  const storyPath = path.join(STORIES, storyFile);
  const storyName = storyFile.replace('.md', '');
  const outPath   = path.join(TESTS, `${storyName}.spec.ts`);

  const story = fs.readFileSync(storyPath, 'utf-8');

  console.log(`\n📖  Reading: ${storyFile}`);
  console.log(`✍️   Generating: ${storyName}.spec.ts ...`);

  const response = await client.messages.create({
    model:      'claude-opus-4-5',
    max_tokens: 4096,
    system:     SYSTEM,
    messages: [
      {
        role:    'user',
        content: `Generate a Playwright spec file for this user story:\n\n${story}`,
      },
    ],
  });

  const code = (response.content[0] as { type: string; text: string }).text.trim();

  // Strip markdown code fences if model wrapped the output
  const clean = code
    .replace(/^```typescript\n?/, '')
    .replace(/^```ts\n?/, '')
    .replace(/```$/, '')
    .trim();

  fs.writeFileSync(outPath, clean + '\n', 'utf-8');
  console.log(`💾  Saved: tests/${storyName}.spec.ts`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌  ANTHROPIC_API_KEY not set in .env');
    process.exit(1);
  }

  const filter = process.argv[2]; // optional: "premium-matrix"

  const files = fs
    .readdirSync(STORIES)
    .filter(f => f.endsWith('.md'))
    .filter(f => !filter || f.includes(filter));

  if (files.length === 0) {
    console.error(`❌  No user stories found${filter ? ` matching "${filter}"` : ''}`);
    process.exit(1);
  }

  console.log(`\n🤖  ARB Spec Generator`);
  console.log(`📂  Found ${files.length} user stor${files.length === 1 ? 'y' : 'ies'}\n`);

  for (const file of files) {
    await generateSpec(file);
  }

  console.log(`\n✅  Done — run: npm test\n`);
}

main().catch(err => {
  console.error('❌  Agent error:', err.message);
  process.exit(1);
});
