User Story

As an administrator,
I want to dynamically configure role capabilities, manage custom user types, and perform CRUD operations on user profiles from a dedicated interface,
So that I can easily manage system access and adapt permissions without updating application code.

---

Description

This feature adds the administrative interfaces required to manage the multi-user system. It consists of two primary views within the Admin panel: a Role Configuration Page (for managing user types and their respective capabilities) and a User Management Page (for managing individual accounts).

---

Key Requirements

• Role Configuration Page (User Types & Capabilities):
  • Dynamic Permissions: Admin can edit what each user type (Admin, Staff, NCO) is capable of actioning.
  • Manage User Types: Ability to dynamically add new custom user types or remove existing ones.

• User Management Page:
  • Full CRUD Actions: Admin can manually add, edit, and delete user accounts.
  • Account Editing: Ability to modify existing users' details, reset/change their password, or update their assigned user type/status.

• UI/UX & Safety:
  • Restrict access to these pages strictly to users with the Admin role.
  • Add confirmation prompts before deleting a user type or account to prevent accidental data loss or orphaned user profiles.

---

Proposed Implementation Ideas

• Implement a database schema that maps dynamic permissions/capabilities to user roles (moving beyond a hardcoded role enum if necessary).
• Ensure backend API routes for updating roles and user profiles strictly enforce Admin-level authentication.
