<?php
// api/init_db.php
require_once 'config.php';

try {
    // Create roles table
    $pdo->exec("CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    )");

    // Create permissions table
    $pdo->exec("CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    )");

    // Create role_permissions table
    $pdo->exec("CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER,
        permission_id INTEGER,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )");

    // Create users table
    // Note: We use SQLite, so we recreate the users table with new columns or assume it's fresh.
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        role_id INTEGER DEFAULT NULL,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
    )");

    // Handle existing users migration (if users table had the old schema)
    // Add columns if they don't exist
    $columns = $pdo->query("PRAGMA table_info(users)")->fetchAll(PDO::FETCH_ASSOC);
    $colNames = array_column($columns, 'name');

    if (!in_array('display_name', $colNames)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN display_name TEXT DEFAULT ''");
    }
    if (!in_array('status', $colNames)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
    }
    if (!in_array('role_id', $colNames)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN role_id INTEGER DEFAULT NULL");
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

    // Seed default roles and permissions if they don't exist
    $stmt = $pdo->query("SELECT COUNT(*) FROM roles");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("INSERT INTO roles (name) VALUES ('Admin'), ('Staff'), ('NCO')");

        $pdo->exec("INSERT INTO permissions (name) VALUES
            ('manage_users'),
            ('manage_settings'),
            ('edit_slides'),
            ('edit_programme')
        ");

        // Admin gets all
        $pdo->exec("INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'Admin'");

        // Staff gets edit_slides and edit_programme
        $pdo->exec("INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p
            WHERE r.name = 'Staff' AND p.name IN ('edit_slides', 'edit_programme')");

        // NCO gets edit_programme
        $pdo->exec("INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p
            WHERE r.name = 'NCO' AND p.name = 'edit_programme'");
    }

    // Seed default admin user if none exist
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $count = $stmt->fetchColumn();

    if ($count == 0) {
        $username = 'admin';
        $password = 'admin'; // Change this later
        $hash = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $pdo->query("SELECT id FROM roles WHERE name = 'Admin'");
        $adminRoleId = $stmt->fetchColumn();

        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, display_name, status, role_id) VALUES (?, ?, ?, 'active', ?)");
        $stmt->execute([$username, $hash, 'Administrator', $adminRoleId]);
        echo "Database initialized. Default user created (admin/admin).<br>";
    } else {
        // Migration: If admin user doesn't have a role, assign it
        $stmt = $pdo->query("SELECT id FROM roles WHERE name = 'Admin'");
        $adminRoleId = $stmt->fetchColumn();
        if ($adminRoleId) {
            $pdo->prepare("UPDATE users SET role_id = ? WHERE role_id IS NULL AND (role = 'admin' OR username = 'admin')")->execute([$adminRoleId]);
        }
        echo "Database already initialized.<br>";
    }
    
} catch (PDOException $e) {
    die("DB Init Error: " . $e->getMessage());
}
?>
