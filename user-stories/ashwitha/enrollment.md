# Member Enrollment

## As
An EBD Staff member

## I want to
Enroll a member into a health plan

## So that
The member is covered and their monthly premium deductions are set up

## Acceptance Criteria
- I can select a member and choose a plan type (HMO, PPO, HDHP)
- Submitting a valid enrollment saves the record with status ACTIVE
- I can view the enrollment history for any member, newest first

## Negative Cases
- Enroll a member aged under 18 → rejected with clear error message
- Enroll a member aged over 65 → rejected with clear error message
- Enroll a member with salary below 20,000 → rejected with clear error message
- Enroll a member already ACTIVE on the same plan → 409 duplicate error
- Attempt enrollment without authentication → 401 Unauthorised
