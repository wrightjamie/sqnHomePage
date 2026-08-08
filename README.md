# Air Cadet Displayboard

A modern, dynamic digital display board and slideshow system built for an RAF Air Cadet Squadron (SQN Homepage). 
It features a full administration panel for managing slide sets, interactive UI components, art-directed image galleries, and a fully customisable training programme interface.

## Features
- **Dynamic Slideshow:** Full-screen looping slideshows containing text, images, and HTML content.
- **Admin Panel:** Complete drag-and-drop slide management and image gallery uploads.
- **Art Direction:** Interactive focal-point selection for responsive `object-fit: cover` image scaling across all screens.
- **Custom Branding:** Styled perfectly to RAF brand guidelines (Pantone colours, Deep Blue, RAF Red).
- **Training Programme:** A calendar/programme view for scheduling activities.
- **Role-Based Access Control:** Secure authentication with granular permissions for users and groups.
- **Document Management:** Organizing documents with custom slugs.

## Technology Stack
- **Frontend:** Vanilla HTML, CSS, and JavaScript. ES Modules used for JS architecture.
- **Backend:** PHP with a lightweight SQLite database.
- **Design System:** Custom CSS variables for brand colours, typography, and spacing in `css/core.css`.
- **Testing:** PHPUnit for backend and Jest with JSDOM for frontend testing.

## Setup Instructions
1. Clone this repository to your local web server (e.g., Apache/Nginx with PHP support).
2. For testing, start a local server using `php -S localhost:8000`.
3. To initialize or seed the database programmatically (or access the web interface):
   `curl -X POST http://localhost:8000/install.php -d "admin_username=admin&admin_password=password&seed_data=on"`
   (Alternatively navigate to `/install.php` in your browser).
4. Access the main display board via `index.php`.
5. Access the admin dashboard via `index.php?page=admin` (Default credentials: admin / password).

## Architecture
- `data/`: Contains the `.sqlite` database files and monthly training datastores in JSON.
- `uploads/`: Contains user-uploaded images and generated thumbnails (ignored in git).
- `api/`: Contains the PHP backend endpoints for DB interactions and authentication.
- `pages/`: Contains PHP pages that get rendered by `index.php` router.
- `components/`: Contains modular reusable PHP elements for the UI.
- `js/` & `css/`: Frontend logic and style definitions.
- `tests/`: Contains test suites for Jest and PHPUnit.
