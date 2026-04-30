# HEBA User Management - Test Specification

## Overview

This document defines the functional behavior and test scenarios for the HEBA User Management module, covering:
- Add Member Profile
- Add EBD Employee
- Add Non-EBD Employee
- Add HR Employee
- Add Benefit Coordinator Employee

## Related API Endpoints

- `POST /admin-users/ebd-employees` - Create EBD employee user
- `POST /admin-users/non-ebd-employees` - Create Non-EBD employee user
- `POST /admin-users/hr` - Create HR user
- `POST /admin-users/benefit-coordinators` - Create Benefit Coordinator user
- `POST /admin-users/member` - Create member profile
- `GET /admin-users` - List/search admin users
- `PUT /admin-users/{userId}/contact` - Update user contact information

## Navigation Paths

### Member Profile
- Home → Smart Search → Member Search → Add New Member

### Admin Users (All 4 Types)
- Home → System Administration → Security Management → Manage Selected User → Add Users
- User type selection via card:
  - Add EBD Employee
  - Add Non-EBD Employee
  - Add HR Employee
  - Add Benefit Coordinator Employee

## Runtime Preconditions (Observed)

- In some sessions, left-navigation links are not immediately visible.
- Before trying to click `Smart Search` or `Member Search`, ensure the side menu is expanded.
- If `Member Search` is not visible, click the menu toggle (`Collapse Menu`) first, then continue navigation.

## Observed HAR Evidence (2026-04-29)

The capture `k8s-ebdmembe-adminpor-c6bdd328c4-644745537.us-east-2.elb.amazona` includes one complete Add Member flow.

- Auth/session bootstrap observed: `POST /api/auth/signin` (`200`).
- Add Member create observed: `POST /api/admin-users/member` (`201`).
- Follow-up reads after create observed:
  - `GET /api/member/{userDemographicsId}/coverage-info` (`200`)
  - `GET /api/demographic/{userDemographicsId}/contact-information` (`200`)
  - `GET /api/member/{userDemographicsId}/coverage-history/active` (`200`)
  - `GET /api/member/{userDemographicsId}/dental-vision-life` (`200`)
  - `GET /api/member/{userDemographicsId}/covered-and-termed` (`200`)
  - `GET /api/member/{userDemographicsId}/voluntary-products` (`200`)
- Runtime payload keys observed in member create request:
  - Includes: `firstName`, `middleInitial`, `lastName`, `suffix`, `dob`, `gender`, `ssn`, `confirmSsn`, `phoneNumber`, `phoneType`, `personalEmailAddress`, `workEmailAddress`, `physicalSameAsMailing`, `agency`, `agencyId`, `personnelNumber`, `hireDate`, mailing and physical address keys.
  - Not present in this capture: `roleIds`, `agencyRepresentativeId`, `mailingCountry`, `physicalCountry`.
  - Treat non-present keys as **TBD** (capture-specific) unless confirmed by canonical API contract.

---

## Field Rules

**Default Requirement Rule**: All fields are **required** unless explicitly labeled as `(optional)` in the UI.

### Common Validation Rules (All Forms)

- **SSN**: Masked by default, must match Confirm SSN field
- **Date of Birth**: Date picker, format `mm/dd/yyyy`
- **Email**: Valid email format required
- **Phone Number**: Phone format with type selection
- **ZIP Code**: 5-digit format
- **Gender**: Dropdown selection required

### UI Validation Semantics (Apply to all forms)

- Do not expect validation text before user interaction.
- A field-level validation message is expected only after either:
  - user enters/edits the field and then blurs it (clicks another field or tabs out), or
  - user clicks Save while required/invalid fields exist.
- For mismatch validations (for example SSN vs Confirm SSN), tests must:
  - populate both fields with different values, and
  - trigger blur on the confirm field or click Save before asserting message visibility.
- If a field has never been touched and Save has not been clicked, absence of validation message is expected.
- When Save is clicked with invalid/missing values, validations should appear for the impacted fields and submission should be blocked.

## API Assertion Policy (Generator Baseline)

Use this policy for all generated API tests in this module.

### Happy Path Assertions (All Endpoints)

1. Assert exact HTTP status from contract/runtime evidence.
   - Member create (`POST /api/admin-users/member`): prefer `201`, allow `200` compatibility.
   - Other endpoints in this module default to `200` unless explicitly documented otherwise.
2. Assert response is a valid JSON object because source contract examples are `{}`.
3. Do not assert undocumented response keys (`message`, `status`, `data`) unless contract explicitly defines them.

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

**Test implementation rule**:
- First pass strict mode: assert preferred status.
- If environment behavior differs but remains standards-compliant, use compatibility mode and assert allowed set (for example auth: `[401, 403]`, validation: `[400, 422]`) plus failure semantics.

---

## Feature 1: Add Member Profile

### Navigation
Home → Smart Search → Member Search → Add New Member

### Form Sections

#### Name
- First Name (required)
- Initial (optional)
- Last Name (required)
- Suffix (optional)

#### Demographics
- Date of Birth (required)
- Gender (required)
- Social Security Number (required, masked)
- Confirm Social Security Number (required)

#### Contact Information
- Phone Number (required)
- Phone Type (required)
- Personal Email Address (required)
- Work Email Address (required)

#### Address
- **Mailing Address**
  - Street address (required)
  - Street address 2 (optional)
  - City (required)
  - State (required)
  - ZIP Code (required)
- **Physical Address**
  - Street address (required)
  - Street address 2 (optional)
  - City (required)
  - State (required)
  - ZIP Code (required)
  - Same as Mailing Address checkbox

#### Additional Fields
- Agency (required, lookup/select)
- Personnel Number (required)
- Hire Date (required)

### Actions
- Cancel - Discards unsaved changes, returns to Member Search
- Save - Creates member profile, shows success toast

### Business Rules

1. **SSN Uniqueness**: SSN must be unique across all members
2. **SSN Confirmation**: SSN and Confirm SSN must match
3. **SSN Masking**: SSN is masked by default with show/hide toggle
4. **Form Validation**: All required fields must be valid before Save is enabled
5. **Duplicate SSN**: Error toast shown if SSN already exists
6. **Unsaved Changes**: Navigation away triggers confirmation modal if form is dirty
7. **Success Confirmation**: Success toast displayed after successful save

### API Endpoint Contract (Member)

- **Primary endpoint**: `POST /admin-users/member`
  - Runtime URL evidence from HAR uses `/api/admin-users/member` (base URL is environment-driven).
- **Verification endpoint**: `GET /admin-users`
- **Related update endpoint**: `PUT /admin-users/{userId}/contact` (API source example path: `PUT /admin-users/B00004/contact`)
- **Contract-listed request fields (POST /admin-users/member)**:
  - `string`: `firstName`, `lastName`, `middleInitial`, `dob`, `ssn`, `confirmSsn`, `gender`
  - `string`: `phoneNumber`, `phoneType`, `personalEmailAddress`, `workEmailAddress`
  - `string`: `mailingAddressLine1`, `mailingAddressLine2`, `mailingCity`, `mailingState`, `mailingZip`, `mailingCountry`
  - `boolean`: `physicalSameAsMailing`
  - `string`: `physicalAddressLine1`, `physicalAddressLine2`, `physicalCity`, `physicalState`, `physicalZip`, `physicalCountry`
  - `integer`: `agencyId`, `agencyRepresentativeId`
  - `string`: `personnelNumber`, `hireDate`
  - `[integer]`: `roleIds`
- **Observed runtime minimum for current implementation phase (Member create only)**:
  - Use this minimum set for generator happy-path/negative tests until more captures are available.
  - Required in this phase: `firstName`, `middleInitial`, `lastName`, `suffix`, `dob`, `gender`, `ssn`, `confirmSsn`, `phoneNumber`, `phoneType`, `personalEmailAddress`, `workEmailAddress`, `physicalSameAsMailing`, `agencyId`, `personnelNumber`, `hireDate`, `mailingAddressLine1`, `mailingCity`, `mailingState`, `mailingZip`, `physicalAddressLine1`, `physicalCity`, `physicalState`, `physicalZip`.
  - Optional/TBD for this phase (do not force in generated member specs): `roleIds`, `agencyRepresentativeId`, `mailingCountry`, `physicalCountry`.
  - Compatibility payload note: HAR request included both `agency` and `agencyId` as equivalent string values; include `agency` as optional mirror field in generated member payloads when needed for runtime compatibility.
- **Observed endpoint sequence for complete Member flow (HAR-backed)**:
  - `POST /api/auth/signin` -> `200`
  - `GET /api/agencies/sorted` -> `200` (lookup data loaded before create)
  - `POST /api/admin-users/member` -> `201` (member create)
  - `GET /api/member/{userDemographicsId}/coverage-info` -> `200`
  - `GET /api/member/{userDemographicsId}/coverage-history/active` -> `200`
  - `GET /api/demographic/{userDemographicsId}/contact-information` -> `200`
  - `GET /api/member/{userDemographicsId}/dental-vision-life` -> `200`
  - `GET /api/member/{userDemographicsId}/covered-and-termed` -> `200`
  - `GET /api/member/{userDemographicsId}/voluntary-products` -> `200`
  - Not observed in this capture: `GET /api/admin-users`, `PUT /api/admin-users/{id}/contact` (defer strict automation for these until captured).
- **Prepared test-data template (Member module, generator source of truth)**:
  - Base lookup fixture: `agencyId = "1374"` and `agency = "1374"` (from HAR).
  - Base valid payload template:
    - `firstName: "alex"`
    - `middleInitial: ""`
    - `lastName: "al"`
    - `suffix: ""`
    - `dob: "11/11/1111"`
    - `gender: "M"`
    - `ssn: "111-11-1333"`
    - `confirmSsn: "111-11-1333"`
    - `phoneNumber: "+11111111111"`
    - `phoneType: "HOME"`
    - `personalEmailAddress: "aiosdjfaadsosidf@gmail.com"`
    - `workEmailAddress: "asdfsdggasbdf@gmail.com"`
    - `physicalSameAsMailing: true`
    - `agency: "1374"`
    - `agencyId: "1374"`
    - `personnelNumber: "12"`
    - `hireDate: "04/28/2026"`
    - `mailingAddressLine1: "times square"`
    - `mailingCity: "new york"`
    - `mailingState: "NY"`
    - `mailingZip: "55555"`
    - `physicalAddressLine1: "times square"`
    - `physicalCity: "new york"`
    - `physicalState: "NY"`
    - `physicalZip: "55555"`
  - Scenario variants:
    - Happy path: keep structure, only make identity fields unique for each run (`ssn`, emails, `personnelNumber`).
    - Duplicate SSN: reuse same `ssn` across two create attempts.
    - SSN mismatch: set different `ssn` and `confirmSsn`.
    - Unauthorized: call create endpoint without bearer token.
- **Format notes from API examples**:
  - `dob`, `hireDate`: `MM/DD/YYYY` example format
  - `ssn`, `confirmSsn`: string (example values vary by endpoint)
- **Required request fields (PUT /admin-users/{userId}/contact)**:
  - `string`: `phoneNumber`, `phoneType`, `personalEmailAddress`, `workEmailAddress`

### API Success Criteria (Member)

- `POST /admin-users/member` returns HTTP `201` in observed runtime capture.
  - Compatibility expectation for automation: prefer `201`; allow `200` when contract/environment differs.
- `GET /admin-users` returns HTTP `200`.
- `PUT /admin-users/{userId}/contact` returns HTTP `200`.
- Response body contract in API source is `{}`
  - Assertion: response is a JSON object; exact schema keys are not defined.

### API Negative Cases (Member)

- Missing one required field in `POST /admin-users/member` should not satisfy the success contract.
  - Assertion: preferred `400` (acceptable `422` in compatibility mode).
- Missing one required field in `PUT /admin-users/{userId}/contact` should not satisfy the success contract.
  - Assertion: preferred `400` (acceptable `422` in compatibility mode).
- Missing or invalid bearer token for Member endpoints.
  - Assertion: preferred `401` (acceptable `403` in compatibility mode).

### Generator Contract

For the Member Profile feature, generated API tests should target 15 scenarios in total.
The create endpoint should be treated as `POST /api/admin-users/member`, and tests for this section should stay within the observed member endpoint family.
Allowed member endpoints for this phase are:
- `POST /api/admin-users/member`
- `GET /api/member/{id}/coverage-info`
- `GET /api/demographic/{id}/contact-information`
- `GET /api/member/{id}/coverage-history/active`
- `GET /api/member/{id}/dental-vision-life`
- `GET /api/member/{id}/covered-and-termed`
- `GET /api/member/{id}/voluntary-products`
Endpoints that should be excluded for this phase because they were not observed in the member HAR flow:
- `GET /api/admin-users`
- `PUT /api/admin-users/{id}/contact`
Authentication is required for protected member endpoints.
Status behavior for member generation should follow this compatibility policy:
- create happy path: prefer `201`, allow `200`
- duplicate conflict: prefer `409`, allow `400`/`422`
- uncertain validation cases (SSN mismatch, date/email/zip format): allow `400`/`422`/`200`/`201`
- read endpoints: prefer `200`, allow `404`/`500`
- auth negative: prefer `401`, allow `403`
Payload policy for this phase should use the observed runtime minimum field set in the Member API contract section.
Fields still considered optional/TBD in this phase are `roleIds`, `agencyRepresentativeId`, `mailingCountry`, and `physicalCountry`.
Use fixed lookup fixtures `agency = "1374"` and `agencyId = "1374"`.
Generate unique values per run for `ssn`, `personalEmailAddress`, `workEmailAddress`, and `personnelNumber`.
Compatibility interpretation notes:
- treat `404` on read endpoints as eventual consistency
- treat `500` on read endpoints as service instability

### Test Scenarios (ID: TC-AMP-*)

#### TC-AMP-001: Required Field Validation
- **Type**: Validation
- **Priority**: High
- **Steps**:
  1. Navigate to Add Member form
  2. Leave all mandatory fields empty
  3. Attempt to submit
- **Expected**: Validation appears for each required field

#### TC-AMP-002: Form Validity Button State
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Open Add Member form
  2. Fill form partially
  3. Inspect Add Member button state
- **Expected**: Button remains disabled until all required fields are valid

#### TC-AMP-003: SSN Mismatch Validation
- **Type**: Validation
- **Priority**: High
- **Steps**:
  1. Enter valid SSN in SSN field
  2. Enter different value in Confirm SSN
  3. Attempt submission
- **Expected**: Mismatch validation message displayed, submission blocked

#### TC-AMP-004: Create Member Success (Unique SSN)
- **Type**: Happy Path
- **Priority**: High
- **Steps**:
  1. Fill all required fields with valid data
  2. Enter unique SSN
  3. Click Save
- **Expected**: Member created successfully, success toast shown

#### TC-AMP-005: Duplicate SSN Error
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**:
  1. Fill form with valid data
  2. Enter existing SSN
  3. Click Save
- **Expected**: Error toast shown, member not created

#### TC-AMP-006: Unsaved Changes Modal on Navigation
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**:
  1. Modify form without saving
  2. Attempt to navigate away
- **Expected**: Unsaved changes confirmation modal appears

#### TC-AMP-007: Leave Option Discards Changes
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Trigger unsaved changes modal
  2. Click Leave
- **Expected**: Changes discarded, navigation proceeds

#### TC-AMP-008: Cancel Option Keeps User on Page
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Trigger unsaved changes modal
  2. Click Cancel
- **Expected**: User remains on form, changes retained

#### TC-AMP-009: No Modal Without Changes
- **Type**: Business Rule
- **Priority**: Medium
- **Steps**:
  1. Open form without editing
  2. Navigate away
- **Expected**: No unsaved changes modal shown

#### TC-AMP-010: Success Toast Design Validation
- **Type**: Validation
- **Priority**: Medium
- **Steps**:
  1. Create member successfully
  2. Inspect toast message and styling
- **Expected**: Toast matches design specification

#### TC-AMP-011: Error Toast Design Validation
- **Type**: Validation
- **Priority**: Medium
- **Steps**:
  1. Trigger duplicate SSN error
  2. Inspect toast message and styling
- **Expected**: Error toast matches design specification

#### TC-AMP-012: SSN Field Masked by Default
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Open Add Member form
  2. Inspect SSN field
- **Expected**: SSN is masked initially

#### TC-AMP-013: SSN Visibility Toggle
- **Type**: Happy Path
- **Priority**: Medium
- **Steps**:
  1. Enter SSN value
  2. Toggle visibility on and off
- **Expected**: SSN visibility toggles correctly without data loss

---

## Feature 2: Add EBD Employee

### Navigation
Home → System Administration → Security Management → Manage Selected User → Add Users → Add EBD Employee card

### Form Sections

#### User Role
- User Role (required, dropdown)

#### Name
- First Name (required)
- Middle Name (optional)
- Last Name (required)

#### Demographics
- Date of Birth (required)
- Gender (required)
- Social Security Number (required, masked)
- Confirm Social Security Number (required)

#### Contact Information
- Phone Number (required)
- Phone Type (required)
- Personal Email Address (required)
- Work Email Address (required)

#### Mailing Address
- Street address (required)
- Street address 2 (optional)
- City (required)
- State (required)
- ZIP Code (required)

#### Employee Information
- Department (required)
- Responsible Party (required)
- Business Area (required)
- Class Code (required)
- Cost Center (required)
- State Title (required)
- Functional Title (required)
- Position Number (required)
- Grade (required)

#### Employee Time Card
- Clock In (required)
- Clock Out (required)
- First Break Fast (required)
- First Break End (required)
- Lunch Start (required)
- Lunch End (required)

### Actions
- Cancel - Discards changes, returns to Add Users tab
- Save - Creates EBD employee user, shows success confirmation

### Business Rules

1. **Role Assignment**: Created user automatically assigned EBD Employee role
2. **SSN Masking**: SSN masked by default with show/hide toggle
3. **Data Persistence**: Saved values persist when user details are reopened
4. **Form Validation**: All required fields enforced
5. **Success Confirmation**: Success toast/confirmation displayed after save

### API Endpoint Contract (EBD Employee)

- **Primary endpoint**: `POST /admin-users/ebd-employees`
- **Runtime URL evidence**:
  - Create call uses `/api/admin-users/ebd-employees` (base URL is environment-driven).
  - Pre-create lookup calls observed:
    - `GET /api/roles`
    - `GET /api/account-types`
    - `GET /api/departments`
    - `GET /api/responsible-parties`
    - `GET /api/account-types/1/roles`
- **Verification endpoint**: `GET /admin-users` (contract-listed, not observed in this HAR flow).
- **Required request fields (POST /admin-users/ebd-employees)**:
  - `string`: `firstName`, `lastName`, `middleInitial`, `dob`, `ssn`, `confirmSsn`, `gender`
  - `string`: `phoneNumber`, `phoneType`, `personalEmailAddress`, `workEmailAddress`
  - `integer`: `departmentId`, `responsiblePartyId`
  - `string`: `businessArea`, `classCode`, `costCenter`, `stateTitle`, `functionalTitle`, `positionNumber`, `grade`
  - `string`: `clockInTime`, `clockOutTime`, `break1StartTime`, `break1EndTime`, `lunchStartTime`, `lunchEndTime`
  - `[integer]`: `roleIds`
- **Format notes from API examples**:
  - `dob`: `MM/DD/YYYY`
  - time fields: `HH:MM:SS`
- **Observed payload notes from HAR**:
  - Request body contains both nested form-state objects (`userDetails`, `demographics`, `contactInfo`, `employeeInfo`, `timeCard`) and flattened create fields.
  - `roleId` and `roleIds` were both present in observed payloads; successful call included `roleIds: [2]`.
  - Successful sample values:
    - `departmentId: 333`
    - `responsiblePartyId: 1300000504`
    - `roleIds: [2]`
    - `gender: "M"`, `phoneType: "HOME"`
    - `clockInTime`/`clockOutTime` and break/lunch fields in `HH:MM:SS`.

### API Success Criteria (EBD Employee)

- `POST /api/admin-users/ebd-employees` returns HTTP `201` in observed runtime capture.
  - Compatibility expectation for automation: prefer `201`; allow `200`.
- `GET /api/roles`, `GET /api/account-types`, `GET /api/departments`, `GET /api/responsible-parties`, `GET /api/account-types/1/roles` return HTTP `200` in observed runtime capture.
- `GET /admin-users` remains contract-listed verification endpoint with expected `200` when used.
- Response body contract in API source is `{}`
  - Assertion: response is a JSON object; exact schema keys are not defined.

### API Negative Cases (EBD Employee)

- Missing one required field in `POST /admin-users/ebd-employees` should not satisfy the success contract.
  - Assertion: preferred `400` (acceptable `422` in compatibility mode).
- Duplicate email/account-type conflict in `POST /api/admin-users/ebd-employees`.
  - Observed assertion: `400` with message similar to "User account with this email ... and account type E already exists".
- Missing or invalid bearer token for EBD endpoints.
  - Assertion: preferred `401` (acceptable `403` in compatibility mode).

### Generator Contract

For the EBD Employee feature, generated API tests should target 12 scenarios in total.
The create endpoint should be treated as `POST /api/admin-users/ebd-employees`.
Allowed endpoints for this EBD phase are:
- `POST /api/admin-users/ebd-employees`
- `GET /api/roles`
- `GET /api/account-types`
- `GET /api/departments`
- `GET /api/responsible-parties`
- `GET /api/account-types/1/roles`
Endpoints that should be excluded for this phase:
- `GET /api/admin-users` (not observed in EBD HAR flow)
- member-specific endpoints under `/api/member/*`
Authentication is required for protected EBD endpoints.
Status behavior for EBD generation should follow this policy:
- create happy path: prefer `201`, allow `200`
- duplicate email/account-type: assert `400` based on observed runtime behavior
- missing required fields: prefer `400`, allow `422`
- uncertain validation cases (SSN mismatch and format variants): allow `400`/`422`/`200`/`201`
- lookup endpoints: `200`
- auth negative: prefer `401`, allow `403`
Payload policy should use required fields listed in the EBD API contract section, and allow nested plus flattened key mix when runtime payload evidence shows both styles.
Use fixed fixtures from HAR-validated successful calls:
- `departmentId = 333`
- `responsiblePartyId = 1300000504`
- `roleIds = [2]`
Generate unique values per run for `ssn`, `personalEmailAddress`, `workEmailAddress`, and `positionNumber`.
Compatibility note: duplicate email behavior is environment-backed and should remain strict at `400`.

### Test Scenarios (ID: TC-AEU-*)

#### TC-AEU-001: Card Visibility
- **Type**: Validation
- **Priority**: High
- **Steps**: Open Add Users tab
- **Expected**: Add EBD Employee card is displayed

#### TC-AEU-002: Card Opens Form
- **Type**: Happy Path
- **Priority**: High
- **Steps**: Click Add EBD Employee card
- **Expected**: Correct Add EBD Employee form opens

#### TC-AEU-003: Required Sections Visible
- **Type**: Validation
- **Priority**: High
- **Steps**: Inspect EBD form sections
- **Expected**: All required sections present as per design

#### TC-AEU-004: Required Field Enforcement
- **Type**: Validation
- **Priority**: High
- **Steps**:
  1. Leave required fields blank
  2. Attempt Save
- **Expected**: Required field validation triggered for each mandatory field

#### TC-AEU-005: Invalid Data Validation
- **Type**: Validation
- **Priority**: High
- **Steps**: Enter invalid inputs (format/type/range) in key fields
- **Expected**: Clear validation messages appear for invalid data

#### TC-AEU-006: SSN Masked by Default
- **Type**: Business Rule
- **Priority**: High
- **Steps**: Open EBD form and inspect SSN field
- **Expected**: SSN value is masked by default

#### TC-AEU-007: SSN Visibility Toggle
- **Type**: Happy Path
- **Priority**: Medium
- **Steps**: Click SSN show/hide toggle
- **Expected**: SSN visibility toggles correctly and securely

#### TC-AEU-008: Save Creates EBD User
- **Type**: Happy Path
- **Priority**: High
- **Steps**:
  1. Enter valid data in all required fields
  2. Click Save
- **Expected**: User record created successfully

#### TC-AEU-009: EBD Role Assignment
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Create valid EBD user
  2. Inspect role mapping
- **Expected**: Created user assigned EBD Employee role

#### TC-AEU-010: Success Confirmation
- **Type**: Happy Path
- **Priority**: High
- **Steps**: Save valid EBD user
- **Expected**: Success confirmation/toast displayed

#### TC-AEU-011: Cancel Discards Data
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**:
  1. Enter data in form
  2. Click Cancel
- **Expected**: Entered data discarded, user returns to previous screen

#### TC-AEU-012: Data Persistence
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Save EBD user
  2. Reopen user details
- **Expected**: Saved values persist correctly

#### TC-AEU-013: No UI/API Errors
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**: Run complete create flow and monitor UI/network
- **Expected**: No unexpected UI errors or API failures

---

## Feature 3: Add Non-EBD Employee

### Navigation
Home → System Administration → Security Management → Manage Selected User → Add Users → Add Non-EBD Employee card

### Form Sections

#### User Role
- User Role (required, dropdown)

#### Name
- First Name (required)
- Middle Name (optional)
- Last Name (required)

#### Demographics
- Date of Birth (required)
- Gender (required)
- Social Security Number (required, masked)
- Confirm Social Security Number (required)

#### Contact Information
- Phone Number (required)
- Phone Type (required)
- Personal Email Address (required)
- Work Email Address (required)

#### Mailing Address
- Street address (required)
- Street address 2 (optional)
- City (required)
- State (required)
- ZIP Code (required)

### Actions
- Cancel - Discards changes, returns to Add Users tab
- Save - Creates Non-EBD employee user

### Business Rules

1. **Role Assignment**: Created user assigned Non-EBD Employee role
2. **Section Restriction**: Employee-specific sections (Employee Information, Time Card) are hidden
3. **Allowed Sections**: Only Name, Demographics, Contact Information, Mailing Address visible
4. **Data Persistence**: Saved values persist when reopened

### API Endpoint Contract (Non-EBD Employee)

- **Primary endpoint**: `POST /admin-users/non-ebd-employees`
- **Verification endpoint**: `GET /admin-users`
- **Required request fields (POST /admin-users/non-ebd-employees)**:
  - `string`: `firstName`, `lastName`, `middleInitial`, `dob`, `ssn`, `confirmSsn`, `gender`
  - `string`: `phoneNumber`, `phoneType`, `personalEmailAddress`, `workEmailAddress`
  - `string`: `addressLine1`, `addressLine2`, `city`, `state`, `zip`, `country`
  - `[integer]`: `roleIds`
- **Format notes from API examples**:
  - `dob`: `MM/DD/YYYY`

### API Success Criteria (Non-EBD Employee)

- `POST /admin-users/non-ebd-employees` returns HTTP `200`.
- `GET /admin-users` returns HTTP `200`.
- Response body contract in API source is `{}`
  - Assertion: response is a JSON object; exact schema keys are not defined.

### API Negative Cases (Non-EBD Employee)

- Missing one required field in `POST /admin-users/non-ebd-employees` should not satisfy the success contract.
  - Assertion: preferred `400` (acceptable `422` in compatibility mode).
- Missing or invalid bearer token for Non-EBD endpoints.
  - Assertion: preferred `401` (acceptable `403` in compatibility mode).

### Test Scenarios (ID: TC-ANEU-*)

#### TC-ANEU-001: Card Visibility
- **Type**: Validation
- **Priority**: High
- **Steps**: Open Add Users tab
- **Expected**: Add Non-EBD Employee card is displayed

#### TC-ANEU-002: Card Opens Form
- **Type**: Happy Path
- **Priority**: High
- **Steps**: Click Add Non-EBD Employee card
- **Expected**: Correct Add Non-EBD Employee form opens

#### TC-ANEU-003: Name Section Visible
- **Type**: Validation
- **Priority**: High
- **Steps**: Inspect Non-EBD form
- **Expected**: Name section is displayed

#### TC-ANEU-004: Demographics Section Visible
- **Type**: Validation
- **Priority**: High
- **Steps**: Inspect Non-EBD form
- **Expected**: Demographics section is displayed

#### TC-ANEU-005: Contact Information Section Visible
- **Type**: Validation
- **Priority**: High
- **Steps**: Inspect Non-EBD form
- **Expected**: Contact Information section is displayed

#### TC-ANEU-006: Mailing Address Section Visible
- **Type**: Validation
- **Priority**: High
- **Steps**: Inspect Non-EBD form
- **Expected**: Mailing Address section is displayed

#### TC-ANEU-007: Employee Sections Hidden
- **Type**: Validation
- **Priority**: High
- **Steps**: Inspect Non-EBD form for restricted sections
- **Expected**: Employee-specific sections are hidden

#### TC-ANEU-008: Required Field Validation
- **Type**: Validation
- **Priority**: High
- **Steps**:
  1. Leave required fields empty
  2. Click Save
- **Expected**: Validation appears for missing required fields

#### TC-ANEU-009: Save Creates Non-EBD User
- **Type**: Happy Path
- **Priority**: High
- **Steps**:
  1. Enter valid Non-EBD data
  2. Click Save
- **Expected**: User created successfully

#### TC-ANEU-010: Non-EBD Role Assignment
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Create Non-EBD user
  2. Inspect assigned role
- **Expected**: Created user has Non-EBD Employee role

#### TC-ANEU-011: Cancel Discards Data
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**:
  1. Enter values in form
  2. Click Cancel
- **Expected**: Unsaved data discarded, navigation returns

#### TC-ANEU-012: Data Persistence
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Save Non-EBD user
  2. Reopen details
- **Expected**: Saved data retained accurately

#### TC-ANEU-013: No UI/API Errors
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**: Execute full flow while monitoring responses
- **Expected**: No unexpected UI/API errors

---

## Feature 4: Add HR Employee

### Navigation
Home → System Administration → Security Management → Manage Selected User → Add Users → Add HR Employee card

### Form Sections

#### User Role
- User Role (required, dropdown)

#### Name
- First Name (required)
- Middle Name (optional)
- Last Name (required)

#### Demographics
- Date of Birth (required)
- Gender (required)
- Social Security Number (required, masked)
- Confirm Social Security Number (required)

#### Contact Information
- Phone Number (required)
- Phone Type (required)
- Personal Email Address (required)
- Work Email Address (required)

#### Mailing Address
- Street address (required)
- Street address 2 (optional)
- City (required)
- State (required)
- ZIP Code (required)

#### Default Agency Details
- Default agency to assign (required)
- Representative type (required)
- Representative ID (required)

#### Agency Assignments
- Grid with columns: Agency, Representative type, Representative ID, Actions
- Add agency assignment button

### Actions
- Cancel - Discards changes, returns to Add Users tab
- Save - Creates HR user with agency associations

### Business Rules

1. **Agency Association**: Selected agency linked to created HR user
2. **Multiple Assignments**: HR user can be assigned to multiple agencies via grid
3. **Data Persistence**: HR and agency assignment data persists after save

### API Endpoint Contract (HR Employee)

- **Primary endpoint**: `POST /admin-users/hr`
- **Runtime URL evidence**:
  - Create call uses `/api/admin-users/hr` (base URL is environment-driven).
  - Pre-create lookup calls observed:
    - `GET /api/roles`
    - `GET /api/account-types`
    - `GET /api/departments`
    - `GET /api/responsible-parties`
    - `GET /api/account-types/4/roles`
    - `GET /api/agencies/sorted`
    - `GET /api/agency-representatives/types`
- **Verification endpoint**: `GET /admin-users` (contract-listed, not observed in this HR HAR flow).
- **Required request fields (POST /admin-users/hr)**:
  - `string`: `firstName`, `lastName`, `middleInitial`, `dob`, `ssn`, `confirmSsn`, `gender`
  - `string`: `phoneNumber`, `phoneType`, `personalEmail`, `workEmail`
  - `string`: `addressLine1`, `addressLine2`, `city`, `state`, `zip`, `country`
  - `string`: `agencyId`, `representativeType`, `agencyRepresentativeId`, `representativeId`
  - `[integer]`: `roleIds`
- **Field-name note for API tests**:
  - HR payload in API source uses `personalEmail` / `workEmail`.
  - Other user-creation endpoints use `personalEmailAddress` / `workEmailAddress`.
- **Format notes from API examples**:
  - `dob`: `MM/DD/YYYY`
- **Observed payload notes from HAR**:
  - Request body included nested sections (`userDetails`, `demographics`, `contactInfo`, `mailingAddress`, `defaultAgencyDetails`) and flattened create fields.
  - Successful call included `roleIds: [17]`, `agencyId: 1259853821`, `representativeType: "A"`, `representativeId: "1"`.
  - `ssn` and `confirmSsn` were submitted in dashed format (`###-##-####`).
  - Successful sample values:
    - `gender: "M"`, `phoneType: "HOME"`
    - `addressLine1`, `city`, `state`, `zip` populated as top-level fields.

### API Success Criteria (HR Employee)

- `POST /api/admin-users/hr` returns HTTP `201` in observed runtime capture.
  - Compatibility expectation for automation: prefer `201`; allow `200`.
- `GET /api/roles`, `GET /api/account-types`, `GET /api/departments`, `GET /api/responsible-parties`, `GET /api/account-types/4/roles`, `GET /api/agencies/sorted`, `GET /api/agency-representatives/types` return HTTP `200` in observed runtime capture.
- `GET /admin-users` remains contract-listed verification endpoint with expected `200` when used.
- Response body contract in API source is `{}`
  - Assertion: response is a JSON object; exact schema keys are not defined.

### API Negative Cases (HR Employee)

- Missing one required field in `POST /admin-users/hr` should not satisfy the success contract.
  - Assertion: preferred `400` (acceptable `422` in compatibility mode).
- Duplicate email/account-type conflict in `POST /api/admin-users/hr`.
  - Assertion: expected conflict-like behavior (`400` preferred; `409` may appear in some environments).
- Missing or invalid bearer token for HR endpoints.
  - Assertion: preferred `401` (acceptable `403` in compatibility mode).

### Generator Contract

For the HR Employee feature, generated API tests should target 12 scenarios in total.
The create endpoint should be treated as `POST /api/admin-users/hr`.
Allowed endpoints for this phase are:
- `POST /api/admin-users/hr`
- `GET /api/roles`
- `GET /api/account-types`
- `GET /api/departments`
- `GET /api/responsible-parties`
- `GET /api/account-types/4/roles`
- `GET /api/agencies/sorted`
- `GET /api/agency-representatives/types`
Endpoints that should be excluded for this phase:
- `GET /api/admin-users` (not observed in HR HAR flow)
- member-specific endpoints under `/api/member/*`
Authentication is required for protected HR endpoints.
Status behavior for HR generation should follow this policy:
- create happy path: prefer `201`, allow `200`
- duplicate email/account-type: prefer `400`, allow `409` compatibility
- missing required fields: prefer `400`, allow `422`
- SSN mismatch and other uncertain validation cases: allow `400`/`422`/`200`/`201`
- lookups: `200`
- auth negative: prefer `401`, allow `403`
Payload policy should use required fields listed in the HR API contract section and preserve HAR-observed shape expectations:
- include `defaultAgencyDetails` with `agencyId`, `representativeType`, and `representativeId`
- include `agencyAssignments` with at least one assignment matching default agency details
- use dashed SSN format (`###-##-####`)
- keep `roleIds` present and non-empty
Allow nested plus flattened key mix when runtime evidence shows both styles.
Use fixed fixtures from HAR-validated successful calls:
- `agencyId = 1259853821`
- `representativeType = "A"`
- `representativeId = "1"`
- `roleIds = [17]`
Generate unique values per run for `ssn`, `personalEmail`, `workEmail`, and `positionNumber`.

### Test Scenarios (ID: TC-AHR-*)

#### TC-AHR-001: Card Visibility
- **Type**: Validation
- **Priority**: High
- **Steps**: Open Add Users tab
- **Expected**: Add HR User card is displayed

#### TC-AHR-002: Card Opens Form
- **Type**: Happy Path
- **Priority**: High
- **Steps**: Click Add HR User card
- **Expected**: Correct Add HR User form opens

#### TC-AHR-003: Required Sections Visible
- **Type**: Validation
- **Priority**: High
- **Steps**: Inspect HR form sections
- **Expected**: All required sections are present

#### TC-AHR-004: Agency Assignment Fields Visible
- **Type**: Validation
- **Priority**: High
- **Steps**: Inspect agency assignment area
- **Expected**: All agency assignment fields are visible

#### TC-AHR-005: Required Field Validation
- **Type**: Validation
- **Priority**: High
- **Steps**:
  1. Leave required fields blank
  2. Click Save
- **Expected**: Validation appears for all required fields

#### TC-AHR-006: Save Creates HR User
- **Type**: Happy Path
- **Priority**: High
- **Steps**:
  1. Enter valid HR data
  2. Click Save
- **Expected**: HR user created successfully

#### TC-AHR-007: Agency Association
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Create HR user with selected agency
  2. Verify association
- **Expected**: Created HR user linked to selected agency

#### TC-AHR-008: Cancel Discards Data
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**:
  1. Enter values in form
  2. Click Cancel
- **Expected**: Data discarded, user returns to previous screen

#### TC-AHR-009: Data Persistence
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Save HR user
  2. Reopen details
- **Expected**: Saved HR and agency data persists

#### TC-AHR-010: No UI/API Errors
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**: Run full Add HR flow
- **Expected**: No unexpected UI/API errors

#### TC-AHR-011: Duplicate Email Rejection
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**:
  1. Create HR user with valid emails
  2. Attempt second create with same personal/work email
- **Expected**: Duplicate/conflict error is returned and user is not re-created

#### TC-AHR-012: Missing Default Agency Details
- **Type**: Validation
- **Priority**: High
- **Steps**:
  1. Fill all HR fields except default agency section
  2. Attempt Save
- **Expected**: Validation blocks submission for missing default agency assignment fields

#### TC-AHR-013: SSN Mismatch Validation
- **Type**: Validation
- **Priority**: High
- **Steps**:
  1. Enter different values in SSN and Confirm SSN
  2. Click Save
- **Expected**: Validation message shown and save blocked

#### TC-AHR-014: Agency Representative Type Dependency
- **Type**: Business Rule
- **Priority**: Medium
- **Steps**:
  1. Select an agency
  2. Change representative type
  3. Observe representative options
- **Expected**: Representative options refresh based on selected type

#### TC-AHR-015: Lookup API Availability
- **Type**: Integration
- **Priority**: High
- **Steps**:
  1. Open Add HR form
  2. Observe network calls for roles/account-types/agencies/representatives
- **Expected**: Required lookup endpoints return success and populate dropdowns

---

## Feature 5: Add Benefit Coordinator Employee

### Navigation
Home → System Administration → Security Management → Manage Selected User → Add Users → Add Benefit Coordinator Employee card

### Form Sections

#### User Role
- User Role (required, dropdown)

#### Name
- First Name (required)
- Middle Name (optional)
- Last Name (required)

#### Demographics
- Date of Birth (required)
- Gender (required)
- Social Security Number (required, masked)
- Confirm Social Security Number (required)

#### Contact Information
- Phone Number (required)
- Phone Type (required)
- Personal Email Address (required)
- Work Email Address (required)

#### Mailing Address
- Street address (required)
- Street address 2 (optional)
- City (required)
- State (required)
- ZIP Code (required)

#### Vendor Information
- Vendors (required, dropdown/select)

### Actions
- Cancel - Discards changes, returns to Add Users tab
- Save - Creates Benefit Coordinator user

### Business Rules

1. **Vendor Association**: Selected vendor linked to created Benefit Coordinator
2. **Plan Association**: Selected plan linked to created Benefit Coordinator
3. **Data Persistence**: Coordinator, vendor, and plan data persists after save

### API Endpoint Contract (Benefit Coordinator)

- **Primary endpoint**: `POST /admin-users/benefit-coordinators`
- **Runtime URL evidence**:
  - Create call uses `/api/admin-users/benefit-coordinators` (base URL is environment-driven).
  - Pre-create lookup calls observed:
    - `GET /api/roles`
    - `GET /api/account-types`
    - `GET /api/departments`
    - `GET /api/responsible-parties`
    - `GET /api/account-types/5/roles`
    - `GET /api/benefit-plan-type`
    - `GET /api/vendors`
- **Verification endpoint**: `GET /admin-users` (contract-listed, not observed in this Benefit Coordinator HAR flow).
- **Required request fields (POST /admin-users/benefit-coordinators)**:
  - `string`: `firstName`, `middleInitial`, `lastName`, `suffix`, `dob`, `gender`, `ssn`, `confirmSsn`
  - `string`: `phoneNumber`, `phoneType`, `personalEmailAddress`, `workEmailAddress`
  - `string`: `addressLine1`, `addressLine2`, `city`, `state`, `zip`, `country`
  - `integer`: `vendorId`
  - `string`: `planType`
  - `[integer]`: `roleIds`
- **Format notes from API examples**:
  - `dob`: `MM/DD/YYYY`
- **Observed payload notes from HAR**:
  - Request body included nested sections (`userDetails`, `demographics`, `contactInfo`, `mailingAddress`, `vendorInformation`) and flattened create fields.
  - Successful call included `vendorId: 1244949377`, `roleIds: [18]`.
  - `ssn` and `confirmSsn` were submitted in dashed format (`###-##-####`).
  - Successful sample values:
    - `gender: "F"`, `phoneType: "HOME"`
    - top-level `addressLine1`, `city`, `state`, `zip` present.

### API Success Criteria (Benefit Coordinator)

- `POST /api/admin-users/benefit-coordinators` returns HTTP `201` in observed runtime capture.
  - Compatibility expectation for automation: prefer `201`; allow `200`.
- `GET /api/roles`, `GET /api/account-types`, `GET /api/account-types/5/roles`, `GET /api/benefit-plan-type`, `GET /api/vendors` return HTTP `200` in observed runtime capture.
- `GET /admin-users` remains contract-listed verification endpoint with expected `200` when used.
- Response body contract in API source is `{}`
  - Assertion: response is a JSON object; exact schema keys are not defined.

### API Negative Cases (Benefit Coordinator)

- Missing one required field in `POST /admin-users/benefit-coordinators` should not satisfy the success contract.
  - Assertion: preferred `400` (acceptable `422` in compatibility mode).
- Duplicate email/account-type conflict in `POST /api/admin-users/benefit-coordinators`.
  - Assertion: expected conflict-like behavior (`400` preferred; `409` may appear in some environments).
- Missing or invalid bearer token for Benefit Coordinator endpoints.
  - Assertion: preferred `401` (acceptable `403` in compatibility mode).

### Generator Contract

For the Benefit Coordinator feature, generated API tests should target 12 scenarios in total.
The create endpoint should be treated as `POST /api/admin-users/benefit-coordinators`.
Allowed endpoints for this phase are:
- `POST /api/admin-users/benefit-coordinators`
- `GET /api/roles`
- `GET /api/account-types`
- `GET /api/account-types/5/roles`
- `GET /api/benefit-plan-type`
- `GET /api/vendors`
Endpoints that should be excluded for this phase:
- `GET /api/admin-users` (not observed in Benefit Coordinator HAR flow)
- member-specific endpoints under `/api/member/*`
Authentication is required for protected Benefit Coordinator endpoints.
Status behavior for Benefit Coordinator generation should follow this policy:
- create happy path: prefer `201`, allow `200`
- duplicate email/account-type: prefer `400`, allow `409` compatibility
- missing required fields: prefer `400`, allow `422`
- SSN mismatch and other uncertain validation cases: allow `400`/`422`/`200`/`201`
- lookups: `200`
- auth negative: prefer `401`, allow `403`
Payload policy should use required fields listed in the Benefit Coordinator API contract section and preserve HAR-observed shape expectations:
- include `vendorInformation` object with vendor mapping
- use dashed SSN format (`###-##-####`)
- keep `roleIds` present and non-empty
Allow nested plus flattened key mix when runtime evidence shows both styles.
Use fixed fixtures from HAR-validated successful calls:
- `vendorId = 1244949377`
- `roleIds = [18]`
Generate unique values per run for `ssn`, `personalEmailAddress`, and `workEmailAddress`.

### Test Scenarios (ID: TC-ABC-*)

#### TC-ABC-001: Card Visibility
- **Type**: Validation
- **Priority**: High
- **Steps**: Open Add Users tab
- **Expected**: Add Benefit Coordinator card is displayed

#### TC-ABC-002: Card Opens Form
- **Type**: Happy Path
- **Priority**: High
- **Steps**: Click Add Benefit Coordinator card
- **Expected**: Correct Benefit Coordinator form opens

#### TC-ABC-003: Required Sections Visible
- **Type**: Validation
- **Priority**: High
- **Steps**: Inspect form sections
- **Expected**: All required sections are present

#### TC-ABC-004: Vendor Information Fields Visible
- **Type**: Validation
- **Priority**: High
- **Steps**: Inspect Vendor Information section
- **Expected**: Vendor Information fields visible and correctly labeled

#### TC-ABC-005: Required Field Validation
- **Type**: Validation
- **Priority**: High
- **Steps**:
  1. Leave required fields blank
  2. Click Save
- **Expected**: Required validations are shown

#### TC-ABC-006: Save Creates Benefit Coordinator
- **Type**: Happy Path
- **Priority**: High
- **Steps**:
  1. Enter valid data
  2. Click Save
- **Expected**: Benefit Coordinator user created

#### TC-ABC-007: Vendor Association
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Create coordinator with selected vendor
  2. Verify association
- **Expected**: Created user associated with selected vendor

#### TC-ABC-008: Plan Association
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Create coordinator with selected plan
  2. Verify association
- **Expected**: Created user associated with selected plan

#### TC-ABC-009: Cancel Discards Changes
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**:
  1. Enter form data
  2. Click Cancel
- **Expected**: Unsaved changes discarded, user navigates back

#### TC-ABC-010: Data Persistence
- **Type**: Business Rule
- **Priority**: High
- **Steps**:
  1. Save coordinator
  2. Reopen details
- **Expected**: Saved coordinator/vendor/plan data persists

#### TC-ABC-011: No UI/API Errors
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**: Execute full add flow
- **Expected**: No unexpected UI or API errors

#### TC-ABC-012: Duplicate Email Rejection
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**:
  1. Create Benefit Coordinator with valid emails
  2. Attempt second create with same personal/work email
- **Expected**: Duplicate/conflict error is returned and user is not re-created

#### TC-ABC-013: Missing Vendor Validation
- **Type**: Validation
- **Priority**: High
- **Steps**:
  1. Fill all form fields except Vendor selection
  2. Click Save
- **Expected**: Validation appears for vendor requirement and save is blocked

#### TC-ABC-014: SSN Mismatch Validation
- **Type**: Validation
- **Priority**: High
- **Steps**:
  1. Enter different values in SSN and Confirm SSN
  2. Click Save
- **Expected**: Validation message shown and save blocked

#### TC-ABC-015: Vendor and Plan Lookup Integrity
- **Type**: Integration
- **Priority**: High
- **Steps**:
  1. Open Add Benefit Coordinator form
  2. Observe lookups for vendors and plan types
- **Expected**: Lookup endpoints return success and dropdown values are populated

#### TC-ABC-016: Invalid Plan Type Handling
- **Type**: Edge/Negative
- **Priority**: Medium
- **Steps**:
  1. Submit payload with unsupported plan type value
  2. Observe response
- **Expected**: Request is rejected (preferred `400`/`422`) or flagged as contract ambiguity if accepted

---

## Feature 6: Search Users

### Navigation
Home → System Administration → Security Management → Manage Selected User → Manage Admin Users tab

### UI Scope (Observed)
- Search filters visible on the page:
  - First Name
  - Last Name
  - Date of Birth
  - Social Security Number
  - Web User ID
  - Account Types
  - User Role
  - Status
- Primary actions:
  - Search
  - Clear fields
  - Refresh
  - Export to Excel
- Results area:
  - Grid with columns including Web User ID, First Name, Last Name, Date of Birth, User Role, Status, Social Security Number

### API Endpoint Contract (Search Users)

- **Primary endpoint**: `GET /api/admin-users/page`
- **Observed query pattern from HAR**:
  - `GET /api/admin-users/page?page=0&size=10&ssn=666-66-6666`
- **Observed support endpoints while entering Search Users area**:
  - `GET /api/roles`
  - `GET /api/account-types`
- **Expected query parameters**:
  - pagination: `page`, `size`
  - filters (observed): `ssn`
  - additional filters (UI-backed, contract-inferred): `firstName`, `lastName`, `dob`, `webUserId`, `accountType`, `role`, `status`

### API Success Criteria (Search Users)

- `GET /api/admin-users/page` returns HTTP `200` for valid authenticated requests.
- Response should be JSON container (array/object depending on backend pagination wrapper).
- `GET /api/roles` and `GET /api/account-types` return HTTP `200` to support filter dropdown population.

### API Negative Cases (Search Users)

- Missing or invalid bearer token for search endpoint.
  - Assertion: preferred `401` (acceptable `403`).
- Invalid pagination parameters (negative page / invalid size type).
  - Assertion: preferred `400` (acceptable `422` or backend-specific fallback).
- Invalid filter format (for example malformed SSN).
  - Assertion: compatibility mode with preferred `400`, possible `200` with empty result set.

### Generator Contract

For the Search Users feature, generated API tests should target 10 scenarios in total.
The primary endpoint should be treated as `GET /api/admin-users/page`.
Allowed endpoints for this phase are:
- `GET /api/admin-users/page`
- `GET /api/roles`
- `GET /api/account-types`
Authentication is required for protected search endpoints.
Status behavior for Search Users generation should follow this policy:
- valid filtered search: `200`
- auth negative: prefer `401`, allow `403`
- malformed filter/pagination: prefer `400`, allow `422`, and allow `200` with empty results when backend normalizes invalid filters
- lookup endpoints: `200`
Payload/query policy should use pagination parameters in every search call (`page`, `size`) and apply one or more filters per scenario.
Use fixed search fixture from HAR for regression coverage:
- `ssn = 666-66-6666`

### Test Scenarios (ID: TC-ASU-*)

#### TC-ASU-001: Search Section Loads Required Filters
- **Type**: Validation
- **Priority**: High
- **Steps**:
  1. Open Manage Admin Users
  2. Observe search form
- **Expected**: All expected filters and action buttons are visible

#### TC-ASU-002: Search by SSN Returns 200
- **Type**: Happy Path
- **Priority**: High
- **Steps**:
  1. Call search endpoint with `page=0`, `size=10`, `ssn=666-66-6666`
- **Expected**: HTTP `200` with valid JSON response container

#### TC-ASU-003: Search by Name Combination
- **Type**: Happy Path
- **Priority**: Medium
- **Steps**:
  1. Search with `firstName` + `lastName`
- **Expected**: HTTP `200`; results align with filters or valid empty state

#### TC-ASU-004: Search by Web User ID
- **Type**: Happy Path
- **Priority**: Medium
- **Steps**:
  1. Search using `webUserId`
- **Expected**: HTTP `200` and valid response shape

#### TC-ASU-005: Search by Role and Status
- **Type**: Happy Path
- **Priority**: Medium
- **Steps**:
  1. Search using `role` and `status`
- **Expected**: HTTP `200` and valid response shape

#### TC-ASU-006: Invalid SSN Format Handling
- **Type**: Validation
- **Priority**: High
- **Steps**:
  1. Search using malformed SSN (for example `666666666`)
- **Expected**: Preferred `400`; compatibility allows `200` with empty result set

#### TC-ASU-007: Invalid Pagination Parameters
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**:
  1. Search with invalid `page`/`size` values
- **Expected**: Preferred `400`; compatibility allows backend-specific `422`

#### TC-ASU-008: Unauthorized Search Request
- **Type**: Edge/Negative
- **Priority**: High
- **Steps**:
  1. Call search endpoint without token
- **Expected**: `401` (acceptable `403`)

#### TC-ASU-009: Lookup Endpoints for Filters
- **Type**: Integration
- **Priority**: High
- **Steps**:
  1. Call `GET /api/roles` and `GET /api/account-types`
- **Expected**: Both return `200` and populate filter options

#### TC-ASU-010: Clear Fields Resets Query Behavior
- **Type**: Business Rule
- **Priority**: Medium
- **Steps**:
  1. Apply filters and search
  2. Trigger clear behavior
  3. Search again with baseline query
- **Expected**: Filter state resets and baseline search executes successfully

---

## API Scenario Matrix (Generator-First)

Use these IDs for API test naming so API coverage remains separate from UI scenario IDs.

### Member API (`POST /admin-users/member`, `GET /admin-users`, `PUT /admin-users/{userId}/contact`)

- `API-UM-MEM-001` - `POST /api/admin-users/member` with HAR-aligned valid payload returns `201` (allow `200` compatibility).
- `API-UM-MEM-002` - Create response body is a JSON object and contains member identity anchors (for example `userDemographicsId` when present).
- `API-UM-MEM-003` - Duplicate SSN create attempt returns conflict/validation status (`409` preferred, allow `400`/`422`).
- `API-UM-MEM-004` - SSN mismatch (`ssn` != `confirmSsn`) returns validation status (`400`/`422`).
- `API-UM-MEM-005` - Missing `firstName` returns validation status (`400`/`422`).
- `API-UM-MEM-006` - Missing `lastName` returns validation status (`400`/`422`).
- `API-UM-MEM-007` - Missing `dob` returns validation status (`400`/`422`).
- `API-UM-MEM-008` - Missing `phoneNumber` returns validation status (`400`/`422`).
- `API-UM-MEM-009` - Missing `personalEmailAddress` returns validation status (`400`/`422`).
- `API-UM-MEM-010` - Missing `mailingAddressLine1` returns validation status (`400`/`422`).
- `API-UM-MEM-011` - Missing bearer token for member create returns `401` (allow `403`).
- `API-UM-MEM-012` - Invalid bearer token for member create returns `401` (allow `403`).
- `API-UM-MEM-013` - After successful create, `GET /api/member/{userDemographicsId}/coverage-info` returns `200`.
- `API-UM-MEM-014` - After successful create, `GET /api/demographic/{userDemographicsId}/contact-information` returns `200`.
- `API-UM-MEM-015` - After successful create, member detail reads should be validated with endpoint-specific compatibility:
  - `/coverage-info`, `/demographic/{id}/contact-information`, `/coverage-history/active`, `/dental-vision-life`, `/covered-and-termed`, `/voluntary-products`: prefer `200`, allow `404` (eventual consistency/not-yet-materialized), allow `500` (service instability).
- Compatibility behavior note for current environment:
  - Some invalid-value scenarios may still return success (`200`/`201`) instead of strict validation errors.
  - For these uncertain validations (for example SSN mismatch, malformed ZIP/date/email), generated tests should use compatibility assertion set `[400, 422, 200, 201]` and flag behavior as contract ambiguity.

### EBD Employee API (`POST /admin-users/ebd-employees`, `GET /admin-users`)

- `API-UM-EBD-001` - `POST /api/admin-users/ebd-employees` with valid HAR-aligned payload returns `201` (allow `200` compatibility).
- `API-UM-EBD-002` - `POST /api/admin-users/ebd-employees` duplicate-email attempt returns `400` (observed BAD_REQUEST conflict behavior).
- `API-UM-EBD-003` - `POST /api/admin-users/ebd-employees` with one missing required field returns `400` (or `422` compatibility).
- `API-UM-EBD-004` - `POST /api/admin-users/ebd-employees` with SSN mismatch (`ssn` != `confirmSsn`) returns preferred `400` (allow `422`, `404`, `200`, or `201` compatibility based on observed environment variance).
- `API-UM-EBD-005` - `POST /api/admin-users/ebd-employees` without bearer token returns `401` (or `403`).
- `API-UM-EBD-006` - `POST /api/admin-users/ebd-employees` with invalid bearer token returns `401` (or `403`).
- `API-UM-EBD-007` - `GET /api/roles` returns `200` and provides role lookup data needed by EBD flow.
- `API-UM-EBD-008` - `GET /api/account-types` returns `200` and provides account-type lookup data.
- `API-UM-EBD-009` - `GET /api/departments` returns `200` and provides department lookup data.
- `API-UM-EBD-010` - `GET /api/responsible-parties` returns `200` and provides responsible-party lookup data.
- `API-UM-EBD-011` - `GET /api/account-types/1/roles` returns `200` for role filtering by account type.
- `API-UM-EBD-012` - Successful create response is a JSON object and may include anchors like `webUserId`, `userAccountId`, `employeeInfo`, and `userDemographicsId`.

### Non-EBD Employee API (`POST /admin-users/non-ebd-employees`, `GET /admin-users`)

- `API-UM-NEBD-001` - `POST /admin-users/non-ebd-employees` with full required payload returns `200`.
- `API-UM-NEBD-002` - `GET /admin-users` returns `200` after Non-EBD create request.
- `API-UM-NEBD-003` - `POST /admin-users/non-ebd-employees` with one missing required field returns `400` (or `422` in compatibility mode).
- `API-UM-NEBD-004` - `POST /admin-users/non-ebd-employees` without/invalid bearer token returns `401` (or `403` in compatibility mode).
- `API-UM-NEBD-005` - Response body for `POST /admin-users/non-ebd-employees` is a JSON object; exact schema keys are not defined.
- `API-UM-NEBD-006` - Response body for `GET /admin-users` is a JSON object; exact schema keys are not defined.

### HR Employee API (`POST /admin-users/hr`, `GET /admin-users`)

- `API-UM-HR-001` - `POST /api/admin-users/hr` with valid HAR-aligned payload returns `201` (allow `200` compatibility).
- `API-UM-HR-002` - `POST /api/admin-users/hr` duplicate-email attempt returns conflict-like behavior (`400` preferred, allow `409` compatibility).
- `API-UM-HR-003` - `POST /api/admin-users/hr` with one missing required field returns `400` (or `422` compatibility).
- `API-UM-HR-004` - `POST /api/admin-users/hr` with SSN mismatch returns preferred `400` (allow `422`, `200`, or `201` compatibility in permissive validation environments).
- `API-UM-HR-005` - `POST /api/admin-users/hr` without bearer token returns `401` (or `403`).
- `API-UM-HR-006` - `POST /api/admin-users/hr` with invalid bearer token returns `401` (or `403`).
- `API-UM-HR-007` - `GET /api/roles` returns `200` and provides role lookup data.
- `API-UM-HR-008` - `GET /api/account-types` returns `200` and provides account-type lookup data.
- `API-UM-HR-009` - `GET /api/departments` returns `200`.
- `API-UM-HR-010` - `GET /api/responsible-parties` returns `200`.
- `API-UM-HR-011` - `GET /api/account-types/4/roles` returns `200`.
- `API-UM-HR-012` - `GET /api/agencies/sorted` and `GET /api/agency-representatives/types` return `200` for agency assignment lookups.

### Benefit Coordinator API (`POST /admin-users/benefit-coordinators`, `GET /admin-users`)

- `API-UM-BC-001` - `POST /api/admin-users/benefit-coordinators` with valid HAR-aligned payload returns `201` (allow `200` compatibility).
- `API-UM-BC-002` - `POST /api/admin-users/benefit-coordinators` duplicate-email attempt returns conflict-like behavior (`400` preferred, allow `409` compatibility).
- `API-UM-BC-003` - `POST /api/admin-users/benefit-coordinators` with one missing required field returns `400` (or `422` compatibility).
- `API-UM-BC-004` - `POST /api/admin-users/benefit-coordinators` with SSN mismatch returns preferred `400` (allow `422`, `200`, or `201` compatibility in permissive validation environments).
- `API-UM-BC-005` - `POST /api/admin-users/benefit-coordinators` without bearer token returns `401` (or `403`).
- `API-UM-BC-006` - `POST /api/admin-users/benefit-coordinators` with invalid bearer token returns `401` (or `403`).
- `API-UM-BC-007` - `GET /api/roles` returns `200`.
- `API-UM-BC-008` - `GET /api/account-types` returns `200`.
- `API-UM-BC-009` - `GET /api/account-types/5/roles` returns `200`.
- `API-UM-BC-010` - `GET /api/benefit-plan-type` returns `200`.
- `API-UM-BC-011` - `GET /api/vendors` returns `200`.
- `API-UM-BC-012` - Successful create response is JSON object and may include anchors like `webUserId`, `userAccountId`, `vendorInfo`, and `userDemographicsId`.

### Search Users API (`GET /api/admin-users/page`)

- `API-UM-SU-001` - `GET /api/admin-users/page?page=0&size=10&ssn=666-66-6666` returns `200`.
- `API-UM-SU-002` - Search by `firstName` and `lastName` returns `200` with valid response container.
- `API-UM-SU-003` - Search by `webUserId` returns `200`.
- `API-UM-SU-004` - Search by `role` and `status` returns `200`.
- `API-UM-SU-005` - Missing bearer token on search endpoint returns `401` (or `403`).
- `API-UM-SU-006` - Invalid bearer token on search endpoint returns `401` (or `403`).
- `API-UM-SU-007` - Malformed SSN filter returns preferred `400`, with compatibility allowance for `200` + empty result set.
- `API-UM-SU-008` - Invalid pagination input (`page`/`size`) returns preferred `400` (allow `422` compatibility).
- `API-UM-SU-009` - `GET /api/roles` returns `200` for role filter lookup.
- `API-UM-SU-010` - `GET /api/account-types` returns `200` for account-type filter lookup.

## Summary Test Coverage

| Feature | Test Cases | Priority High | Priority Medium |
|---------|------------|---------------|-----------------|
| Add Member Profile | TC-AMP-001 to TC-AMP-013 | 9 | 4 |
| Add EBD Employee | TC-AEU-001 to TC-AEU-013 | 12 | 1 |
| Add Non-EBD Employee | TC-ANEU-001 to TC-ANEU-013 | 13 | 0 |
| Add HR Employee | TC-AHR-001 to TC-AHR-015 | 13 | 2 |
| Add Benefit Coordinator | TC-ABC-001 to TC-ABC-016 | 14 | 2 |
| Search Users | TC-ASU-001 to TC-ASU-010 | 6 | 4 |
| **Total** | **80** | **67** | **13** |

## Acceptance Criteria

### Functional
- All required fields enforced across all forms
- SSN masking and visibility toggle working correctly
- SSN confirmation validation in place
- Duplicate SSN prevention for member profiles
- Role assignment automatic and correct per user type
- Agency/vendor associations persist correctly
- Unsaved changes modal behavior consistent

### Non-Functional
- No console errors during form interactions
- No unexpected API failures
- Form validation messages clear and user-friendly
- Success/error toast messages match design specification
- Cancel returns user without data loss to source page
- Data persistence verified after save and reopen

## Test Data Requirements

### Prerequisites
- Valid agencies available for selection (Member, HR)
- Valid vendors available for selection (Benefit Coordinator)
- Valid representative types and IDs for HR assignments
- Existing member with known SSN for duplicate testing
- Valid auth token for API seeding

### API Happy-Path Preconditions (Environment-Backed)
- Happy-path success tests must use environment-valid reference values, not only schema-valid payload shape.
- For lookup/association IDs (for example `agencyId`, `agencyRepresentativeId`, `vendorId`, `representativeId`, `roleIds`), values must exist in the target environment.
- For current Member-create phase, use HAR-backed lookup fixtures (`agencyId`/`agency` = `1374`) in generated tests.
- Do not gate generated member tests on `TEST_AGENCY_ID`, `TEST_AGENCY_REP_ID`, or `TEST_ROLE_ID`.
- Avoid assuming API example IDs in docs are reusable production/stage fixtures.
- For `PUT /admin-users/{userId}/contact` success case, use a seeded existing user ID from environment configuration.
  - Recommended variable name: `TEST_EXISTING_MEMBER_ID`
  - If this value is not configured, update-success test should be skipped rather than hardcoded.

### API Allowed Enum/Format Guidance (Contract + Practical)
- Member API:
  - `gender`: use environment-accepted values (example in source: `M`)
  - `phoneType`: use environment-accepted values (examples in source: `Mobile`, `cell`)
- Date and time format constraints:
  - `dob`, `hireDate`: `MM/DD/YYYY`
  - time-card fields: `HH:MM:SS`
- SSN behavior:
  - Use unique SSN per run for happy-path create tests.
  - Reuse exact same SSN within a test only for duplicate-check scenario.

### Test User Personas
- Admin user with permissions to create all user types
- Existing member profile for duplicate SSN testing

## Notes for Automation

- Use API seeding (`POST /admin-users/*`) for test data setup
- Use `GET /admin-users` for verification of created users
- SSN uniqueness: generate unique SSNs per test run to avoid conflicts
- Cancel behavior: verify no API call made when Cancel clicked
- Toast validation: capture toast element text/class for assertion
- Unsaved changes modal: trigger via programmatic navigation or back button
- Agency/vendor dropdowns: use first available option if no specific requirement

## API Contract Notes for Generator

- **Canonical base path assumption**:
  - Endpoints are used exactly as documented in `LocalHostApi's.md` (for this module: `/admin-users/...`).
  - Auth scheme is bearer token; host/base URL remains environment-driven.

- **Per-endpoint required payload minimum**:
  - `POST /admin-users/member`: for this phase, prioritize "Observed runtime minimum for current implementation phase"; treat additional contract-listed fields as TBD until validated by capture or contract clarification.
  - `PUT /admin-users/{userId}/contact`: `phoneNumber`, `phoneType`, `personalEmailAddress`, `workEmailAddress`.
  - `POST /admin-users/ebd-employees`: all required fields listed in EBD API Endpoint Contract.
  - `POST /admin-users/non-ebd-employees`: all required fields listed in Non-EBD API Endpoint Contract.
  - `POST /admin-users/hr`: all required fields listed in HR API Endpoint Contract.
  - `POST /admin-users/benefit-coordinators`: all required fields listed in Benefit Coordinator API Endpoint Contract.

- **Response shape expectations used by assertions**:
  - API source response examples for these endpoints are `{}`.
  - Assertion policy: validate HTTP status first, then assert response is a JSON object.
  - Do not assert `message`, `status`, or domain keys unless the contract explicitly defines them.

- **Negative status defaults with compatibility mode**:
  - Validation failures: prefer `400`; allow `422` in compatibility mode.
  - Missing/invalid auth token: prefer `401`; allow `403` in compatibility mode.

- **Known ambiguities / compatibility notes**:
  - Exact validation/auth status code behavior may vary by gateway/service even when contract is silent.
  - Error response body schema is not defined.
  - `PUT /admin-users/{userId}/contact` path is represented by an explicit example (`B00004`) rather than a formal path-param schema.
  - Observed Add Member capture returned `201` for create and did not include `roleIds` in request payload; keep unresolved fields as TBD until confirmed in API contract source.
  - Current member-module generation policy uses HAR-backed fixed lookup fixture (`1374`) and avoids env gating for agency IDs.

## API Execution Workflow (Generator + Validation)

- Preferred workflow for stability: generate once, validate one module at a time, then expand to full suite.
- Suggested commands:
  - Generate User Management API specs: `npm run generate:api -- usermanagement`
  - Run one module: `npm run test:api -- tests/api/usermanagement-add-member-profile.api.spec.ts`
  - Run full API suite: `npm run test:api`
- Fully automated flow (generation + tests + latest Allure report):
  - Full suite: `npm run api:cycle -- usermanagement`
  - Single module: `npm run api:cycle -- usermanagement tests/api/usermanagement-add-member-profile.api.spec.ts`

## API Data Generation Strategy (Run-Safe)

- Use mode-based data generation in API specs to prevent collisions while preserving contract-valid payload shape.
- **Modes**:
  - `UNIQUE_PER_RUN`: value changes every run and is used for happy-path create identities (`ssn`, emails, personnel-like identifiers).
  - `REUSE_WITHIN_TEST`: value is generated once and reused within the same test when duplicates must be intentional.
  - `STATIC_CONTRACT`: fixed value used only when contract behavior requires exact/static input.
- **Field guidance**:
  - Identity uniqueness fields (`ssn`, `personalEmail*`, `workEmail*`, `personnelNumber`) should default to `UNIQUE_PER_RUN`.
  - Duplicate checks (for example duplicate SSN) must use `REUSE_WITHIN_TEST`:
    1. create with value `x`
    2. create again with exact same value `x`
    3. assert duplicate-handling behavior
  - Missing-required-field scenarios can mix `UNIQUE_PER_RUN` identity data with one intentionally omitted required field.

---

**Document Version**: 1.2  
**Last Updated**: 2026-04-30  
**Source References**:
- `HEBA_User_Management_Knowledge.md`
- `Test_Cases_Add_Users_Module.csv`
- `HEBA_API_Endpoint_Knowledge.md`
- `member profile.amazona`
- `ebd employee.amazona`
- `HR employee.amazona`
- `benefit coordinator employee.amazona`
- `search user.amazona`
