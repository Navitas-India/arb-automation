# Reference Data Management

## As
An EBD Staff member (Administrator)

## I want to
View and manage reference data such as plan types, coverage tiers, deduction codes, and benefit categories

## So that
All dropdown lists and configurable values across the portal are kept accurate and up to date

## Acceptance Criteria
- I can navigate to the Reference Data section from the admin dashboard after logging in
- I can view a list of reference data categories (e.g. Plan Types, Coverage Tiers, Deduction Codes)
- I can click a category and see all values within it
- I can add a new value to any reference data category
- I can edit the label or description of an existing reference value
- I can deactivate a reference value so it no longer appears in dropdowns
- Changes are reflected immediately across all forms that use that reference data

## Negative Cases
- Access reference data section without logging in → redirected to login page or 401 Unauthorised
- Add a reference value with a blank label → validation error on the label field
- Add a duplicate value in the same category → error message "Value already exists"
- Deactivate a reference value that is currently in use by active records → warning shown before allowing deactivation
- Non-admin user attempts to modify reference data → 403 Forbidden or access denied message
