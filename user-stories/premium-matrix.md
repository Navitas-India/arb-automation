# Premium Matrix Upload

## As
An EBD Staff member (Administrator)

## I want to
Upload a Premium Matrix Excel file for a specific plan year

## So that
Members can see the correct monthly premium amounts for their health plan

## Acceptance Criteria
- I can navigate to the Premium Matrix section after logging in
- I can upload a valid Excel file (.xlsx) and select the plan year
- After clicking Upload I see a success confirmation
- The uploaded data is visible in the table when I filter by that year

## Negative Cases
- Upload without logging in → 401 Unauthorised
- Upload a PDF or non-Excel file → validation error about file format
- Upload with a year that does not match the file content → year mismatch error
- Upload an empty Excel file (headers only, no data rows) → error or warning shown
