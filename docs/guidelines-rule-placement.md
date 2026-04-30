# Rule Placement Guidelines

Use this guide to decide whether a rule belongs in generator code (generic) or in story markdown (module-specific).

## Decision Rule

Ask for every new rule:

- Is this always true across all modules (current and future)?
  - Yes -> keep in generator code.
  - No -> define in module story markdown (`### Generator Contract`).

## Rules That Must Stay Generic (Generator Code)

- TypeScript/Playwright structure validity.
- Required baseline imports and test declarations.
- Presence of status assertions.
- Presence of response assertions.
- Minimum baseline coverage (happy + negative).
- Avoid malformed generated output (syntax artifacts/trailing junk).
- Use `apiBase` helper pattern consistently.
- Ensure generated spec scope matches selected module section.

These rules are universal quality and safety rails.

## Rules That Must Be Module-Specific (Story Markdown)

- Concrete endpoint paths for module operations.
- Fixed IDs or fixtures (for example lookup IDs).
- Module-specific test counts (e.g., 15 for one module, 10 for another).
- Module-specific status compatibility sets.
- Module-specific allowed/excluded endpoints.
- Module-specific payload key requirements.
- Known instability allowances for specific endpoints.
- Runtime-observed behavior derived from HAR captures.

These rules describe domain behavior, not generator architecture.

## Anti-Patterns (Avoid in Generator Code)

- Hardcoded module IDs or lookup constants.
- Multiple `if module == X` validator branches for business behavior.
- Endpoint-specific status expectations tied to one feature.
- Forcing one module’s assumptions onto all modules.

If needed temporarily, tag clearly as migration-only and move to markdown contract in the next cycle.

## Migration Pattern

1. Move existing module hardcoding into `### Generator Contract` blocks.
2. Reduce generator validation to universal checks plus contract-driven checks.
3. Parse contract from selected section and enforce it dynamically.
4. Add new module by editing markdown only; avoid generator code edits where possible.

## Contract-Driven Validation Strategy

Validation should read from parsed contract:

- target test count
- allowed endpoint set
- required scenario classes
- status compatibility map
- exclusion list

This keeps generator extensible and prevents overfitting drift.

