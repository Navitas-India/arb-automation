# HEBA Letters Template Management - Test Specification

## Overview

This document defines functional behavior and test scenarios for the HEBA Letters module, covering:
- Layout Templates listing and management
- Content Templates listing and management
- Create, edit, clone, archive, and view archived flows
- Template upload, preview, and attachment behavior

## Related API Endpoints

- `POST /letter-templates/layout` - Create layout template
- `GET /letter-templates/layout` - List active layout templates
- `PUT /letter-templates/layout/{id}` - Update layout template (API source example path: `PUT /letter-templates/layout/371`)
- `POST /letter-templates/content` - Create content template
- `GET /letter-templates/content` - List active content templates
- `PUT /letter-templates/content/{id}` - Update content template (API source example path: `PUT /letter-templates/content/374`)
- `POST /letter-templates/{id}/copy` - Clone template (layout/content)
- `PUT /letter-templates/{id}/archive` - Archive template (layout/content)
- `GET /letter-templates/layout/archived` - List archived layout templates
- `GET /letter-templates/content/archived` - List archived content templates
- `GET /letter-templates/layout/names` - Get layout names for content-template selection
- `PUT /letter-templates/{id}/finalize` - Finalize content template
- `GET /letter-templates/attachments/{id}/preview` - Preview template attachment
- `GET /letter-templates/attachments/{id}/download` - Download attachment
- `POST /letter-templates/{id}/preview-from-layout` - Generate preview/PDF from layout + content body
- `POST /letter-templates/{id}/preview-from-content` - Generate preview/PDF from content template
- `POST /letter-templates/{id}/preview-html` - Generate HTML preview
- `POST /convert/word-html` - Convert Word file to HTML
- `POST /convert/pdf-html` - Convert PDF file to HTML

## Navigation Paths

### Communications Landing
- Home -> System Administration -> Communications Management

### Letters Template Management
- Home -> System Administration -> Communications Management -> Letters Template Management

### Layout Template Create
- Letters Template Management -> Layout Templates tab -> Create New Layout Template

### Content Template Create
- Letters Template Management -> Content Templates tab -> Create New Content Template

### Archived Views
- Letters Template Management -> (Layout or Content tab) -> View Archived Templates

## Runtime Preconditions (Observed)

- User must have permission to access System Administration and Communications Management.
- Letters page loads with `Layout Templates` selected by default.
- Table actions are row-sensitive (actions differ for active vs archived rows).
- File upload control accepts document upload interactions; drag-and-drop behavior may vary by template type.

## Observed HAR Evidence (2026-04-30)

Source captures provided in `HEBA/letters HAR`:

- `Layout list_archive_copy.amazona`
- `create_edit_layout template.amazona`
- `Content_list _archive_copy_attachment_preview_download.amazona`
- `Create_Edit content (including file upload).amazona`

Observed runtime endpoint behavior:

- `GET /api/letter-templates/layout` -> `200`
- `PUT /api/letter-templates/{id}/archive` -> `200` (request body observed as `{"id":<id>}`)
- `POST /api/letter-templates/{id}/copy` -> `200` (request body observed as `{"id":<id>}`)
- `PUT /api/letter-templates/{id}/finalize` -> `200`
- `POST /api/letter-templates/layout` (multipart create) -> observed `500` (internal error) and `400` (duplicate name), depending on payload/content
- `PUT /api/letter-templates/layout/{id}` (multipart update) -> `200`
- `GET /api/letter-templates/{id}/attachments` -> `200`
- `GET /api/letter-templates/content` -> `200`
- `POST /api/letter-templates/{id}/preview-from-content` -> `200` (PDF response)
- `GET /api/letter-templates/attachments/{id}/preview` -> `200`
- `POST /api/letter-templates/{id}/preview-from-layout` -> `200` (PDF response)
- `PUT /api/letter-templates/content/{id}` -> `200`
- `GET /api/letter-types/tags` -> `200`
- `GET /api/batch-jobs/jobs-list-by-status?status=ACTIVE` -> `200`

Observed payload patterns:

- Layout create/update used multipart fields: `layout`, `headerTitle`, `footer`, `headerFields`, `logo`.
- Content update used multipart fields: `templateMetadata`, `templateContent`.
- Preview endpoints used multipart fields: `contentBody`, `variables`, and (for preview-from-layout) `files`.

Not observed in these captures:

- `POST /api/convert/word-html`
- `POST /api/convert/pdf-html`
- `GET /api/letter-templates/attachments/{id}/download`

---

## Field Rules

**Default Requirement Rule**: All fields are **required** unless explicitly optional in the UI.

### General Validation Rules

- Date fields use date-picker input and must follow valid date semantics.
- If "This template will expire" is selected, Expiration Date is required.
- If "This template won't expire" is selected, expiration date is hidden/unused.
- Upload constraints observed in QA notes:
  - Supported types: `.pdf`, `.doc`, `.docx`
  - Maximum size: 4 MB

### UI Validation Semantics

- Validation messages appear after interaction (blur) or submit/continue action.
- Continue/Save should remain blocked while required fields are invalid or missing.
- Archive/Clone are modal-confirmed operations with explicit cancel/confirm actions.

## API Assertion Policy (Generator Baseline)

Use this policy for all generated API tests in this module.

### Happy Path Assertions (All Endpoints)

1. Assert exact HTTP status `200`.
2. Assert response is valid JSON object because source contract examples are `{}`.
3. Do not assert undocumented body keys such as `message`, `status`, `data`, `id` unless endpoint contract explicitly defines them.
4. For list endpoints, if runtime returns array/object wrappers, assert only container type + HTTP status (do not overfit field-level schema unless documented).

### Negative Path Assertions (Industry-Default with Safe Fallback)

When contract is silent, use this default expectation order:

- Authentication missing/invalid token:
  - Preferred: `401`
  - Acceptable alternative: `403`
- Authorization/role restriction:
  - Preferred: `403`
- Non-existent resource id:
  - Preferred: `404`
- Duplicate/semantic conflict:
  - Preferred: `409`
- Validation failure (missing/invalid required fields):
  - Preferred: `400` or `422`
- Unsupported file type:
  - Preferred: `415`
- File too large:
  - Preferred: `413`

**Test implementation rule**:
- First pass strict mode: assert preferred status.
- If environment behavior differs but is still standards-compliant, keep endpoint in compatibility mode and assert status belongs to an allowed set (for example, auth: `[401, 403]`, validation: `[400, 422]`) plus response indicates failure semantics.

---

## Feature 1: Letters Template Management Landing and Tabs

### Navigation
Home -> System Administration -> Communications Management -> Letters Template Management

### Behavior
- Layout tab is selected by default on page load.
- Switching tabs changes list context:
  - Layout tab shows layout templates only
  - Content tab shows content templates only
- Create button label changes by selected tab:
  - Create New Layout Template
  - Create New Content Template
- View Archived Templates opens archived list for the current tab context.

### Test Scenarios (ID: TC-LTM-*)

#### TC-LTM-001: Default Tab Selection
- **Type**: Validation
- **Priority**: High
- **Steps**: Open Letters Template Management
- **Expected**: Layout Templates tab is selected by default

#### TC-LTM-002: Tab Switching State
- **Type**: Happy Path
- **Priority**: High
- **Steps**: Switch from Layout to Content and back
- **Expected**: Correct list data appears for each selected tab

#### TC-LTM-003: Create Button Context
- **Type**: Validation
- **Priority**: High
- **Steps**: Observe create button text on each tab
- **Expected**: Button text and navigation target match selected tab

#### TC-LTM-004: Archived Navigation Context
- **Type**: Business Rule
- **Priority**: High
- **Steps**: Click View Archived Templates on each tab
- **Expected**: Archived list corresponds to current tab type

---

## Feature 2: Manage Layout Templates

### Navigation
Letters Template Management -> Layout Templates

### Listing Expectations
- Table columns include template metadata (name, created/updated fields, effective/expiry, status, actions).
- Status tooltip icon appears near Status header and is readable on hover.
- Template name is clickable (view/open behavior based on state).

### Row Actions
- Edit
- Copy
- Print/Preview
- Archive

### API Endpoint Contract (Layout Listing + Actions)

- **Primary list endpoint**: `GET /letter-templates/layout`
- **Archive list endpoint**: `GET /letter-templates/layout/archived`
- **Archive action endpoint**: `PUT /letter-templates/{id}/archive`
- **Copy action endpoint**: `POST /letter-templates/{id}/copy`

### API Success Criteria (Layout Listing + Actions)

- `GET /letter-templates/layout` returns HTTP `200`.
- `GET /letter-templates/layout/archived` returns HTTP `200`.
- `PUT /letter-templates/{id}/archive` returns HTTP `200`.
- `POST /letter-templates/{id}/copy` returns HTTP `200`.
- Response body examples in API source are `{}`; assert response is a JSON object.

### API Negative Cases (Layout Listing + Actions)

- Missing/invalid bearer token should return `401` (or `403` if gateway-enforced).
- Invalid template id for archive/copy should return `404`.

### Generator Contract

For this feature, generate 8 API tests focused only on layout-listing and row-action behavior.
Allowed endpoints:
- `GET /api/letter-templates/layout`
- `GET /api/letter-templates/layout/archived`
- `PUT /api/letter-templates/{id}/archive`
- `POST /api/letter-templates/{id}/copy`
Do not include content-template create/update endpoints in this feature.
Use authenticated requests for all happy-path calls.
Status policy:
- listing/archive-list/copy/archive success: `200`
- missing/invalid auth: prefer `401`, allow `403`
- invalid id on copy/archive: `404`
For response assertions, prefer HTTP status + JSON container/object checks only unless specific keys are explicitly documented.

### Test Scenarios (ID: TC-LYT-*)

#### TC-LYT-001: Layout Table and Columns
- **Type**: Validation
- **Priority**: High
- **Expected**: Layout table headers and row metadata render correctly

#### TC-LYT-002: Archive Confirmation Modal
- **Type**: Business Rule
- **Priority**: High
- **Expected**: Archive modal appears with Cancel and Archive actions

#### TC-LYT-003: Archive Success Flow
- **Type**: Happy Path
- **Priority**: High
- **Expected**: Archived row disappears from active list and appears in archived list

#### TC-LYT-004: Copy Layout Template
- **Type**: Happy Path
- **Priority**: High
- **Expected**: Clone modal allows editable name; clone creates new Draft row

#### TC-LYT-005: View Archived Layouts
- **Type**: Validation
- **Priority**: High
- **Expected**: Archived list shows archived rows in view-only context

---

## Feature 3: Create and Edit Layout Template

### Navigation
Letters Template Management -> Layout Templates -> Create New Layout Template

### Form Sections
- Name
- Effective Date
- Expiration option (will expire / won't expire)
- Expiration Date (conditional)
- Choose Logo upload
- Header Title (rich text)
- Header Fields (rich text)
- Footer Fields (rich text)

### Actions
- Cancel
- Continue (save/proceed)

### Business Rules

1. Continue remains disabled until required fields are valid.
2. Expiration date is required only when "will expire" is selected.
3. Edit keeps template identity and archives previous version where applicable.
4. Save success shows confirmation notification.

### API Endpoint Contract (Layout Create/Edit)

- **Create endpoint**: `POST /letter-templates/layout`
- **Update endpoint**: `PUT /letter-templates/layout/{id}`

**Required request fields (POST /letter-templates/layout and PUT /letter-templates/layout/{id})**:
- `string`: `layout`
- `string`: `headerTitle`
- `string`: `footer`
- `string(binary)`: `logo`
- `string`: `headerFields`

### API Success Criteria (Layout Create/Edit)

- `POST /letter-templates/layout` returns HTTP `200` when accepted in happy path.
  - Compatibility note from HAR: create attempts also returned `400` (duplicate name) and `500` (internal server error) in specific payload variants.
- `PUT /letter-templates/layout/{id}` returns HTTP `200`.
- Response body contract in API source is `{}`.

### API Negative Cases (Layout Create/Edit)

- Missing required multipart/body field returns `400` or `422`.
- Invalid logo file type returns `415`.
- Oversize logo file returns `413`.
- Invalid/missing bearer token returns `401` (or `403` if gateway-enforced).

### Generator Contract

For this feature, generate 10 API tests focused on layout create/edit and multipart validation.
Allowed endpoints:
- `POST /api/letter-templates/layout`
- `PUT /api/letter-templates/layout/{id}`
Optional setup endpoint allowed for validation of created entities:
- `GET /api/letter-templates/layout`
Status policy:
- create/update success: `200`
- duplicate-name create attempts: `400`
- unstable server behavior on create: allow `500` compatibility when environment reproduces HAR-observed internal error
- missing required fields: prefer `400`, allow `422`
- invalid logo type: `415`
- oversize logo: `413`
- missing/invalid auth: prefer `401`, allow `403`
File tests must be isolated from business-rule tests so failures are attributable to upload constraints.
Use unique template names per run to avoid duplicate-name conflicts.

### Test Scenarios (ID: TC-CLY-*)

#### TC-CLY-001: Required Fields Enforcement
- **Type**: Validation
- **Priority**: High
- **Expected**: Continue blocked until all required fields are provided

#### TC-CLY-002: Expiration Toggle Behavior
- **Type**: Business Rule
- **Priority**: High
- **Expected**: Expiration field visibility/requirement changes by radio selection

#### TC-CLY-003: Valid Create Layout
- **Type**: Happy Path
- **Priority**: High
- **Expected**: Layout template is created successfully

#### TC-CLY-004: Edit Existing Layout
- **Type**: Happy Path
- **Priority**: High
- **Expected**: Template updates persist and previous version handling follows design

---

## Feature 4: Manage Content Templates

### Navigation
Letters Template Management -> Content Templates

### Listing Expectations
- Content template table shows metadata columns and status values.
- Row actions include edit/copy/print/view attachment/archive (as applicable per row state).
- Print/Preview opens read-only preview with attachment controls (download/back).

### API Endpoint Contract (Content Listing + Actions)

- **Primary list endpoint**: `GET /letter-templates/content`
- **Archive list endpoint**: `GET /letter-templates/content/archived`
- **Archive action endpoint**: `PUT /letter-templates/{id}/archive`
- **Copy action endpoint**: `POST /letter-templates/{id}/copy`
- **Attachment preview endpoint**: `GET /letter-templates/attachments/{id}/preview`
- **Attachment download endpoint**: `GET /letter-templates/attachments/{id}/download`
- **Finalize endpoint (observed in content list flow)**: `PUT /letter-templates/{id}/finalize`

### API Success Criteria (Content Listing + Actions)

- All endpoints above return HTTP `200` in happy path.
- Response body examples in API source are `{}`; assert status + JSON object contract.
- HAR note: `GET /letter-templates/attachments/{id}/preview` was observed as `200`; attachment download endpoint is contract-listed but not observed in provided captures.

### API Negative Cases (Content Listing + Actions)

- Invalid/missing bearer token returns `401` (or `403` if gateway-enforced).
- Invalid `id` for row-action endpoints returns `404`.

### Generator Contract

For this feature, generate 9 API tests focused on content listing, archived listing, copy/archive, and attachment access.
Allowed endpoints:
- `GET /api/letter-templates/content`
- `GET /api/letter-templates/content/archived`
- `PUT /api/letter-templates/{id}/archive`
- `POST /api/letter-templates/{id}/copy`
- `GET /api/letter-templates/attachments/{id}/preview`
- `GET /api/letter-templates/attachments/{id}/download`
- `PUT /api/letter-templates/{id}/finalize`
Status policy:
- happy path for all endpoints above: `200`
- missing/invalid auth: prefer `401`, allow `403`
- invalid id: `404`
Do not include create/update content endpoints in this feature; keep scope to list/actions/attachment/finalize behavior only.
For response assertions, prefer status + JSON container/object checks unless endpoint response schema is explicitly defined.

### Test Scenarios (ID: TC-CTM-*)

#### TC-CTM-001: Content Tab Listing
- **Type**: Validation
- **Priority**: High
- **Expected**: Content templates and metadata render correctly

#### TC-CTM-002: Content Clone Flow
- **Type**: Happy Path
- **Priority**: High
- **Expected**: Clone modal creates Draft copy with new identity

#### TC-CTM-003: Content Archive Flow
- **Type**: Happy Path
- **Priority**: High
- **Expected**: Archived template moves to archived content list

#### TC-CTM-004: View Attachment Flow
- **Type**: Validation
- **Priority**: Medium
- **Expected**: Attachment preview opens read-only; download works

#### TC-CTM-005: Archived Content View
- **Type**: Business Rule
- **Priority**: High
- **Expected**: Archived content opens in read-only mode with copy allowed

---

## Feature 5: Create and Edit Content Template

### Navigation
Letters Template Management -> Content Templates -> Create New Content Template

### Form Sections
- Name
- Description or Purpose
- Effective Date
- Expiration option and conditional Expiration Date
- Batch print selection (Yes/No)
- Select Layout Template
- Upload Content Template document
- Attachment include toggle + Upload Attachment (conditional)

### Actions
- Cancel
- Continue

### Business Rules

1. Layout template selection must use available layout names.
2. Batch-enabled flows apply batch naming and validation rules.
3. Upload supports `.pdf`, `.doc`, `.docx` with max file size 4 MB.
4. Attachment section behavior depends on include-attachment selection.

### API Endpoint Contract (Content Create/Edit + Helpers)

- **Create endpoint**: `POST /letter-templates/content`
- **Update endpoint**: `PUT /letter-templates/content/{id}`
- **Layout-name lookup endpoint**: `GET /letter-templates/layout/names`
- **Tag lookup endpoint (observed)**: `GET /letter-types/tags`
- **Batch jobs lookup endpoint (observed)**: `GET /batch-jobs/jobs-list-by-status?status=ACTIVE`
- **Word conversion endpoint**: `POST /convert/word-html`
- **PDF conversion endpoint**: `POST /convert/pdf-html`

**Required request fields (POST /letter-templates/content)**:
- `string`: `templateMetadata`
- `string(binary)`: `files`
- `string`: `templateContent`

**Required request fields (PUT /letter-templates/content/{id})**:
- `string`: `templateMetadata`
- `string`: `templateContent`

### API Success Criteria (Content Create/Edit + Helpers)

- `POST /letter-templates/content` returns HTTP `200`.
- `PUT /letter-templates/content/{id}` returns HTTP `200`.
- `GET /letter-templates/layout/names` returns HTTP `200`.
- `GET /letter-types/tags` returns HTTP `200` (observed).
- `GET /batch-jobs/jobs-list-by-status?status=ACTIVE` returns HTTP `200` (observed).
- `POST /convert/word-html` expected `200` when exercised (not observed in provided HARs).
- `POST /convert/pdf-html` expected `200` when exercised (not observed in provided HARs).
- Response body contract in API source is `{}`.

### API Negative Cases (Content Create/Edit + Helpers)

- Missing one required field in create/update payload returns `400` or `422`.
- Invalid file type returns `415`.
- Oversize document (> 4 MB) returns `413`.
- Missing/invalid bearer token returns `401` (or `403` if gateway-enforced).

### Generator Contract

For this feature, generate 12 API tests covering content create/edit and conversion helpers.
Allowed endpoints:
- `POST /api/letter-templates/content`
- `PUT /api/letter-templates/content/{id}`
- `GET /api/letter-templates/layout/names`
- `GET /api/letter-types/tags`
- `GET /api/batch-jobs/jobs-list-by-status?status=ACTIVE`
- `POST /api/convert/word-html`
- `POST /api/convert/pdf-html`
Status policy:
- create/update/layout-name lookup/conversion happy path: `200`
- tag lookup and batch-jobs lookup happy path: `200`
- missing required fields: prefer `400`, allow `422`
- invalid file type: `415`
- oversize file: `413`
- missing/invalid auth: prefer `401`, allow `403`
Multipart tests should use deterministic fixture file paths and keep one failure reason per test (type vs size vs missing field).
Use unique template names per run for create operations.

### Test Scenarios (ID: TC-CCT-*)

#### TC-CCT-001: Required Field Validation
- **Type**: Validation
- **Priority**: High
- **Expected**: Continue blocked with field validations for missing required inputs

#### TC-CCT-002: Batch Toggle Behavior
- **Type**: Business Rule
- **Priority**: High
- **Expected**: Batch-specific fields and name behavior switch correctly for Yes/No

#### TC-CCT-003: Upload Validation
- **Type**: Validation
- **Priority**: High
- **Expected**: Invalid type/size rejected; valid file accepted and processed

#### TC-CCT-004: Create Content Template Success
- **Type**: Happy Path
- **Priority**: High
- **Expected**: Content template is created and listed with expected status

#### TC-CCT-005: Include Attachment Behavior
- **Type**: Business Rule
- **Priority**: Medium
- **Expected**: Attachment upload section appears and enforces one-file behavior when enabled

---

## Feature 6: Preview and Finalize

### Behavior
- Preview opens in read-only context.
- Finalize persists final metadata/state for selected content template.

### API Endpoint Contract (Preview + Finalize)

- `POST /letter-templates/{id}/preview-from-layout`
- `POST /letter-templates/{id}/preview-from-content`
- `POST /letter-templates/{id}/preview-html`
- `PUT /letter-templates/{id}/finalize`

### API Success Criteria (Preview + Finalize)

- All endpoints above return HTTP `200` in happy path.
- HAR note: preview endpoints returned PDF payloads with HTTP `200` (`Content-Type: application/pdf`); finalize returned JSON with `200`.
- For preview assertions, allow content-type checks in addition to status.

### API Negative Cases (Preview + Finalize)

- Missing required request fields for preview/finalize returns `400` or `422`.
- Invalid template id for preview/finalize returns `404`.
- Invalid/missing bearer token returns `401` (or `403` if gateway-enforced).

### Generator Contract

For this feature, generate 8 API tests focused on preview and finalize behavior only.
Allowed endpoints:
- `POST /api/letter-templates/{id}/preview-from-layout`
- `POST /api/letter-templates/{id}/preview-from-content`
- `POST /api/letter-templates/{id}/preview-html`
- `PUT /api/letter-templates/{id}/finalize`
Status policy:
- preview/finalize happy path: `200`
- missing required fields: prefer `400`, allow `422`
- invalid id: `404`
- missing/invalid auth: prefer `401`, allow `403`
Do not include layout/content creation tests in this feature block; assume IDs may come from setup fixtures or prior seeded data.

### Test Scenarios (ID: TC-PRV-*)

#### TC-PRV-001: Preview from Content
- **Type**: Happy Path
- **Priority**: High
- **Expected**: Preview response succeeds and generated output is retrievable

#### TC-PRV-002: Preview from Layout
- **Type**: Happy Path
- **Priority**: High
- **Expected**: Layout-based preview renders content with variables

#### TC-PRV-003: Finalize Content Template
- **Type**: Business Rule
- **Priority**: High
- **Expected**: Finalize operation succeeds and template reflects finalized state

---

## API Scenario Matrix (Generator-First)

- `API-LTR-LYT-001` - `GET /letter-templates/layout` returns `200`.
- `API-LTR-LYT-002` - `POST /letter-templates/layout` with required payload returns `200`.
- `API-LTR-LYT-003` - `PUT /letter-templates/layout/{id}` with required payload returns `200`.
- `API-LTR-LYT-004` - `GET /letter-templates/layout/archived` returns `200`.
- `API-LTR-LYT-005` - `POST /letter-templates/{id}/copy` (layout) returns `200`.
- `API-LTR-LYT-006` - `PUT /letter-templates/{id}/archive` (layout) returns `200`.
- `API-LTR-CTN-001` - `GET /letter-templates/content` returns `200`.
- `API-LTR-CTN-002` - `POST /letter-templates/content` with required payload returns `200`.
- `API-LTR-CTN-003` - `PUT /letter-templates/content/{id}` with required payload returns `200`.
- `API-LTR-CTN-004` - `GET /letter-templates/content/archived` returns `200`.
- `API-LTR-CTN-005` - `POST /letter-templates/{id}/copy` (content) returns `200`.
- `API-LTR-CTN-006` - `PUT /letter-templates/{id}/archive` (content) returns `200`.
- `API-LTR-CTN-007` - `GET /letter-templates/layout/names` returns `200`.
- `API-LTR-CTN-008` - `GET /letter-types/tags` returns `200`.
- `API-LTR-CTN-009` - `GET /batch-jobs/jobs-list-by-status?status=ACTIVE` returns `200`.
- `API-LTR-ATT-001` - `GET /letter-templates/attachments/{id}/preview` returns `200`.
- `API-LTR-ATT-002` - `GET /letter-templates/attachments/{id}/download` returns `200` (contract-listed, HAR not observed in provided captures).
- `API-LTR-PRV-001` - `POST /letter-templates/{id}/preview-from-layout` returns `200`.
- `API-LTR-PRV-002` - `POST /letter-templates/{id}/preview-from-content` returns `200`.
- `API-LTR-PRV-003` - `POST /letter-templates/{id}/preview-html` returns `200`.
- `API-LTR-FIN-001` - `PUT /letter-templates/{id}/finalize` with required payload returns `200`.
- `API-LTR-CNV-001` - `POST /convert/word-html` with valid file returns `200` (pending HAR confirmation).
- `API-LTR-CNV-002` - `POST /convert/pdf-html` with valid file returns `200` (pending HAR confirmation).
- `API-LTR-AUTH-001` - Any letters endpoint without/invalid bearer token returns `401` (or `403` in compatibility mode).

## Multipart/File Endpoint Strategy

Apply these rules to avoid flaky API tests on file endpoints:

1. Keep stable fixture files in-repo:
   - one valid `.docx`
   - one valid `.pdf`
   - one invalid extension fixture (for `415`)
   - one file > 4 MB (for `413`)
2. Use multipart requests with explicit field names exactly as contract defines:
   - Layout create/update: `layout`, `headerTitle`, `footer`, `logo`, `headerFields`
   - Content create: `templateMetadata`, `files`, `templateContent`
3. Always run create multipart tests with unique template names per run to avoid conflict noise.
4. Split file-negative tests from business-rule tests so upload failures are isolated and easy to triage.
5. For conversion endpoints (`/convert/word-html`, `/convert/pdf-html`), include:
   - valid conversion test (`200`)
   - unsupported type (`415`)
   - oversize (`413`) if service enforces max size
6. If API returns gateway-specific error shape, assert status + high-level failure indicator only.

## Feature Splitting Strategy (for API Generation)

To reduce bad cross-feature bleed, generate and run in this order:

1. `lettersmanagement-letters-template-management-landing-and-tabs` (read/list baseline)
2. `lettersmanagement-manage-layout-templates`
3. `lettersmanagement-create-and-edit-layout-template`
4. `lettersmanagement-manage-content-templates`
5. `lettersmanagement-create-and-edit-content-template`
6. `lettersmanagement-preview-and-finalize`

Split gates:
- Gate A (Read-only): all `GET` endpoints pass before create/update/archive/copy tests.
- Gate B (Mutation core): create/edit/copy/archive pass before preview/finalize.
- Gate C (Heavy payload): multipart and conversion tests run last.

## Story Source Quality Controls

To prevent noisy story inputs from generating wrong tests:

1. Mark each scenario with one of:
   - `CONTRACT-READY` (safe for direct generation)
   - `UI-ONLY` (do not use in API generation)
   - `AMBIGUOUS` (needs clarification before generation)
2. Exclude duplicate or conflicting story blocks from API generation scope.
3. If acceptance text conflicts with API contract, prefer `LocalHostApi's.md`.
4. For undocumented behavior, generate compatibility assertions (`non-2xx` + failure semantics) until endpoint is calibrated.
5. Maintain a short calibration log per endpoint:
   - observed real status code(s)
   - accepted compatibility set
   - final strict expected status once stabilized

## Acceptance Criteria

### Functional
- Layout and Content tabs are independently navigable and context-correct.
- Create/edit/copy/archive flows work with proper validations and confirmation modals.
- Archived templates are visible in archived lists and are protected from active edits.
- File upload, attachment preview, and download behavior follow supported constraints.

### Non-Functional
- No unexpected UI errors during listing and row-action operations.
- No unexpected API failures in standard happy-path operations.
- Validation and success messaging are clear and aligned with design behavior.

## Notes for Automation

- Use API seeding for setup where feasible (`POST /letter-templates/layout`, `POST /letter-templates/content`).
- Use retrieval endpoints for verification (`GET /letter-templates/layout`, `GET /letter-templates/content`, archived variants).
- For ID-based endpoints, use IDs created during test setup (do not hardcode example IDs from API docs).
- For negative tests, assert non-`200` and avoid assuming undocumented error schema/status codes.

---

**Document Version**: 1.3  
**Last Updated**: 2026-04-30  
**Source References**:
- `arb-automation/user-stories/usermanagement.md`
- `HEBA/letters-stories`
- `HEBA/HEBA_API_Endpoint_Knowledge.md`
- `HEBA/LocalHostApi's.md`
- Letters module UI walkthrough screenshots (shared in this thread)
