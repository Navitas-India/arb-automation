import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import ts from 'typescript';

dotenv.config();

const STORIES_DIR = path.resolve(__dirname, '../user-stories');
const ANTHROPIC_MODEL = 'claude-sonnet-4-5';
const GOOGLE_MODELS = ['gemini-flash-latest', 'gemini-pro-latest', 'gemini-2.5-pro'];

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;
const googleClient = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
  : null;

export type GenerationMode = 'ui' | 'api';

export type StoryHighlights = {
  featureName: string;
  acceptanceHints: string[];
  negativeHints: string[];
};

export type StoryUnit = {
  label: string;
  content: string;
  outputRelativePath: string;
};

export type GenerationModeConfig = {
  mode: GenerationMode;
  outputDir: string;
  outputSuffix: string;
  systemPrompt: string;
  buildPrompt: (story: string, storyLabel: string, highlights: StoryHighlights) => string;
  validateGeneratedCode: (code: string) => string[];
  postProcessCode?: (code: string) => string;
  maxTokenAttempts?: number[];
};

type LlmProvider = 'anthropic' | 'google';

function parseArgs(argv: string[]): {
  filter?: string;
  sectionFilter?: string;
  listOnly: boolean;
  helpOnly: boolean;
} {
  let filter: string | undefined;
  let sectionFilter: string | undefined;
  let listOnly = false;
  let helpOnly = false;
  const positionalArgs: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--list') {
      listOnly = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      helpOnly = true;
      continue;
    }
    if (arg.startsWith('--section=')) {
      sectionFilter = arg.slice('--section='.length).trim() || undefined;
      continue;
    }
    if (arg === '--section') {
      sectionFilter = (argv[i + 1] ?? '').trim() || undefined;
      i += 1;
      continue;
    }
    if (!arg.startsWith('-')) {
      positionalArgs.push(arg);
    }
  }

  if (positionalArgs[0]) {
    filter = positionalArgs[0];
  }

  return { filter, sectionFilter, listOnly, helpOnly };
}

function resolveProvider(): LlmProvider {
  const preferred = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (preferred === 'anthropic') {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('\nAI_PROVIDER is set to anthropic, but ANTHROPIC_API_KEY is missing.\n');
      process.exit(1);
    }
    return 'anthropic';
  }

  if (preferred === 'google') {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('\nAI_PROVIDER is set to google, but GOOGLE_GENERATIVE_AI_API_KEY is missing.\n');
      process.exit(1);
    }
    return 'google';
  }

  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return 'google';
  console.error('\nMissing required AI key.');
  console.error('Set ANTHROPIC_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env.');
  console.error('Optional: set AI_PROVIDER=google or AI_PROVIDER=anthropic.\n');
  process.exit(1);
}

async function generateContentWithProvider(
  provider: LlmProvider,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string> {
  if (provider === 'anthropic') {
    if (!anthropicClient) {
      throw new Error('ANTHROPIC_API_KEY is missing but Anthropic provider was selected.');
    }
    const response = await anthropicClient.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt,
      }],
    });

    const block = response.content.find(item => item.type === 'text');
    if (!block || !('text' in block)) {
      throw new Error('Anthropic returned no text content.');
    }
    return block.text.trim();
  }

  if (!googleClient) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is missing but Google provider was selected.');
  }

  let lastError: unknown;
  for (const googleModelName of GOOGLE_MODELS) {
    try {
      const model = googleClient.getGenerativeModel({
        model: googleModelName,
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: userPrompt }],
        }],
        generationConfig: {
          maxOutputTokens: maxTokens,
        },
      });
      const text = result.response.text();
      if (!text || !text.trim()) {
        throw new Error(`Google Gemini (${googleModelName}) returned no text content.`);
      }
      return text.trim();
    } catch (error) {
      lastError = error;
      console.warn(`Google model ${googleModelName} failed, trying fallback model...`);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Google Gemini request failed for all configured models.');
}

async function repairTypescriptWithProvider(
  provider: LlmProvider,
  brokenCode: string,
  tsErrors: string[],
  maxTokens: number,
): Promise<string> {
  const repairSystem = [
    'You are a TypeScript syntax repair assistant.',
    'Repair only parse/syntax issues and keep behavior intent unchanged.',
    'Return only valid TypeScript code with balanced braces and strings.',
    'Do not output markdown fences or explanations.',
  ].join('\n');

  const repairPrompt = [
    'Fix this TypeScript file so it compiles.',
    `Parser errors: ${tsErrors.join(' | ')}`,
    '',
    'Keep imports/tests/endpoints intent intact.',
    'When needed, replace risky multiline payload string literals with concise safe values.',
    '',
    'Broken TypeScript:',
    brokenCode,
  ].join('\n');

  return generateContentWithProvider(provider, repairSystem, repairPrompt, maxTokens);
}

function lintStory(content: string): string[] {
  const errors: string[] = [];

  const nonEmptyLines = content
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (nonEmptyLines.length < 3) {
    errors.push('Feature doc is too short. Add behavior details and expected outcomes.');
  }

  if (!/^#{1,6}\s+\S+/m.test(content)) {
    errors.push('Add at least one markdown heading.');
  }

  return errors;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function extractFeatureName(content: string, filename: string): string {
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) return headingMatch[1].trim();
  return filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ').trim();
}

function collectBulletsForHeading(content: string, headingPattern: RegExp): string[] {
  const lines = content.split('\n');
  const bullets: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (!headingPattern.test(lines[i])) continue;

    for (let j = i + 1; j < lines.length; j += 1) {
      const line = lines[j].trim();
      if (/^#{1,6}\s+/.test(line)) break;
      if (!line) continue;

      if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
        bullets.push(line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim());
      }
    }
  }

  return [...new Set(bullets)].slice(0, 12);
}

export function extractHighlights(content: string, filename: string): StoryHighlights {
  return {
    featureName: extractFeatureName(content, filename),
    acceptanceHints: collectBulletsForHeading(
      content,
      /^#{1,6}\s+.*(acceptance|criteria|expected|rules|behavior|success|scenario)s?.*$/i
    ),
    negativeHints: collectBulletsForHeading(
      content,
      /^#{1,6}\s+.*(negative|edge|error|failure|invalid|exception|validation)s?.*$/i
    ),
  };
}

function splitStoryUnits(content: string, storyFile: string, outputSuffix: string): StoryUnit[] {
  const featureRegex = /^##\s+Feature\s+\d+\s*:\s*(.+)$/gm;
  const featureMatches = [...content.matchAll(featureRegex)];
  const baseStoryName = storyFile.replace(/\.md$/i, '');
  const storyFolder = slugify(baseStoryName) || baseStoryName;

  if (featureMatches.length === 0) {
    return [{
      label: storyFile,
      content,
      outputRelativePath: path.join(storyFolder, `${baseStoryName}${outputSuffix}`),
    }];
  }

  const firstFeatureIndex = featureMatches[0].index ?? 0;
  const sharedHeader = content.slice(0, firstFeatureIndex).trim();
  const units: StoryUnit[] = [];

  for (let i = 0; i < featureMatches.length; i += 1) {
    const match = featureMatches[i];
    const featureTitle = (match[1] || `Feature ${i + 1}`).trim();
    const sectionStart = match.index ?? 0;
    const sectionEnd = i + 1 < featureMatches.length
      ? (featureMatches[i + 1].index ?? content.length)
      : content.length;

    const featureSection = content.slice(sectionStart, sectionEnd).trim();
    const unitContent = `${sharedHeader}\n\n${featureSection}`.trim();
    const unitSlug = slugify(featureTitle) || `feature-${i + 1}`;

    units.push({
      label: `${storyFile} :: ${featureTitle}`,
      content: unitContent,
      outputRelativePath: path.join(storyFolder, `${baseStoryName}-${unitSlug}${outputSuffix}`),
    });
  }

  return units;
}

export function validateTypescript(code: string): string[] {
  const errors: string[] = [];
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
    },
    reportDiagnostics: true,
  });

  const diagnostics = result.diagnostics ?? [];
  diagnostics
    .filter(d => d.category === ts.DiagnosticCategory.Error)
    .forEach(d => errors.push(ts.flattenDiagnosticMessageText(d.messageText, '\n')));

  return errors;
}

function cleanGeneratedCode(raw: string): string {
  return raw
    .replace(/^```typescript\s*/i, '')
    .replace(/^```ts\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

async function generateUnit(
  unit: StoryUnit,
  storyFile: string,
  config: GenerationModeConfig,
  provider: LlmProvider,
): Promise<string> {
  const maxTokenAttempts = config.maxTokenAttempts ?? [1400, 2200, 3000];
  let lastErrors: string[] = [];
  let clean = '';
  const highlights = extractHighlights(unit.content, storyFile);

  for (let attemptIndex = 0; attemptIndex < maxTokenAttempts.length; attemptIndex += 1) {
    const maxTokens = maxTokenAttempts[attemptIndex];
    const retryText = attemptIndex > 0
      ? `Fix prior issues and return full valid TypeScript only. Errors: ${lastErrors.join(' | ')}`
      : '';

    const userPrompt = [
      config.buildPrompt(unit.content, unit.label, highlights),
      retryText,
    ].filter(Boolean).join('\n\n');

    const text = await generateContentWithProvider(
      provider,
      config.systemPrompt,
      userPrompt,
      maxTokens,
    );
    clean = cleanGeneratedCode(text);

    if (config.postProcessCode) {
      clean = config.postProcessCode(clean);
    }

    let tsErrors = validateTypescript(clean);
    let modeErrors = config.validateGeneratedCode(clean);

    if (tsErrors.length > 0) {
      for (let repairAttempt = 0; repairAttempt < 2 && tsErrors.length > 0; repairAttempt += 1) {
        try {
          const repairedRaw = await repairTypescriptWithProvider(
            provider,
            clean,
            tsErrors,
            Math.max(maxTokens, 2600),
          );
          let repaired = cleanGeneratedCode(repairedRaw);
          if (config.postProcessCode) {
            repaired = config.postProcessCode(repaired);
          }
          const repairedTsErrors = validateTypescript(repaired);
          if (repairedTsErrors.length === 0) {
            clean = repaired;
            tsErrors = repairedTsErrors;
            modeErrors = config.validateGeneratedCode(clean);
            break;
          }
          clean = repaired;
          tsErrors = repairedTsErrors;
        } catch {
          // If repair fails, continue with normal retry loop.
          break;
        }
      }
    }

    lastErrors = [...tsErrors, ...modeErrors];

    if (lastErrors.length === 0) return clean;
    console.log(`  Retry ${attemptIndex + 1}/${maxTokenAttempts.length} for ${unit.outputRelativePath}: ${lastErrors[0]}`);
  }

  throw new Error(`Generated invalid TypeScript for ${unit.outputRelativePath}: ${lastErrors.join(' | ')}`);
}

export async function runGenerator(config: GenerationModeConfig): Promise<void> {
  const { filter, sectionFilter, listOnly, helpOnly } = parseArgs(process.argv.slice(2));
  const generationFailures: string[] = [];

  if (helpOnly) {
    console.log(`\nARB Generator (${config.mode})`);
    console.log('Usage: ts-node agent/generate-<mode>.ts [story-filter] [--section <text>] [--list]');
    console.log('--section: generate only feature sections matching provided text.');
    console.log('--list: show matching stories without generating files.\n');
    return;
  }

  if (!fs.existsSync(STORIES_DIR)) {
    console.error('\nuser-stories/ folder not found.\n');
    process.exit(1);
  }

  const storyFiles = fs.readdirSync(STORIES_DIR)
    .filter(file => file.endsWith('.md'))
    .filter(file => !filter || file.includes(filter));

  if (storyFiles.length === 0) {
    console.error(`\nNo user stories found${filter ? ` matching "${filter}"` : ''}.\n`);
    process.exit(1);
  }

  if (listOnly) {
    console.log(`\nStories (${storyFiles.length})`);
    for (const file of storyFiles) {
      console.log(`- ${file}`);
    }
    console.log('');
    return;
  }

  const provider = resolveProvider();
  fs.mkdirSync(config.outputDir, { recursive: true });

  console.log(`\nARB Spec Generator (${config.mode.toUpperCase()})`);
  console.log(`Using AI provider: ${provider === 'anthropic' ? `Anthropic (${ANTHROPIC_MODEL})` : `Google Gemini (${GOOGLE_MODELS.join(' -> ')})`}`);
  console.log(`Found ${storyFiles.length} feature file${storyFiles.length === 1 ? '' : 's'} in user-stories/\n`);

  for (const storyFile of storyFiles) {
    const storyPath = path.join(STORIES_DIR, storyFile);
    const content = fs.readFileSync(storyPath, 'utf-8');
    const lintErrors = lintStory(content);

    if (lintErrors.length > 0) {
      console.log(`Skipping ${storyFile} due to markdown issues:`);
      lintErrors.forEach(error => console.log(`  - ${error}`));
      continue;
    }

    const units = splitStoryUnits(content, storyFile, config.outputSuffix);
    const selectedUnits = sectionFilter
      ? units.filter(unit =>
        unit.label.toLowerCase().includes(sectionFilter.toLowerCase()) ||
        unit.outputRelativePath.toLowerCase().includes(sectionFilter.toLowerCase()))
      : units;
    console.log(
      `Reading ${storyFile} (${selectedUnits.length}/${units.length} section${selectedUnits.length === 1 ? '' : 's'} selected)`
    );

    if (sectionFilter && selectedUnits.length === 0) {
      console.log(`Skipping ${storyFile}: no sections matched --section "${sectionFilter}"`);
      continue;
    }

    if (units.length > 1) {
      const legacySingle = path.join(config.outputDir, `${storyFile.replace(/\.md$/i, '')}${config.outputSuffix}`);
      if (fs.existsSync(legacySingle)) {
        fs.unlinkSync(legacySingle);
      }
    }

    for (const unit of selectedUnits) {
      const outputPath = path.join(config.outputDir, unit.outputRelativePath);
      console.log(`Generating ${path.relative(path.resolve(__dirname, '..'), outputPath)} ...`);
      try {
        const code = await generateUnit(unit, storyFile, config, provider);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, `${code}\n`, 'utf-8');
        console.log(`Saved ${path.relative(path.resolve(__dirname, '..'), outputPath)}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        generationFailures.push(`${unit.outputRelativePath}: ${message}`);
        if (fs.existsSync(outputPath)) {
          console.warn(`Generation failed for ${unit.outputRelativePath}. Keeping existing file.`);
        } else {
          console.warn(`Generation failed for ${unit.outputRelativePath} and no existing file is available.`);
        }
      }
    }
  }

  if (generationFailures.length > 0) {
    console.warn('\nGeneration completed with warnings:');
    generationFailures.forEach(item => console.warn(`- ${item}`));
  }
  console.log('\nDone.\n');
}
