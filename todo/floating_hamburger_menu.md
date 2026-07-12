User Story

As a user navigating the interface,

I want to expand a consolidated floating hamburger action menu at the bottom right of my screen, while keeping mission-critical contextual utilities persistently uncollapsed,

So that the main layout remains free of button clutter without compromising on immediate control access.

---

Description

This feature refactors the current navigation layout into a consolidated Floating Action Hamburger Menu situated at the bottom right of the viewport. Instead of a traditional horizontal header bar, buttons will stack vertically inside a toggled overlay. Crucially, the system will support pinning vital contextual buttons—such as slide controls on `index.php` or background switchers on `home.php`—directly to the screen layer outside of the hamburger dropdown, all driven cleanly by component logic rather than media queries.

---

Key Requirements

• Bottom-Right Floating Vertical Menu:

  • Position the menu trigger as a persistent floating icon stack in the bottom-right corner of the viewport.

  • Toggling the hamburger icon expands an inline vertical stack of navigation actions.

• Persistent Button Overlay (No Collapse):

  • The menu architecture must allow high-frequency contextual actions to sit explicitly outside the expanded hamburger layer.

  • `index.php` Controls: Keep the presentation slide control buttons permanently uncollapsed.

  • `home.php` Controls: Keep the "Next Background" quick trigger permanently uncollapsed.

• Pure Logic Constraints (No CSS Media Queries):

  • Manage all layout states, rendering rules, and button sorting using backend or component-level logic flags. Do not introduce CSS media queries (`@media`) to handle visibility or position shifts.

---

Proposed Implementation Ideas

• Use absolute/fixed utility placement in CSS (`position: fixed; bottom: 20px; right: 20px;`) to anchor the floating control group block.

• Define a template filtering method or component flag loop that isolates items designated as `persistent` into their own root rendering tree next to the hamburger wrapper markup.
