User Story

As a developer and maintainer of the Air Cadet Displayboard,
I want a comprehensive test suite across the frontend and backend codebase,
So that I can confidently refactor code, add new features, and catch regressions before they affect the live system.

---

Description

Currently, the project lacks a formal automated test suite and relies on basic validation such as PHP linting. This feature request entails the introduction, configuration, and writing of automated tests across both the PHP backend and vanilla JavaScript frontend.

---

Key Requirements

• Backend Testing (PHP):
  • Introduce a testing framework for PHP (e.g., PHPUnit or Pest).
  • Write unit tests for API endpoints (`api/`), ensuring that standard `jsonResponse` and `jsonError` formats are consistently maintained.
  • Write tests for authentication logic and database interactions with SQLite.
  • Add tests for data processing and utility functions.

• Frontend Testing (JavaScript):
  • Introduce a testing framework for JavaScript (e.g., Jest or Mocha/Chai).
  • Write unit tests for core utilities, particularly the `apiFetch` wrapper.
  • Write tests for UI component logic, such as slide rendering, form submissions, and the new array-based notes list manipulation.
  • Ensure frontend tests can run headlessly and independently of the backend.

• Continuous Integration (CI):
  • Provide basic configuration files (e.g., GitHub Actions or similar) to run both PHP and JS test suites automatically on commit/push.

---

Proposed Implementation Ideas

• Create a `tests/` directory at the root level, subdivided into `backend/` and `frontend/`.
• Initialize `composer.json` for managing PHPUnit dependencies.
• Initialize `package.json` for managing Jest or equivalent JS testing frameworks.
• Begin by covering the most critical paths: Authentication, API wrappers, and the training schedule JSON datastore logic.
