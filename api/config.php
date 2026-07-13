<?php
// api/config.php

// Enable error reporting for local testing
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Database configuration
// Using SQLite for local testing to avoid setup, but it can be easily swapped to MySQL.
// For production MySQL: $dsn = 'mysql:host=localhost;dbname=sqn_board;charset=utf8mb4';
$data_dir = __DIR__ . '/../data';
if (!file_exists($data_dir)) {
    mkdir($data_dir, 0755, true);
}
$db_file = $data_dir . '/sqn_board.sqlite';
$dsn = 'sqlite:' . $db_file;
$db_user = null; // Set for MySQL
$db_pass = null; // Set for MySQL

try {
    $pdo = new PDO($dsn, $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database Connection failed: " . $e->getMessage());
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
?>
