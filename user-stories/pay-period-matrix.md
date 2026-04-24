# Pay Period Matrix

## As
An EBD Staff member (Administrator)

## I want to
View and manage the Pay Period Matrix for each agency

## So that
Correct premium deduction schedules are applied per agency's pay frequency

## Acceptance Criteria
- I can view the pay period matrix for a given agency
- Pay period types are visible (weekly, bi-weekly, semi-monthly, monthly)
- I can update the deduction amounts for a pay period
- Changes are saved and reflected immediately

## Negative Cases
- Access without login → 401 Unauthorised
- Update with invalid amounts → 400 validation error
- Access matrix for non-existent agency → 404
