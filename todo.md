Description
Introduces a dedicated print stylesheet (`@media print`) for the training schedule page (`programme.php`). When a user prints the schedule or exports it to a PDF, the layout dynamically refactors to maximize readability on standard A4 paper. This feature strips away non-essential web interface noise while deliberately retaining background and border colors used for uniform and dress code indicators to ensure physical copies remain operationally useful.

Key Requirements
• UI Noise Elimination: Automatically hide web-only interface elements during print execution, including the header, footer, floating corner hamburger menu, persistent action overlays, and configuration buttons.

• Color Preservation for Uniform Indicators: Explicitly preserve structural CSS background fills, text colors, and borders that designate specific uniform requirements (e.g., Working Blue, Coveralls, No. 1 Dress) using print properties that force color rendering.

• General Layout Optimization: Force non-uniform text elements to a high-contrast dark color and set the main body layout to utilize the full width of standard paper margins.

• Page Break Management: Configure table rows and schedule blocks to prevent individual rows or multi-line event slots from awkwardly splitting across page breaks. Ensure section headers are pinned to their subsequent content.

• Repeated Table Headers: Ensure that table column headers (`<thead>`) automatically repeat at the top of the page if the monthly or weekly programme spans multiple physical sheets.

Implementation Goals
• Integrate a targeted `@media print` block into the existing stylesheet framework.

• Apply broad layout resets for typography and layout wrappers.

• Override standard ink-saving behavior by applying `color-adjust: exact` (and its vendor-prefixed variants) specifically to the elements, classes, or table cells handling the uniform matrix data.

• Validate visual output across standard print previews to guarantee uniform color visibility remains distinct and legible.

---

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
