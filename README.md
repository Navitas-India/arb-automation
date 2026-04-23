# ARB Automation

> AI-powered test automation for the ARBenefits Member Portal.
> Built with [Playwright](https://playwright.dev) + [Passmark](https://github.com/bug0inc/passmark).

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

This installs Playwright, Passmark, and everything else the project needs.

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

## Step 3a — Get your API Keys

This project uses two AI services. You need one key from each. Both are free to obtain.

---

### Anthropic API Key (Claude)

Used by the **agent** (`npm run generate`) and **Passmark** to control the browser.

1. Go to **https://console.anthropic.com**
2. Sign in or create a free account
3. Click **API Keys** in the left sidebar
4. Click **Create Key**
5. Give it a name — e.g. `arb-automation`
6. Copy the key — it starts with `sk-ant-...`
7. Paste it in your `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
   ```

> ⚠️ You only see the key once. Copy it immediately before closing the page.

---

### Google API Key (Gemini)

Used by **Passmark** for multi-model assertion — it validates test results using both Claude and Gemini together for higher accuracy.

1. Go to **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **Create API Key**
4. Select **Create API key in new project**
5. Copy the key — it starts with `AIza...`
6. Paste it in your `.env`:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=AIzaxxxxxxxxxxxxxxxx
   ```

---

### Your final `.env` should look like this

```
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8085
TEST_ADMIN_EMAIL=murali.miriyala@navitastech.com
TEST_ADMIN_PASSWORD=Murali@123
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
GOOGLE_GENERATIVE_AI_API_KEY=AIzaxxxxxxxxxxxxxxxx
```

> ⚠️ Never share your API keys with anyone. Never commit them to Git. If you accidentally push them, tell your team lead immediately so the keys can be revoked.

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
├── tests/                     ← AUTO GENERATED — never edit these manually
│   ├── auth.spec.ts
│   ├── premium-matrix.spec.ts
│   ├── enrollment.spec.ts
│   └── threads.spec.ts
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
│   └── generate.ts            ← AI agent: reads stories → writes specs
│
├── test-data/                 ← Put Excel and test files here
│
├── .env.example               ← Copy this to .env and fill in values
├── playwright.config.ts       ← Playwright settings
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
| `npm run generate` | Read all user stories and generate test files |
| `npm run generate:one premium-matrix` | Generate tests for one feature only |
| `npm test` | Run all tests in parallel |
| `npm run test:headed` | Run tests with the browser visible on screen |
| `npm run test:auth` | Run only authentication tests |
| `npm run test:premium` | Run only Premium Matrix tests |
| `npm run test:enrollment` | Run only Enrollment tests |
| `npm run test:threads` | Run only Threads tests |
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

## Understanding Passmark (How AI Controls the Browser)

When you write a step like:

```
{ description: "Login with admin email and password" }
```

Passmark sends this to Claude (AI). Claude looks at the real browser screen, finds the email field and password field, types the credentials, and clicks Sign In — exactly like a human would.

You never write CSS selectors or element IDs. You just describe what a human would do.

**First run** — AI executes every step (takes 10–30 seconds per test)

**Repeat runs** — steps are cached (runs in 2–3 seconds per test)

**If the UI changes** — cached steps auto-heal by asking AI to find the new location

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

Every time you push to the `main` branch:

```
Push → GitHub Actions starts
     → Installs Node + browsers
     → npm run generate (generates all specs)
     → npm test (runs everything in parallel)
     → Publishes HTML report as downloadable artifact
     → Publishes Allure dashboard to GitHub Pages
```

You can see the results at:
`https://github.com/Navitas-India/arb-automation/actions`

---

## Common Errors and Fixes

### `ANTHROPIC_API_KEY not set`
You forgot to create your `.env` file or the key is missing.
```bash
cp .env.example .env
# then fill in ANTHROPIC_API_KEY
```

### `Cannot find module 'passmark'`
Dependencies not installed.
```bash
npm install
```

### `Timeout — waiting for element`
The app is not running locally. Make sure the backend (port 8085) and frontend (port 5173) are both started before running tests.

### `401 Unauthorised on all tests`
Your test credentials are wrong or the local server session has expired. Check `TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD` in your `.env`.

### `Error: net::ERR_CONNECTION_REFUSED`
The app is not running. Start the backend and frontend first.

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
