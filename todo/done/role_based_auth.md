User Story

As an administrator,

I want to approve new user registrations and assign specific roles (Admin, Staff, NCO),

So that I can control who can modify data while keeping the general content publicly viewable.

---

Description

This feature replaces the single-admin system with an authentication and authorization framework. The application will be public-by-default for viewing data, but requires a logged-in account with an assigned role to perform actions. New users can request an account, which must be vetted and authorized by an Admin.

---

Key Requirements

• Public Access (No Login Required):

  • All users can view data anonymously. No login or "Viewer" role is required for read-only access.

• Defined User Roles:

  • Admin: Full system access, user management, and approval rights.

  • Staff / NCO: Internal roles with specific operational privileges.

• Sign-Up & Approval Workflow:

  • Public users can trigger a sign-up request.

  • Newly registered accounts remain disabled/pending by default.

  • Admins must approve the user and assign their specific user type.

• UI/UX Adaptability:

  • Hide write/edit UI elements for public or unauthorized users.

  • Clearly disable or message restricted actions if accessed without proper privileges.

---

Proposed Implementation Ideas

• Add a `status` field and a `role` field to the user schema.

• Create an Admin-only dashboard view for managing pending sign-up requests.

• Ensure all backend mutation endpoints validate that the requesting user is active and possesses the required role.