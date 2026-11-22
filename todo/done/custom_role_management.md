# Custom Role Management (Add, Rename, Delete Roles)

## User Story

As an administrator,
I want to add new custom role types, rename existing custom roles inline, and delete custom roles from the **Manage Roles** interface,
So that I can tailor user permissions for specific squadron responsibilities without being limited to the default fixed roles (`Admin`, `Staff`, `NCO`, `Guest`).

---

## Description

Currently, `roles` in the SQLite database are seeded with four fixed role types (`Admin`, `Staff`, `NCO`, `Guest`), and the **Users -> Manage Roles** sub-tab in `pages/admin.php` only allows toggling permission checkboxes for those existing roles.

This feature extends `api/roles.php`, `pages/admin.php`, and `js/admin.js` to support full CRUD operations on role types while protecting core system roles (`Admin` and `Guest`) from deletion or rename lockouts.

---

## Key Requirements

### 0. Default Seeded Roles
* Ensure the system retains the existing set of default roles (`Admin`, `Staff`, `NCO`, `Guest`) and their current default permission mappings on installation/reset.

### 1. Add New Roles (Inline Table Row)
* Rather than a separate "Add Role" button or modal above the table, render a **blank row at the bottom of the Role Capabilities table** (`#roles-table-body`):
  * **Role column (first column):** Contains a text `<input>` placeholder (e.g., `"New role name..."`) instead of a static role title.
  * **Permission columns:** Pre-checked with the default view permissions (`view_home`, `view_displayboard`, `view_programme`, `view_documents`), allowing the admin to customize capabilities right in the row before clicking Add.
  * **Actions column (far right, where the delete button lives on existing rows):** Contains an **`Add +`** button to create the role with the selected permissions.
* Validate that the role name is non-empty and unique (case-insensitive check against existing roles).
* Refresh both the Role Capabilities matrix and the `rolesData` list used by the **Manage Users** role assignment dropdowns.

### 2. Rename Custom Roles Inline
* Allow custom roles (and optionally `Staff` / `NCO` if desired, while locking `Admin` and `Guest` because backend permission checks look up `'Admin'` and `'Guest'` by name) to be renamed inline in the Role Capabilities table.
* Enforce uniqueness when renaming and persist via `api/roles.php?action=rename` (or `PUT`).

### 3. Delete Custom Roles
* Add an **Actions** column on the far right of the Role Capabilities table containing a delete button for non-system roles (protecting `Admin` and `Guest`).
* Show a confirmation prompt (`<dialog>`) before deleting a role, warning if any users are currently assigned to that role (foreign key `ON DELETE SET NULL` on `users.role_id` will unassign affected users, or allow reassigning them).
* Ensure `role_permissions` entries for the deleted role are cleaned up (`DELETE FROM role_permissions WHERE role_id = ?`).

---

## Proposed Technical Changes

* **Backend (`api/roles.php`):**
  * `POST ?action=create`: Insert new role into `roles`, assign the submitted permission IDs (or default `view_*` permissions if none specified) in `role_permissions`, return new role ID and details.
  * `POST ?action=rename`: Validate role is not `Admin` or `Guest`, check for duplicate names, and update `roles.name`.
  * `POST ?action=delete`: Validate role is not `Admin` or `Guest`, nullify `users.role_id` for affected users, delete `role_permissions` and `roles` row inside a transaction.
* **Frontend (`pages/admin.php` & `js/admin.js`):**
  * Add an **Actions** header column on the far right of `#roles-table-head`.
  * Render inline rename controls on the role name cell and a delete button in the far-right Actions cell for non-system rows in `#roles-table-body`.
  * Append a blank creation row at the bottom of `#roles-table-body` with an `<input>` in the Role column, permission checkboxes (with `view_*` checked by default), and an **`Add +`** button in the far-right Actions column.
  * Sync `rolesData` in `js/admin.js` after role creation, rename, or deletion so user role dropdowns update without requiring a page reload.
* **Tests:**
  * Backend PHPUnit test covering role creation (with default view permissions), renaming, deletion, and protection of `Admin` / `Guest` roles.
  * Frontend Jest test verifying the Manage Roles table renders add/rename/delete controls and protects `Admin` and `Guest`.
