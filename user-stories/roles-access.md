# Roles and Access Control

## As
An EBD Staff member (Administrator)

## I want to
View and manage user roles and their associated permissions in the ARBenefits portal

## So that
Only authorised users can access sensitive sections, and each role sees only what it needs

## Acceptance Criteria
- I can navigate to the Roles section from the admin dashboard after logging in
- I can view the list of all roles with their name and description
- I can click a role and see the full list of permissions assigned to it
- I can assign or remove permissions for a role and save the changes
- Changes to role permissions take effect immediately without requiring a restart
- I can see which users are assigned to each role
- I can assign a role to an existing user from the user management screen

## Negative Cases
- Access roles section without logging in → redirected to login page or 401 Unauthorised
- Non-admin user attempts to access roles section → 403 Forbidden or access denied message
- Remove all permissions from a role and save → system shows warning or prevents saving if role is in use
- Assign a role to a user who already has that role → no duplicate entry created, idempotent
- Access a role by direct URL that does not exist → 404 not found page shown
