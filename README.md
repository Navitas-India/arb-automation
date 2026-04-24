# ARB Automation

> Playwright test automation for the ARBenefits Member Portal.
> Built with [Playwright](https://playwright.dev) — UI tests + API tests, zero ongoing AI cost.

---

## What is this project?

This project automatically tests the ARBenefits portal — the healthcare benefits system used by Arkansas state employees.

You do **not** write code to test the app. You write **plain English user stories**. An AI agent reads your stories and generates the test code for you. Playwright then runs those tests against the real application.

**Your job as an intern:**
1. Understand a feature
2. Write a user story describing what should happen
3. Run one command — tests are generated and executed automatically

---

## Before You Start

### What you need on your laptop

| Tool | Version | How to check |
|------|---------|--------------|
| Node.js | 18 or higher | `node --version` |
| npm | 9 or higher | `npm --version` |
| Git | Any | `git --version` |

If any of these are missing, ask your team lead to help you install them.

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/Navitas-India/arb-automation.git
cd arb-automation
```

---

## Step 2 — Install dependencies

```bash
npm install
```

This installs Playwright and everything else the project needs.

Then install the browsers Playwright uses:

```bash
npx playwright install chromium
```

---

## Step 3 — Set up your environment file

Copy the example file:

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

```
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8085
TEST_ADMIN_EMAIL=murali.miriyala@navitastech.com
TEST_ADMIN_PASSWORD=Murali@123
ANTHROPIC_API_KEY=<your key — see below>
GOOGLE_GENERATIVE_AI_API_KEY=<your key — see below>
```

> ⚠️ Never commit your `.env` file. It is already in `.gitignore` so Git will ignore it automatically.


---

## Step 4 — Add your test data files

Place these files in the `test-data/` folder:

| File | What it is |
|------|-----------|
| `matrix_2026.xlsx` | A valid Premium Matrix Excel file for year 2026 |
| `invalid.pdf` | Any PDF file — used to test that the app rejects wrong formats |

Ask your team lead for these files if you don't have them.

---

## Project Structure

```
arb-automation/
│
├── user-stories/              ← YOU WRITE HERE — plain English .md files
│   ├── auth.md
│   ├── premium-matrix.md
│   ├── enrollment.md
│   └── threads.md
│
├── tests/
│   ├── ui/                    ← AUTO GENERATED browser tests (Passmark + Chrome)
│   │   ├── auth.spec.ts
│   │   ├── premium-matrix.spec.ts
│   │   ├── enrollment.spec.ts
│   │   └── threads.spec.ts
│   │
│   └── api/                   ← Pure API tests (no browser, direct HTTP)
│       ├── auth.api.spec.ts
│       ├── premium-matrix.api.spec.ts
│       ├── enrollment.api.spec.ts
│       └── threads.api.spec.ts
│
├── pages/                     ← Page Object helpers (senior dev maintains)
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   └── PremiumMatrixPage.ts
│
├── fixtures/
│   └── auth.ts                ← Shared login and token helper
│
├── agent/
│   └── generate.ts            ← AI agent: lints stories → generates ui specs
│
├── test-data/                 ← Put Excel and test files here
│
├── .github/
│   ├── workflows/
│   │   └── playwright.yml     ← CI/CD: runs on every push + PR
│   └── ISSUE_TEMPLATE/
│       └── bug_report.md      ← Template for reporting test failures
│
├── .env.example               ← Copy this to .env and fill in values
├── playwright.config.ts       ← Two projects: ui + api
└── package.json               ← All available commands
```

---

## How to Write a User Story

User stories live in the `user-stories/` folder. Each feature has its own `.md` file.

Every user story must follow this format exactly:

```markdown
# Feature Name

## As
Who is using this feature

## I want to
What action they want to perform

## So that
Why they are doing it / what the outcome is

## Acceptance Criteria
- What should happen when everything goes right
- List each expected outcome as a bullet point

## Negative Cases
- What should happen when something goes wrong
- Wrong input → expected error
- Missing auth → expected HTTP status
```

### Real example

```markdown
# Premium Matrix Upload

## As
An EBD Staff member (Administrator)

## I want to
Upload a Premium Matrix Excel file for a specific plan year

## So that
Members can see the correct monthly premium amounts for their health plan

## Acceptance Criteria
- I can navigate to the Premium Matrix section after logging in
- I can upload a valid Excel file and select the plan year
- After clicking Upload I see a success confirmation
- The uploaded data is visible in the table when I filter by that year

## Negative Cases
- Upload without logging in → 401 Unauthorised
- Upload a PDF or non-Excel file → validation error about file format
- Upload with mismatched year → year mismatch error
```

---

## Available Commands

| Command | What it does |
|---------|-------------|
| `npm run generate` | Lint + generate UI spec files from all user stories |
| `npm run generate:one premium-matrix` | Generate spec for one feature only |
| `npm test` | Run ALL tests (UI + API) in parallel |
| `npm run test:ui` | Run browser tests only (Passmark + Chrome) |
| `npm run test:api` | Run API tests only (no browser, fast) |
| `npm run test:headed` | Run browser tests with Chrome visible on screen |
| `npm run test:debug` | Run tests in debug mode step by step |
| `npm run report` | Open the Playwright HTML report |
| `npm run allure:report` | Generate and open the Allure dashboard |

---

## Your Daily Workflow

```
1. Pull latest changes
   git pull origin main

2. Write or update a user story
   Edit a file in user-stories/

3. Generate the test
   npm run generate

4. Run the tests
   npm test

5. Check the results
   npm run report

6. Push your user story
   git add user-stories/your-file.md
   git commit -m "add user story: [feature name]"
   git push
```

> ⚠️ Never push files from the `tests/` folder. Those are auto-generated and will be recreated by the agent.

---

## Understanding Test Results

After running `npm test` you will see output like this:

```
✓ Auth › Admin can login with valid credentials (3.2s)
✓ Auth › Login fails with wrong password (1.8s)
✗ Premium Matrix › Upload valid matrix for 2026 (FAILED)
```

**Green ✓** = test passed — the feature is working correctly

**Red ✗** = test failed — something is broken

To see exactly what failed:
```bash
npm run report
```

This opens a browser with screenshots, videos, and step-by-step details of every test.

---

## How Tests Work

**UI tests** — Playwright opens a real Chrome browser, navigates, clicks, fills forms and checks results. No AI involved during test execution. Zero cost to run.

**API tests** — Playwright sends HTTP requests directly to the backend. No browser. Fastest and cheapest tests.

**Agent** (`npm run generate`) — Claude reads your user story once and writes the test code. This is the only time AI is used. Cost is minimal (~$0.05 per story). After that, running the tests costs nothing.

```
Cost breakdown:
npm run generate  → Claude API called once per story  → ~$0.05
npm run test:api  → No AI, pure HTTP                  → FREE
npm run test:ui   → No AI, pure Playwright browser    → FREE
```

---

## Work Division — 3 Interns

| Intern | Features to own | User story files |
|--------|----------------|-----------------|
| **Intern 1** | Authentication + Member profile | `auth.md` |
| **Intern 2** | Premium Matrix + Pay Period Matrix | `premium-matrix.md` |
| **Intern 3** | Enrollment + Threads | `enrollment.md`, `threads.md` |

Each intern:
- Owns their user story files
- Writes and updates them as features change
- Runs `npm run generate` after every change
- Is responsible for keeping their tests green

---

## Adding a New Feature

When a new feature is built on the portal:

1. Create a new file in `user-stories/`
   ```bash
   touch user-stories/member-search.md
   ```

2. Write the user story following the format above

3. Generate the test
   ```bash
   npm run generate:one member-search
   ```

4. Run to verify
   ```bash
   npm run test:headed
   ```

5. Commit only the user story file
   ```bash
   git add user-stories/member-search.md
   git commit -m "add user story: member search"
   git push
   ```

CI/CD will automatically generate the spec and run it on GitHub.

---

## CI/CD — What Happens on GitHub

Every time you push to the `main` branch or raise a PR:

```
Push / PR → GitHub Actions starts
          → Installs Node + Playwright browsers
          → npm run generate  (lints stories + generates UI specs)
          → npm run test:api  (runs all API tests — fast, no browser)
          → npm run test:ui   (runs all browser tests via Passmark)
          → Publishes HTML report as downloadable artifact
          → Posts test summary comment on PR (✅ passed / ❌ failed)
          → Publishes Allure dashboard to GitHub Pages (main only)
```

- See CI runs: `https://github.com/Navitas-India/arb-automation/actions`
- See Allure dashboard: `https://navitas-india.github.io/arb-automation`

> ⚠️ Branch protection is enabled on `main`. You cannot push directly — you must raise a PR and get 1 approval. Tests must pass before merging.

---

## Common Errors and Fixes

### `ANTHROPIC_API_KEY not set`
You forgot to create your `.env` file or the key is missing.
```bash
cp .env.example .env
# then fill in ANTHROPIC_API_KEY — ask your team lead
```

### `Cannot find module 'passmark'`
Dependencies not installed.
```bash
npm install
```

### `Missing section: "## Negative Cases"`
Your user story is missing a required section. The agent will not generate until fixed.
Open the `.md` file and add the missing section — see the format above.

### `Timeout — waiting for element`
The app is not running locally. Make sure backend (port 8085) and frontend (port 5173) are both started.

### `401 Unauthorised on all API tests`
Test credentials are wrong or the session expired. Check `TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD` in your `.env`.

### `Error: net::ERR_CONNECTION_REFUSED`
The app is not running. Start backend and frontend first.

### PR is blocked — cannot merge
Either tests are failing in CI or you need 1 reviewer approval. Fix the failing tests first, then ask your team lead to review.

---

## Rules

1. **Never edit files in `tests/`** — they are auto-generated and will be overwritten
2. **Never commit `.env`** — it contains secrets
3. **One feature per user story file** — keep them focused
4. **Always pull before you push** — `git pull origin main` first
5. **Run tests before pushing** — make sure nothing is broken

---

## Need Help?

- Tests failing? Run `npm run report` and look at the screenshot
- Not sure how to write a user story? Look at the examples in `user-stories/`
- Something broken in the setup? Ask your team lead

---

*ARBenefits Automation — Navitas India*
