<?php
// api/init_db.php
require_once 'config.php';

try {
/**
 * api/init_db.php
 *
 * Initializes the SQLite database schema and seeds default data.
 * Used during the initial installation script (`install.php`).
 */

    // Create users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        status TEXT DEFAULT 'active'
    )");

    // Create user_roles table
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        can_manage_users INTEGER DEFAULT 0,
        can_edit_slides INTEGER DEFAULT 0,
        can_edit_programme INTEGER DEFAULT 0
    )");

    $stmt = $pdo->query("SELECT COUNT(*) FROM user_roles");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("INSERT INTO user_roles (name, can_manage_users, can_edit_slides, can_edit_programme) VALUES ('Admin', 1, 1, 1)");
        $pdo->exec("INSERT INTO user_roles (name, can_manage_users, can_edit_slides, can_edit_programme) VALUES ('Staff', 0, 1, 1)");
        $pdo->exec("INSERT INTO user_roles (name, can_manage_users, can_edit_slides, can_edit_programme) VALUES ('NCO', 0, 0, 1)");
    }

    // Create slide_sets table
    $pdo->exec("CREATE TABLE IF NOT EXISTS slide_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT DEFAULT 'folder',
        is_active INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0
    )");

    // Create images table
    $pdo->exec("CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        title TEXT DEFAULT '',
        description TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        focus_x INTEGER DEFAULT 50,
        focus_y INTEGER DEFAULT 50,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Create slides table
    $pdo->exec("CREATE TABLE IF NOT EXISTS slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slide_set_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        FOREIGN KEY (slide_set_id) REFERENCES slide_sets(id) ON DELETE CASCADE
    )");

    // Seed default admin user if none exist
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $count = $stmt->fetchColumn();

    if ($count == 0) {
        $username = 'admin';
        $password = 'admin'; // Change this later
        $hash = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
        $stmt->execute([$username, $hash]);
        echo "Database initialized. Default user created (admin/admin).<br>";
    } else {
        echo "Database already initialized.<br>";
    }
    
} catch (PDOException $e) {
    die("DB Init Error: " . $e->getMessage());
}
?>
