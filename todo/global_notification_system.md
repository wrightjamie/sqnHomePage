# Feature: Global Notification (Toast) System

## User Story

As a user,

I want to receive immediate, clear visual feedback when an action succeeds or fails,

So that I know the outcome of my requests and understand why an action might have been blocked (such as lacking sufficient privileges).

---

## Description

This feature introduces a robust, global notification (toast) system to handle application-wide feedback. It will act as a primary mechanism to surface success confirmations as well as error states—specifically highlighting authorization rejections or permission boundaries when a user attempts an action outside their role privileges.

---

## Key Requirements

• Notification Types:

  • Success: Confirming database updates, successful logins, approved registrations, etc.

  • Error / Failure: Handling server issues, validation errors, and explicitly capturing "Insufficient Privileges" (401/403) errors.

  • Info / Warning (Optional): General status updates or non-critical warnings.

• UI/UX Design:

  • Consistent on-screen positioning (e.g., top-right or bottom-center).

  • Distinct visual styling (colors/icons) matching the message severity (e.g., green for success, red for errors).

  • Auto-dismissal functionality after a set duration (with a manual close button).

• Integration:

  • Global accessibility via a context provider, hook, or global event handler so notifications can be triggered from anywhere in the codebase (including API response interceptors).

---

## Proposed Implementation Ideas

• Implement a central toast state manager (e.g., React Context or a lightweight store) to queue and display notifications dynamically.

• Attach an interceptor to the API client to automatically trigger a failure toast whenever a 401 Unauthorized or 403 Forbidden response is encountered.
