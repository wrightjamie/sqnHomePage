## Document History / Record of Amendments

User Story

As a user reviewing squadron reference documentation,
I want to view a clear history of what changed between document versions,
So that I can easily identify policy updates or procedural changes without re-reading the entire text.

---

Description

This feature enhances the versioning control system on `documents.php`. Building on top of the dynamic Issue Number and automated Issue Date functionality, it introduces an optional Amendment Summary field during editing. These entries will be collected and rendered as a formal "Document History" or "Record of Amendments" table at the bottom of the document.

---

Key Requirements

• Amendment Tracking (Editor Panel):
  • When an Admin updates the Issue Number, provide a text input field for a brief Amendment Summary (e.g., "Updated uniform guidelines for seasonal change").

• Historical Data Retention:
  • The system must log these updates as a historical array or table, ensuring that previous version numbers, dates, and change logs are completely preserved rather than overwritten.

• Document History Table Layout:
  • Automatically render a structured Record of Amendments table at the bottom of the document.
  • The table layout should include columns for: Issue No., Date, and Summary of Changes.

• Print Stylesheet Integration:
  • Ensure the Document History table is fully optimized for print styles (`@media print`), rendering cleanly at the end of the hardcopy document.

---

Proposed Implementation Ideas

• Evolve the document schema to include a nested `history` array of objects (each containing `issue_number`, `issue_date`, and `summary`).
• When saving a document update where the version changes, append the new version details to this array before writing to disk.
