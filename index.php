<?php
// index.php - Main Router
require_once 'api/config.php';

define('IN_ROUTER', true);

$allowed_pages = ['displayboard', 'home', 'documents', 'programme', 'admin', 'login', 'register'];

$page = isset($_GET['page']) ? $_GET['page'] : 'displayboard';

// Validate the requested page
if (!in_array($page, $allowed_pages)) {
    // Alternatively, we could show a 404 page here
    $page = 'displayboard';
}

$page_file = __DIR__ . '/pages/' . $page . '.php';

if (file_exists($page_file)) {
    include $page_file;
} else {
    // Fallback if file is somehow missing
    http_response_code(404);
    echo "<h1>404 Not Found</h1>";
    echo "<p>The requested page does not exist.</p>";
}
