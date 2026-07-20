# AI Agent Guidelines (AGENTS.md)

Welcome! If you are an AI agent (such as Jules or Antigravity) working on this codebase, please strictly adhere to the following rules, conventions, and architectural guidelines to maintain code quality and consistency.

## 1. Project Overview
* **Purpose:** This project is an 'Air Cadet Displayboard' featuring a dynamic slideshow and admin panel for an RAF Air Cadet Squadron.
* **Core Functionality:** Full-screen looping slideshows, admin drag-and-drop slide management, art-directed image scaling, and a customizable training programme interface.

## 2. Technology Stack & Coding Conventions
* **Frontend:** Vanilla HTML, modern CSS, and JavaScript.
* **Backend:** PHP with a lightweight SQLite database.
* **API Communication:**
  * **Frontend JS:** Always use the `apiFetch` wrapper for making API calls.
  * **Backend PHP:** API endpoints must be standardized to use `jsonResponse` and `jsonError` helpers.
* **Testing:**
  * **Backend (PHP):** Use PHPUnit. Run tests via `composer test` or `./vendor/bin/phpunit`.
  * **Frontend (JS):** Use Jest with JSDOM. Run tests via `npm test`.

## 3. Data Storage & Structure
* **General Database:** SQLite is used for primary database storage (files are located in the `data/` directory).
* **Training Schedules:** The project uses a file-based monthly JSON datastore for training schedules. All data for a given month is stored in a single JSON file.
* **Database Updates (CRITICAL):** When modifying the database schema, ALWAYS increment the target version in `api/config.php` and add the corresponding upgrade queries to the migration sequence in `api/update.php`. This ensures all deployments can automatically upgrade their schema.

## 4. Design & Styling (Modern CSS)
* **Brand Guidelines:** Styling must strictly adhere to RAF brand guidelines.
* **Color Palette:** Always use the predefined CSS variables (e.g., RAF Deep Blue, RAF Red) defined in `css/core.css`. Do not hardcode brand colors.
* **Modern CSS:** Utilize modern CSS features (e.g., CSS Grid, Flexbox, Custom Properties) for clean, maintainable, and responsive designs.
* **Native UI Elements:** Prefer native HTML elements (e.g., `<dialog>` for modals and popovers) over custom `<div>` overlays to ensure better accessibility, semantic correctness, and built-in functionality (like the `::backdrop` pseudo-element and `showModal()`).

## 5. Workflow & Directives
* **Feature Tracking:** Task progress, to-do items, and future feature requests are tracked in `task.md`, `todo.md`, and individual markdown files within the `todo/` directory.
* **Feature Requests (CRITICAL):** When asked to add or document a feature request, **strictly update the project tracking documentation** (e.g., `todo.md` or a file in `todo/`). **Do not implement the code changes** for the feature unless explicitly instructed to do so.
* **Implementation Strategy:** When implementing multiple features, prioritize minimizing rework and avoiding technical debt. Use a 'commit per feature' strategy.

## 6. Code Documentation
* **Self-Documenting Code & Comments:** Write readable, self-documenting code. Add clear, concise comments for complex logic.
* **Docblocks:** Use appropriate docblocks (e.g., PHPDoc for PHP, JSDoc for JavaScript) for functions, classes, and methods to explain their purpose, parameters, and return types.

## 7. Local Development
* **Running the Server:** When starting the local development server for testing, always explicitly use the XAMPP PHP executable path to ensure the correct environment:
  `C:\xampp\php\php.exe -S localhost:8000`
