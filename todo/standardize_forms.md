# Feature Request: Standardize Form Elements Globally

**Status:** Proposed
**Priority:** Low / Cleanup

## Description
Currently, form elements across the application (such as the `+` add button for NCOs, trash buttons in various lists, and generic text inputs) lack a unified visual structure. We need to standardize all form elements using a common set of CSS utility classes.

## Requirements
- [ ] Ensure all action buttons use `.btn` along with a modifier like `.btn-primary`, `.btn-secondary`, or `.btn-error`.
- [ ] Ensure all destructive actions (Trash cans, Delete buttons) are explicitly styled in red (`.text-error` or `.btn-error`).
- [ ] Ensure all standard text inputs use the `.form-control` or `.input-field` class for uniform padding and border styling.
- [ ] Review `admin.php`, `reset.php`, and JS-generated UI components (like the Documents list) to apply these standardized classes.
