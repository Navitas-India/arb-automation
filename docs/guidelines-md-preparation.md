# Story Markdown Preparation Guidelines

Use this guide to prepare module-level `.md` content that the API generator can reliably consume without hardcoded code rules.

## Purpose

- Keep module-specific behavior in story documents.
- Keep generator logic generic and reusable across current and future modules.
- Make HAR evidence and API contracts explicit, testable, and deterministic.

## Required Section Template (Per Module)

For every feature module, include these sections in this order:

1. `## Feature N: <Module Name>`
2. `### Business Intent`
3. `### API Endpoint Contract`
4. `### API Success Criteria`
5. `### API Negative Cases`
6. `### API Scenario Matrix`
7. `### Test Data Plan`
8. `### Generator Contract`
9. `### Open Questions / TBD`

## Inputs Required Before Authoring

Gather these inputs first:

- Canonical endpoint contract (source-of-truth API doc).
- HAR capture for the module flow (login + module action).
- Observed request payloads and statuses from HAR.
- Observed lookup and post-create read endpoints.
- Known environment instability notes (if any).
- Test data constraints (unique fields, fixed fixtures, enum values).

## How To Write API Sections

### API Endpoint Contract

Document both:

- Canonical endpoints and fields from API contract.
- Observed runtime endpoints and payload notes from HAR.

If they differ, keep both and mark differences as compatibility or TBD.

### API Success Criteria

For each key endpoint:

- Preferred status code.
- Allowed compatibility status codes (if observed variance exists).
- Response assertion shape policy (schema keys vs object/array container only).

### API Negative Cases

At minimum cover:

- Missing required fields.
- Invalid format/value.
- Duplicate conflict behavior.
- Missing token.
- Invalid token.

### API Scenario Matrix

Use stable IDs and one-line expected behavior. Example:

- `API-<MODULE>-001` Happy create.
- `API-<MODULE>-002` Duplicate conflict.
- `API-<MODULE>-003` Missing required field.
- `API-<MODULE>-004` Invalid format.
- `API-<MODULE>-005` Missing auth.
- `API-<MODULE>-006` Invalid auth.
- Additional lookup/read scenarios as needed.

## Test Data Plan Rules

For each critical field define strategy:

- `FIXED` for known lookup fixtures.
- `UNIQUE_PER_RUN` for identity fields.
- `REUSE_WITHIN_TEST` for duplicate scenarios.
- `OPTIONAL/TBD` for uncertain fields.

Also define:

- Which values are HAR-backed fixed fixtures.
- Which values are generated per test.
- Which fields must not be asserted strictly yet.

## Generator Contract (Text-Only Section)

Each module must include a `### Generator Contract` section written as normal human-readable text.
Do not use config-like key/value syntax, JSON-like notation, or pseudo-code in this section.
Describe these items in plain English paragraphs and bullets:

- target test count for the selected module
- create endpoint and allowed endpoint set
- excluded endpoints for this phase
- auth expectation
- status behavior (preferred + compatibility)
- payload behavior (required now vs optional/TBD)
- test-data fixture behavior (fixed vs unique-per-run)
- compatibility interpretation notes (for example 404/500 handling)

The generator should consume this as text guidance, not as strict schema syntax.

## Quality Checklist Before Generation

- Endpoints align to selected module only.
- Status policy includes preferred + compatibility values.
- Scenarios are complete and non-duplicated.
- Test data strategy is explicit for unique/duplicate cases.
- TBD items are clearly marked and not silently assumed.

