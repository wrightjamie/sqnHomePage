## User Story

As an administrator,

I want to manage a dedicated list of NCOs with their specific cadet ranks (Cpl, Sgt, FS, CWO),

So that they can be assigned to duties and their system permissions can be properly managed.

---

## Description

This feature introduces a structured NCO Management Registry controlled via the Admin panel. Instead of pulling from a generic list of all cadets, the system will maintain a specific list of NCOs. Each NCO entry will be assigned a designated cadet rank, which will feed into the Duty Roster system.

---

## Key Requirements

• NCO Data & Cadet Ranks:

  • Maintain a dedicated database table/list for NCOs.

  • Every NCO entry must be assigned one of the following specific ranks:

    • Cpl (Corporal)

    • Sgt (Sergeant)

    • FS (Flight Sergeant)

    • CWO (Cadet Warrant Officer)

• Admin Management Page:

  • A new management interface within the Admin section to view, add, edit, or remove NCOs.

  • Ability to update an NCO's rank as they advance.

• Duty Personnel Integration:

  • The Duty NCO selection on the programme page will dynamically pull directly from this validated admin-managed NCO list.

  • The Duty Cadet field remains a text/unlinked input since there is no underlying database registry for non-NCO cadets.

---

## Proposed Implementation Ideas

• Create an `ncos` schema or add specific metadata fields to user profiles if NCO accounts map directly to system logins.

• Implement an Admin-only CRUD interface with a dropdown restricting rank selection strictly to `Cpl`, `Sgt`, `FS`, and `CWO`.
