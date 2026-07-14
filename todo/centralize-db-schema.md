# Feature Request: Centralize Database Schema Setup

**Status:** Proposed
**Priority:** Medium

## Description
Currently, several API scripts (e.g., `api/documents.php` and `api/ncos.php`) automatically run `CREATE TABLE IF NOT EXISTS` statements to generate their database tables if they do not exist when the endpoint is first accessed. This behavior should be removed to ensure a predictable and secure database schema lifecycle.

All database schema creation and table initialization should be centralized and handled exclusively by the `install.php` (and underlying `api/init_db.php`) script.

## Proposed Changes
- [ ] Remove the `CREATE TABLE IF NOT EXISTS` statements from `api/documents.php`, `api/ncos.php`, and any other individual API endpoints.
- [ ] Move these table creation queries into `api/init_db.php` so they execute formally during the installation process via `install.php`.
- [ ] Ensure that attempting to access APIs without having run the installer throws a proper database error rather than attempting to self-heal the schema.
