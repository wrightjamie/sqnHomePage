## Documents Page Feature

User Story

As an administrator or user,

I want to access a dedicated `documents.php` page using our existing authentication and menu framework, and easily navigate back to the schedule via a global programme link button,

So that core site architecture remains uniform and navigation between pages is fluid.

---

Description

This feature integrates the newly proposed `documents.php` system directly into the application's existing core infrastructure. It ensures that role-based protections and menu-rendering components are reused without creating standalone logic, and adds a universal "Programme" shortcut link to improve cross-page navigation.

---

Key Requirements

• Framework Integration:

  • Existing Authentication: Use the system's current session/auth handlers on `documents.php` to identify roles and restrict edit/version controls strictly to Admins.

  • Existing Menu System: Register the new page into the central menu configuration array/component so it dynamically builds within the layout like all other views.

• Header Layout Adaptation:

  • Render the signature "swoosh" graphic block rotated horizontally to span across the top of the page layout instead of down the left-hand margin.

• Global Navigation Button:

  • Add a prominent, styled "Programme" shortcut link/button across other core application pages to allow immediate return to the main training schedule.

• Content, Versioning & Print Rules:

  • Rich text editor support (H1-H3, bold, italics, tables, images, lists).

  • Input for Issue Number (e.g., `1.0`, `2.1`) which automatically refreshes the Issue Date to the current date on change.

  • Print styles (`@media print`): Every H1 starts on a fresh page. Running header at the top; footer at the bottom displaying the Document Heading alongside the page number.

---

Proposed Implementation Ideas

• Include the core layout/auth check template files (e.g., `require('auth.php');`) at the top of `documents.php`.

• Inject the "Programme" shortcut link directly into the global header or main navigation component script.
---

Admin Page Versioning Guidance (`admin.php`):

• Display a clear, persistent guidance block within the editor panel to standardize versioning updates.

• Point Releases (e.g., `1.1`, `1.2`): Strictly used for minor adjustments such as typos, clarifications, and quick corrections.

• Full Releases (e.g., `2.0`, `3.0`): Reserved exclusively for structural changes, significant updates, or the addition of entirely new training material.

• Place this guidance directly adjacent to or immediately beneath the Issue Number input field on the document editing form to serve as an instant helper text/tooltip for staff.
