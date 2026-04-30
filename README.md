# ARB Automation

AI-assisted Playwright automation for ARBenefits, with markdown-driven spec generation for API and UI tests.

## Why This Repository Exists

This repository is designed to move test intent out of ad-hoc handwritten specs and into maintainable story documents.

- Product and QA intent is captured in markdown under `user-stories/`.
- Generator logic stays generic in `agent/`.
- Module-specific behavior (endpoints, status compatibility, data fixtures) stays in story contracts.
- Generated tests are treated as outputs, not primary authoring sources.

## Current Repository Snapshot

This README reflects the current codebase layout and scripts.

- Active story sources: `user-stories/usermanagement.md`, `user-stories/lettersmanagement.md`
- Active generator entrypoints:
  - `agent/generate-api.ts`
  - `agent/generate-ui.ts`
  - shared core: `agent/generator-core.ts`
- Active API specs are generated under `tests/api/<story-slug>/`
- Allure reporting is unified under `artifacts/reports/allure/`

## High-Level Architecture

```text
Story markdown (.md) -> generator-core parsing/splitting -> mode wrapper (API/UI)
-> LLM prompt build + validation loop -> generated Playwright spec files
-> Playwright execution -> HTML/JSON/Allure artifacts
```

Core responsibilities:

- `agent/generator-core.ts`: story discovery, feature section splitting, provider selection, retries, TS validation.
- `agent/generate-api.ts`: API-specific prompting and API code validation rules.
- `agent/generate-ui.ts`: UI-specific prompting and UI code validation rules.
- `fixtures/auth.ts`: URLs, credentials, API auth token helper.
- `scripts/*.ps1`: operational wrappers (`api:cycle`, module run + report open, report generation/opening, logging helper).

## Prerequisites

- Node.js 18+
- npm 9+
- Git

Install dependencies and browser:

```bash
npm install
npx playwright install chromium
```

## Environment Configuration

Create a local `.env` in repo root (there is no committed `.env.example` currently):

```env
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8085
TEST_ADMIN_EMAIL=<admin email>
TEST_ADMIN_PASSWORD=<admin password>
ANTHROPIC_API_KEY=<optional if using Anthropic>
GOOGLE_GENERATIVE_AI_API_KEY=<optional if using Google>
# optional override:
# AI_PROVIDER=google
```

Notes:

- API token helper posts to `${BACKEND_URL}/auth/signin` using `TEST_ADMIN_*`.
- If both AI keys are available, provider selection can be forced with `AI_PROVIDER`.

## Project Structure

```text
arb-automation/
├── agent/
│   ├── generate-api.ts
│   ├── generate-ui.ts
│   ├── generator-core.ts
│   └── GENERATOR_MODES.md
├── docs/
│   ├── guidelines-md-preparation.md
│   └── guidelines-rule-placement.md
├── fixtures/
│   ├── auth.ts
│   └── synthetic.ts
├── pages/
│   ├── BasePage.ts
│   └── LoginPage.ts
├── scripts/
│   ├── api-cycle.ps1
│   ├── allure-generate-run.ps1
│   ├── allure-open-latest.ps1
│   ├── run-api-and-open-allure.ps1
│   └── test-with-report.ps1
├── tests/
│   └── api/
├── user-stories/
│   ├── usermanagement.md
│   └── lettersmanagement.md
├── playwright.config.ts
└── package.json
```

## Generation Workflow

The generator reads markdown stories and emits Playwright specs.

- API mode writes to `tests/api/<story-slug>/*.api.spec.ts`
- UI mode writes to `tests/ui/*.spec.ts` (when UI generation is used)

Common usage:

```bash
# list matching stories only
npm run generate:api -- --list

# generate API specs for stories matching "usermanagement"
npm run generate:api -- usermanagement

# generate only one feature section from a multi-feature story
npm run generate:api -- usermanagement --section "Add HR Employee"

# generate UI specs (story filter optional)
npm run generate:ui -- usermanagement
```

Important:

- Prefer `generate:api` and `generate:ui` directly.
- `generate` in `package.json` is a legacy alias path and may not represent the current wrapper entrypoint.

## Where To Make Changes

Use this decision map to avoid drift:

- Change business/API behavior for one module -> edit `user-stories/*.md`.
- Change generic generation quality/safety rule -> edit `agent/generate-api.ts` or `agent/generate-ui.ts`.
- Change multi-step generation behavior (argument parsing, retries, section handling) -> edit `agent/generator-core.ts`.
- Change execution/report orchestration -> edit `scripts/*.ps1`.
- Avoid manually maintaining generated specs unless debugging a single run.

## Test Execution

```bash
# default API run + auto-open latest Allure run
npm test

# API run + auto-open latest Allure run
npm run test:api

# only UI project
npm run test:ui

# run one or more API modules (module names map to story slugs)
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/run-api-and-open-allure.ps1 -Modules usermanagement
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/run-api-and-open-allure.ps1 -Modules @('usermanagement','lettersmanagement') -Label prepush-check
```

`playwright.config.ts` currently defines:

- `ui` project -> `tests/ui`
- `api` project -> `tests/api`
- reporters: HTML, list, Allure, JSON

## Reporting (Allure)

Allure outputs are standardized:

- Raw results: `artifacts/reports/allure/results/latest`
- Latest generated report: `artifacts/reports/allure/latest`
- Archived runs: `artifacts/reports/allure/runs/`
- Per-run logs: `artifacts/reports/allure/logs/`
- Run index: `artifacts/reports/allure/run-index.jsonl`
- Latest run pointer: `.allure-latest`

Commands:

```bash
# generate latest report and open it
npm run report

# same as report (latest only, no archive)
npm run report:latest

# generate + archive timestamped run + open latest archived
npm run report:archive

# open latest archived (or fallback latest)
npm run allure:open:latest

# list archived runs
npm run allure:runs:list

# open specific run id
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/allure-open-latest.ps1 -RunId "<run-id>"
```

## One-Command API Cycle

`api:cycle` runs generation + API tests + report generation/opening.

```bash
# full story filter
npm run api:cycle -- usermanagement

# single spec execution after generation
npm run api:cycle -- usermanagement tests/api/usermanagement/usermanagement-add-member-profile.api.spec.ts
```

## Practical Run Recipes

```bash
# 1) Regenerate only one module section and test only that spec
npm run generate:api -- usermanagement --section "Add HR Employee"
npm run test:api -- tests/api/usermanagement/usermanagement-add-hr-employee.api.spec.ts
npm run report

# 2) Run existing API specs without regeneration (faster signal)
npm run test:api
npm run report:latest

# 3) Full API cycle with archived run label
npm run api:cycle -- usermanagement
npm run report:archive
```

## Story Authoring Guidance

For reliable generation quality, use the maintained docs:

- `docs/guidelines-md-preparation.md`
- `docs/guidelines-rule-placement.md`

These capture:

- how to structure module sections in markdown
- what belongs in generator code vs story contracts
- how to encode module-specific behavior using text-only `Generator Contract` sections

## Troubleshooting Quick Map

- `Missing required AI key` -> set `ANTHROPIC_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`.
- `No sections matched --section` -> verify exact feature heading text in story file.
- Test status mismatch failures (expected vs received HTTP code) -> update module contract compatibility set in story markdown first.
- Report opens stale content -> clear old artifacts, run tests, then `npm run report:latest`.
- API auth failures (`401` on all tests) -> verify `BACKEND_URL`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`.

## CI Notes

Workflow file: `.github/workflows/playwright.yml`

- Runs on push (`main`, `develop`) and PR (`main`)
- Installs dependencies and Playwright browser
- Runs generation, API tests, UI tests
- Uploads Playwright report and result artifacts
- Posts PR test summary
- Publishes Allure report to GitHub Pages on `main`

## Operational Rules

- Do not commit secrets (`.env` is ignored).
- Treat generated specs as generated artifacts; prefer updating story markdown and generator rules over manual patching generated files.
- Keep module-specific API behavior in story markdown contracts, not hardcoded into generic generator logic.
- Prefer working on integration branch flow (avoid direct `main` development commits).
