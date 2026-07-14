## Array-based Notes

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
