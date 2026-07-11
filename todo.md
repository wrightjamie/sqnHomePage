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

User Story

As a training administrator,

I want to manage training notes as separate, individual list items rather than a single text block,

So that I can add, remove, and reorder notes using simple arrow controls while taking advantage of autocomplete suggestions for common entries.

---

Description

This feature upgrades the "Notes" architecture for both single training nights and full months. Converting notes into an array-based list allows the editor interface to support fast entry manipulation, sequential reordering using directional arrows, and smart typeahead suggestions derived from loaded cache data and historically common values.

---

Key Requirements

• From Text Field to Array List:

  • Migrate data structures so that notes are stored as an ordered list of strings rather than a single block of text.

• Smart Entry UI & Autocomplete:

  • Memory Pool Fetching: Pool all note strings from the surrounding months currently loaded into memory (Previous, Current, and Next Month).

  • Native Input Typeahead: Populate standard input suggestions from this memory pool to auto-complete familiar phrases as an editor types.

  • Quick-Pick Panel: Display a section of highly repeated "Common Notes" that can be clicked to instantly append to the active list.

• Arrow-Based Reordering:

  • Provide simple up and down arrow buttons next to each note item within the editor view to adjust their display sequence cleanly.

• Component-Based Rendering:

  • Both `programme.php` and `index.php` will loop through the new array structure, rendering each note item cleanly as an independent line or list item.

---

Proposed Implementation Ideas

• Modify the schema of the monthly JSON data file to nest a structured array block under the `notes` key for nights and months.

• Use a lightweight array indexing approach on the edit form state to swap positions dynamically when the up or down arrow buttons are clicked.
