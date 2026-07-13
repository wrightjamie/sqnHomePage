# Feature Request: Disable Debugging

**Status:** Proposed
**Priority:** High

## Description
Ensure that PHP debugging (error reporting and `display_errors`) is turned off in `api/config.php` before deploying to a production environment. Leaving it enabled could expose sensitive server or codebase information to end users if a fatal error occurs.

## Proposed Changes
- [ ] In `api/config.php`, comment out or remove the following lines:
  ```php
  // Enable error reporting for local testing
  ini_set('display_errors', 1);
  ini_set('display_startup_errors', 1);
  error_reporting(E_ALL);
  ```

## Notes
- This task should be completed after local testing is finished.
