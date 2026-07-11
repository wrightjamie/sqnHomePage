# Proposed Feature Implementation Order

This document outlines the proposed order for implementing the pending features to ensure a logical progression based on existing code structure, appropriate timing of changes, and minimizing rework.

## 1. Addition of Tests (`todo/addition_of_tests.md`)
**Justification:** Establishing a comprehensive test suite (frontend and backend) should be the very first step. Doing this before introducing new features or refactoring ensures that existing functionality is protected against regressions during subsequent changes.

## 2. Floating Hamburger Menu (`todo/floating_hamburger_menu.md`)
**Justification:** This feature alters the global navigation layout across the site, replacing the existing header/sidebar approach with a bottom-right floating menu. This foundational UI change should be implemented first so that all subsequent new pages and UI adjustments are built against the final layout, avoiding the need to refactor them later.

## 3. Array-based Notes (`todo/array_based_notes.md`)
**Justification:** This feature modifies the core JSON data schema (converting notes from a string to an array) and requires significant updates to the UI rendering logic in both `programme.php` and `index.php`. Making these core data and structural changes early ensures that other UI additions on those same pages don't encounter integration conflicts or data structure mismatches later.

## 4. Tonight's Duties (`todo/tonights_duties.md`)
**Justification:** This adds new fields (`duty_nco` and `duty_cadet`) to `index.php`. Implementing this immediately after the data structure and rendering changes from the "Array-based Notes" feature allows us to build upon the updated page structure, minimizing merge conflicts or repeated layout adjustments on the same view.

## 5. Documents Page (`todo/documents_feature.md`)
**Justification:** This introduces an entirely new standalone page (`documents.php`). It is best to build this page after the global navigation (Floating Hamburger Menu) has been firmly established. This ensures the new page inherits the correct layout components natively without requiring later modification.

## 6. Document History (`todo/document-history.md`)
**Justification:** This feature is a direct enhancement to the new Documents Page, adding an amendment tracking system and history table. It naturally and logically follows the creation of the base page itself.

## 7. Print Stylesheet (`todo/print-stylesheet.md`)
**Justification:** The print stylesheet relies heavily on a finalized, stable DOM structure, specifically requiring the hiding of complex UI elements like the floating hamburger menu and correctly formatting tables on `programme.php`. Implementing this last ensures we are applying print rules against a complete HTML structure, guaranteeing all elements are accounted for and styled appropriately for export.

## 8. Global Notification (Toast) System (`todo/global_notification_system.md`)
**Justification:** This feature introduces a robust, global notification system for application-wide feedback. It provides a foundational UI feedback mechanism that should be established before building complex features like Role-Based Auth, User Management, and Secure System Reset, allowing them to leverage it for permission errors and form confirmations.

## 9. Role-Based Auth & Registration (`todo/role_based_auth.md`)
**Justification:** This feature establishes the core authentication framework, roles, and sign-up workflow. It should be implemented after the UI layout has stabilized but before full user management interfaces are built, as it provides the underlying structure and permissions model that subsequent administrative features will rely upon.

## 10. User Management (`todo/user_management.md`)
**Justification:** This is a major administrative feature that provides the CRUD interface for managing roles and accounts. It naturally follows the implementation of the core Role-Based Auth framework (Step 9), ensuring that dynamic permission models and admin navigation are applied to a fully established authentication system.

## 11. Secure System Reset (`todo/secure_system_reset.md`)
**Justification:** This feature requires an administrator to explicitly re-type their active login password to authorize the execution of a system reset script. Therefore, it critically relies on the authentication system and user roles established in the previous two steps (Role-Based Auth and User Management) being fully operational.
