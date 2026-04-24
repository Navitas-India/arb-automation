# Agency Management

## As
An EBD Staff member (Administrator)

## I want to
Create, view, update, and manage insurance agencies and their associated agents in the ARBenefits portal

## So that
The correct agencies and agents are linked to benefit plans and member enrollments

## Acceptance Criteria
- I can navigate to the Agency section from the admin dashboard after logging in
- I can view the list of all agencies with name, contact details, and status
- I can create a new agency by filling in name, address, phone, email, and NPN number
- After saving, the new agency appears in the agency list
- I can click an existing agency and update its details
- I can add agents to an agency with their name, NPN, and contact information
- I can deactivate an agency and it no longer appears in active listings

## Negative Cases
- Access agency section without logging in → redirected to login page or 401 Unauthorised
- Create agency with missing required fields (name or NPN blank) → validation error shown per field
- Create agency with a duplicate NPN → error message "NPN already exists"
- Enter invalid phone number format → field-level validation error
- Enter invalid email format → field-level validation error
