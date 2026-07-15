# Code Quality Improvements

This document outlines code quality findings from Fallow (JS) and Stylelint (CSS) that should be addressed to improve maintainability and adherence to modern standards.

## JavaScript (Fallow Analysis)

*   **Overall Maintainability:** The average maintainability index is 73.6/100 across 22 analyzed files. Fallow identified 62 high-complexity functions.
*   **Duplication:** Found 4 clone groups representing 112 duplicated lines (~1.6% duplication) across `css/pages/home-editor.css`, `js/display-board.js`, and `js/home.js`.
*   **Primary Refactoring Target:** `js/display-board.js`
    *   **Action:** Extract the `renderSlide` function (cognitive complexity: 66) into smaller, more manageable functions.
*   **Other High-Complexity Functions to Review:**
    *   `js/display-board.js`: `renderProgrammeNight` (CRAP: 420.0)
    *   `js/programme-editor.js`: `handleDrop` (CRAP: 380.0)
    *   `js/home.js`: Arrow function at line 170 (CRAP: 272.0)
    *   `js/home-editor.js`: `toggleEditMode` (CRAP: 240.0)
    *   `js/admin.js`: Arrow function at line 205 (CRAP: 182.0)
    *   `js/programme.js`: `createRow` (CRAP: 156.0)

## CSS (Stylelint Analysis)

*   **Overall Issues:** Found a total of 471 formatting and convention issues across the CSS codebase based on the `stylelint-config-standard` ruleset.
*   **Key Violations to Fix:**
    *   **Color Function Notation:** Update legacy `rgba()` and `hsla()` functions to modern `rgb()`/`hsl()` syntax (e.g., `rgb(0 0 0 / 50%)`). (312 occurrences: 104 color-function-notation, 104 color-function-alias-notation, 104 alpha-value-notation)
    *   **Rule Empty Lines:** Add empty lines before rules to improve readability. (67 occurrences)
    *   **Single-line Declarations:** Avoid multiple declarations on a single line; maximum is 1. (57 occurrences)
    *   **Descending Specificity:** Address 10 occurrences of `no-descending-specificity` (selectors with higher specificity coming before those with lower specificity).
    *   **Hex Length:** Use shorthand hex colors where possible (e.g., `#555` instead of `#555555`). (7 occurrences)
    *   **Vendor Prefixes:** Remove unnecessary vendor prefixes (4 occurrences of `property-no-vendor-prefix`).
