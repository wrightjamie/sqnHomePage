<?php
// api/init_db.php
require_once 'config.php';

try {
    // Create users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin'
    )");

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
