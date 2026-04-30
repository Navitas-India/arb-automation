# Generator Modes

The generator supports two modes with shared core logic:

- `UI` mode writes specs to `tests/ui/`
- `API` mode writes specs to `tests/api/`

Use scripts:

- `npm run generate` (default UI mode)
- `npm run generate:ui`
- `npm run generate:api`

Optional args for both wrappers:

- `npm run generate:ui -- premium-matrix` (filter by story filename)
- `npm run generate:api -- --list` (story discovery only, no generation)

## Expected Story Sections

The markdown can be free-form, but generation quality is best when these sections exist.

### UI Story (recommended)

- `# <Feature Title>`
- `## Navigation` (only when module-specific navigation/preconditions are needed)
- `## Runtime Notes` (optional)
- `## Acceptance Criteria`
- `## Negative / Validation Cases` (optional but recommended)

UI mode only uses navigation or precondition details if they are explicitly present in the story.

### API Story (recommended)

- `# <Feature Title>`
- `## Endpoint` (method + path)
- `## Request` (payload/query/path params)
- `## Expected Success Response`
- `## Validation / Error Cases`
- `## Auth` (state whether auth is required)

API mode generates deterministic Playwright API tests with `APIRequestContext`, includes a happy path and a negative path, and asserts status codes plus key response fields.

## Recommended API Run Pattern

- For large stories with many features, prefer module-focused validation first:
  - `npm run generate:api -- usermanagement`
  - `npm run test:api -- tests/api/usermanagement-add-member-profile.api.spec.ts`
- For one-command automation (generate + test + Allure latest):
  - Full API set: `npm run api:cycle -- usermanagement`
  - Single module: `npm run api:cycle -- usermanagement tests/api/usermanagement-add-member-profile.api.spec.ts`

## Sample Snippets

### UI Story snippet

```md
# Add Member Profile

## Navigation
- After login, open User Management and select Add Member Profile.

## Acceptance Criteria
- Admin can save a valid member profile.

## Negative / Validation Cases
- Save should show required-field validation when mandatory fields are missing.
```

### API Story snippet

```md
# Create Enrollment Draft

## Endpoint
- POST /api/admin-portal/enrollment/drafts

## Request
- Requires memberId and effectiveDate.

## Expected Success Response
- Returns 201 with draftId and status.

## Validation / Error Cases
- Missing effectiveDate returns 400 with field error.

## Auth
- Requires bearer token.
```
