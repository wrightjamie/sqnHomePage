User Story

As a cadet or staff member looking at the squadron display board,

I want to clearly see the designated Duty NCO and Duty Cadet for the evening as a distinct, dedicated component on the programme slide styled inline with the rest of the page,

So that I can easily identify staffing information without it being buried inside general training notes or breaking layout consistency.

---

Description

This feature updates the digital display board (`index.php`) to extract the `duty_nco` and `duty_cadet` fields from the active training night data and render them in their own dedicated UI element. The component should be integrated naturally into the main flow of the page, matching the established styling instead of using a sidebar.

---

Key Requirements

• Consistent Integrated UI:

  • Modify `index.php` (the display board interface) to add a specific, dedicated section for "Tonight's Duties."

  • The element must be separate from the general text block used for training notes, but integrated into the page layout (avoiding a sidebar) to keep styling completely consistent.

• Data Presentation:

  • Duty NCO: Render the name prefixed clearly by their assigned cadet rank (Cpl, Sgt, FS, CWO).

  • Duty Cadet: Render the text string entered for the cadet duty.

• Fallbacks & Empty States:

  • If no duty personnel have been assigned for the evening, handle the empty state gracefully (e.g., display a clean "TBC" indicator or hide the element) without disrupting the layout flow of the slide.

---

Proposed Implementation Ideas

• Update the data payload fetched by `index.php` to explicitly include the `duty_nco` (with rank) and `duty_cadet` properties.

• Add semantic HTML/CSS structures inside the main layout wrapper of `index.php` to separate the core schedule timeline, general notes, and duty personnel blocks cleanly using the app's existing layout patterns.
