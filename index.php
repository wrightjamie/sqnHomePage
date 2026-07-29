<?php
// index.php - Main Router
require_once 'api/config.php';

define('IN_ROUTER', true);

$allowed_pages = ['displayboard', 'home', 'documents', 'programme', 'admin', 'login', 'register'];

$default_page = 'displayboard';
try {
    $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'default_page'");
    $stmt->execute();
    $result = $stmt->fetchColumn();
    if ($result) {
        $result = json_decode($result, true);
        if (in_array($result, $allowed_pages)) {
            $default_page = $result;
        }
    }
} catch (Exception $e) {
    // Ignore db errors for routing fallback
}

$page = isset($_GET['page']) ? $_GET['page'] : $default_page;

// Validate the requested page
if (!in_array($page, $allowed_pages)) {
    // Alternatively, we could show a 404 page here
    $page = $default_page;
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
