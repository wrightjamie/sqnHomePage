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

As an administrator or staff member configuring the display board,

I want to add a new slide type that displays a full month's training schedule fetched directly from our monthly JSON datastore,

So that cadets and visitors can view upcoming activities at a glance using the exact layout aesthetic found on `programme.php`.

---

Description

This feature introduces a new Monthly Programme Slide type to the `index.php` rotation. Instead of querying individual days, the slide will leverage our existing monthly datastore architecture—where all training data for a given month is kept inside a single JSON file. The slide configuration will allow the editor to specify which month to display using a relative time delta.

---

Key Requirements

• New Slide Variant (`index.php`):

  • Add a new slide type option to the display board system for a full monthly overview.

• Consistent Styling Integration:

  • Replicate the exact visual layout and CSS styling used on the main `programme.php` page for seamless cohesion.

• JSON Datastore Integration:

  • The rendering logic should fetch data directly from the monthly JSON datastore structure. No individual day selection or custom date range filtering is required.

• Dynamic Relative Month Selector (Editor Panel):

  • In the slide editor, provide a setting to define the displayed month using a relative time delta from the current date:

    • `0` = This Month

    • `+1` = Next Month

    • `+2` = Two Months Out

  • The slide must dynamically resolve this delta to load the correct monthly JSON file automatically as the calendar moves forward.

---

Proposed Implementation Ideas

• Use the configured relative `month_delta` to build the target filename string for the monthly JSON file (e.g., matching the application's file naming pattern for year/month).

• Parse the loaded JSON payload directly within the slide rendering loop to display the complete month's schedule inline.
