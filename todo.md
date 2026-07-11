# Proposed Feature Implementation Order

This document outlines the proposed order for implementing the pending features to ensure a logical progression based on existing code structure, appropriate timing of changes, and minimizing rework.

## 1. Floating Hamburger Menu (`todo/floating_hamburger_menu.md`)
**Justification:** This feature alters the global navigation layout across the site, replacing the existing header/sidebar approach with a bottom-right floating menu. This foundational UI change should be implemented first so that all subsequent new pages and UI adjustments are built against the final layout, avoiding the need to refactor them later.

## 2. Array-based Notes (`todo/array_based_notes.md`)
**Justification:** This feature modifies the core JSON data schema (converting notes from a string to an array) and requires significant updates to the UI rendering logic in both `programme.php` and `index.php`. Making these core data and structural changes early ensures that other UI additions on those same pages don't encounter integration conflicts or data structure mismatches later.

## 3. Tonight's Duties (`todo/tonights_duties.md`)
**Justification:** This adds new fields (`duty_nco` and `duty_cadet`) to `index.php`. Implementing this immediately after the data structure and rendering changes from the "Array-based Notes" feature allows us to build upon the updated page structure, minimizing merge conflicts or repeated layout adjustments on the same view.

## 4. Documents Page (`todo/documents_feature.md`)
**Justification:** This introduces an entirely new standalone page (`documents.php`). It is best to build this page after the global navigation (Floating Hamburger Menu) has been firmly established. This ensures the new page inherits the correct layout components natively without requiring later modification.

## 5. Document History (`todo/document-history.md`)
**Justification:** This feature is a direct enhancement to the new Documents Page, adding an amendment tracking system and history table. It naturally and logically follows the creation of the base page itself.

## 6. Print Stylesheet (`todo/print-stylesheet.md`)
**Justification:** The print stylesheet relies heavily on a finalized, stable DOM structure, specifically requiring the hiding of complex UI elements like the floating hamburger menu and correctly formatting tables on `programme.php`. Implementing this last ensures we are applying print rules against a complete HTML structure, guaranteeing all elements are accounted for and styled appropriately for export.
