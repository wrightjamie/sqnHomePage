# Feedback Fixes & Enhancements

1. **[ ] CSS Fix 1:** The extending slide control menu on `index.php` lost its excellent styling (due to accidental CSS deletion).
2. **[ ] CSS Fix 2:** The styling of the extended hamburger menu isn't perfect - it's lost the transparency of the other buttons and we have underlines on links.
3. **[ ] Header Navigation Refactor:** Pull the login/logout button out of the menu. Put it in the top right of the page as a 'person' icon. We'll use that button to trigger the login form, logout, link to the user settings and access edit mode. The bottom right menu will be for navigation and persistent menu items specific to a page.
4. **[ ] Documents Edit Button:** Edit button on `api/documents.php` to be consistent with other pages - put it into the hover menus (Note: We added it to the global bottom-right menu recently, need to verify if this meets the requirement or if they mean something else).
5. **[ ] Document Slugs:** On `documents.php` give each document a 'slug' so that they can be linked to directly. Add a 'slug' input field.
6. **[ ] Document Amendments UI:** Put the amendments into a details element so that it can be hidden. By default, let's hide it.
7. **[ ] Document Versioning Popup:** Rather than having a manual place to add the version and changes, have a pop up on save with 3 options: No version change (correction of typos), point version (clarifications and corrections), major version (significant changes or new content).
8. **[ ] Documents Visual Swoosh:** Add the visual swoosh from `index.php` to the top of `documents.php`.
9. **[ ] Documents Print Styling:** Every `h1` on `documents.php` should be a new page with the swoosh when printing.
10. **[ ] Documents Height Bug:** The main element `documents.php` seems to have a height of 100vh, which causes a vertical scroll regardless of content.
11. **[ ] Documents Edit Mode Toggle:** `documents.php` - the edit button doesn't switch to a stop editing on selection.
