# Air Cadet Displayboard

A modern, dynamic digital display board and slideshow system built for an RAF Air Cadet Squadron (SQN Homepage). 
It features a full administration panel for managing slide sets, interactive UI components, art-directed image galleries, and a fully customisable training programme interface.

## Features
- **Dynamic Slideshow:** Full-screen looping slideshows containing text, images, and HTML content.
- **Admin Panel:** Complete drag-and-drop slide management and image gallery uploads.
- **Art Direction:** Interactive focal-point selection for responsive `object-fit: cover` image scaling across all screens.
- **Custom Branding:** Styled perfectly to RAF brand guidelines (Pantone colours, Deep Blue, RAF Red).
- **Training Programme:** A calendar/programme view for scheduling activities.

## Technology Stack
- **Frontend:** Vanilla HTML, CSS, and JavaScript.
- **Backend:** PHP with a lightweight SQLite database.
- **Design System:** Custom CSS variables for brand colours, typography, and spacing in `css/core.css`.

## Setup Instructions
1. Clone this repository to your local web server (e.g., Apache/Nginx with PHP support).
2. Navigate to `/install.php` to run the initial setup script which generates dummy data and sets up the database.
3. Access the main display board via `index.php`.
4. Access the admin dashboard via `admin.php` (Default credentials: admin / admin).

## Architecture
- `data/`: Contains the `.sqlite` database files (ignored in git).
- `uploads/`: Contains user-uploaded images and generated thumbnails (ignored in git).
- `api/`: Contains the PHP backend endpoints for DB interactions and authentication.
- `js/` & `css/`: Frontend logic and style definitions.
