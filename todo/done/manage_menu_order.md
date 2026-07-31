# Feature Request: Manage Menu Order

## Description
The user requested a feature to manage the order of the menu pages (Home, Programme, Slideshow, Documents) directly from the settings (admin panel). Currently, the menu order is hardcoded in `components/menu.php`.

## Requirements
- Add a new section or tab to the `admin.php` page (Admin Panel).
- The section should only be accessible to users with the appropriate admin permissions.
- Provide a UI (e.g., drag-and-drop or up/down arrows) to reorder the menu items:
  - Home
  - Programme
  - Slideshow (Display Board)
  - Documents
- Save the configured order to the SQLite database (e.g., in the `settings` table).
- Update the backend API to handle saving/retrieving the menu order.
- Update `components/menu.php` to render the menu items based on the saved order dynamically, rather than using the hardcoded order.
- Ensure the current page is still hidden from the menu, regardless of its position in the dynamic order.

## Implementation Details
1. **Database:** Determine if a new key in the `settings` table (e.g., `menu_order`) is sufficient. It could store a JSON array of page identifiers.
2. **Backend API:** Create endpoints (or extend existing admin endpoints) to GET and POST the `menu_order`.
3. **Frontend Admin:** Build the UI in `admin.php` and use JavaScript to handle reordering and submitting to the API.
4. **Frontend Render:** In `components/menu.php`, fetch the `menu_order` setting (perhaps cache it in the session or fetch it once per page load) and loop through the ordered list to render the `<a>` tags for the menu, checking permissions (`hasPermission`) and visibility (`$currentPage`) for each.

## Status
Pending instruction to implement.
