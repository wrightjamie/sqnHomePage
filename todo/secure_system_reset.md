User Story

As an administrator,

I want to authenticate and provide my admin password before executing the system reset script,

So that critical data cannot be accidentally or maliciously wiped by unauthorized users or an unattended session.

---

Description

This feature upgrades the security of the application's system reset script. Currently, running the script only requires a simple confirmation input (`'yes'`). This update introduces mandatory authentication and a strict password validation check before the reset action can proceed.

---

Key Requirements

• Authentication Guard:

  • The reset script/endpoint must require the user to be actively logged in with Admin privileges. Anonymous or non-admin users must be completely blocked.

• Destructive Action Confirmation:

  • Replace the current prompt (which accepts a simple `'yes'`) with a mandatory password re-entry constraint.

  • The Admin must explicitly re-type their active login password to authorize the execution of the destructive script.

• Backend Validation:

  • The backend must verify the provided password against the active Admin account session prior to running any reset logic.

---

Proposed Implementation Ideas

• Implement a secure CLI prompt or a specific backend endpoint that accepts a `password` payload.

• Use the application's existing cryptographic hashing library to verify the incoming confirmation password against the stored admin hash before initiating the database clear routines.
