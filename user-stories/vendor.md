# Vendor Management

## As
An EBD Staff member (Administrator)

## I want to
Create, view, and manage insurance vendors (carriers) in the ARBenefits portal

## So that
Benefit plans can be correctly linked to the insurance carriers that provide coverage

## Acceptance Criteria
- I can navigate to the Vendor section from the admin dashboard after logging in
- I can view the list of all vendors with name, type, contact details, and status
- I can create a new vendor by providing name, vendor type, address, phone, and email
- After saving, the new vendor appears in the vendor list
- I can edit an existing vendor and save updated details
- I can deactivate a vendor and it is marked inactive in the list
- I can search or filter vendors by name or status

## Negative Cases
- Access vendor section without logging in → redirected to login page or 401 Unauthorised
- Create vendor with blank name → validation error on the name field
- Create vendor with missing required contact fields → field-level validation errors displayed
- Enter invalid email format → validation error on email field
- Enter invalid phone number → validation error on phone field
- Attempt to delete a vendor linked to an active benefit plan → error message preventing deletion
