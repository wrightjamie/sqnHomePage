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
