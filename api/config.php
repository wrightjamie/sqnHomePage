<?php
// api/config.php

// Environment Detection: Automatically detect local dev vs. live production
$httpHost = $_SERVER['HTTP_HOST'] ?? '';
$isLocalHost = in_array($httpHost, ['localhost:8000', 'localhost', '127.0.0.1'], true)
    || strpos($httpHost, 'localhost:') === 0
    || strpos($httpHost, '127.0.0.1:') === 0
    || php_sapi_name() === 'cli';

// Optional local override file (ignored by Git) for custom environment/DB settings
if (file_exists(__DIR__ . '/config.local.php')) {
    require_once __DIR__ . '/config.local.php';
}

if (!defined('IS_DEBUG')) {
    define('IS_DEBUG', $isLocalHost);
}

if (IS_DEBUG) {
    // Enable error reporting for local development
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    // Hide errors from users in live production, but still log them
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(E_ALL);
}

// Database configuration
// Using file-based SQLite (no database username/password required).
// Can be overridden in api/config.local.php if needed.
$data_dir = $data_dir ?? (__DIR__ . '/../data');
if (!file_exists($data_dir)) {
    mkdir($data_dir, 0755, true);
}
$db_file = $db_file ?? ($data_dir . '/sqn_board.sqlite');
$dsn = $dsn ?? ('sqlite:' . $db_file);
$db_user = $db_user ?? null; // Only used if $dsn is overridden for MySQL
$db_pass = $db_pass ?? null; // Only used if $dsn is overridden for MySQL

try {
    $pdo = new PDO($dsn, $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log("Database Connection failed: " . $e->getMessage());
    die(IS_DEBUG ? "Database Connection failed: " . $e->getMessage() : "Database Connection failed.");
}

// Start session
$session_dir = $data_dir . '/sessions';
if (!file_exists($session_dir)) {
    mkdir($session_dir, 0755, true);
}
session_save_path($session_dir);
session_set_cookie_params([
    'path' => '/',
    'samesite' => 'Lax'
]);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$isLoggedIn = isset($_SESSION['user_id']);

// Check Database Version (Cache in session to avoid querying on every request)
$target_db_version = 6;

if (!isset($_SESSION['db_version_checked']) || $_SESSION['db_version_checked'] < $target_db_version) {
    // Ensure settings table exists first to prevent errors on fresh install
    $tableExists = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'")->fetch();
    
    if ($tableExists) {
        $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'db_version'");
        $stmt->execute();
        $dbVersionRow = $stmt->fetch();
        $currentVersion = $dbVersionRow ? (int)$dbVersionRow['value'] : 0;
        
        if ($currentVersion < $target_db_version) {
            require_once __DIR__ . '/update.php';
        }
        
        $_SESSION['db_version_checked'] = $target_db_version;
    } else {
        $isInstallPage = basename($_SERVER['SCRIPT_NAME']) === 'install.php';
        if (!$isInstallPage) {
            $isApiRequest = strpos($_SERVER['REQUEST_URI'], '/api/') !== false;
            if ($isApiRequest) {
                http_response_code(503);
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'error' => 'NOT_INSTALLED']);
                exit;
            } else {
                header("Location: install.php");
                exit;
            }
        }
    }
}
?>
