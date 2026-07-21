<?php
// api/update.php
// This script is automatically included by config.php when the database schema is outdated.
// It assumes $pdo is available and $currentVersion is defined.

if (!isset($pdo) || !isset($currentVersion)) {
    die("Direct access not allowed.");
}

try {
    // Step through each version sequentially
    
    if ($currentVersion < 1) {
        // Version 1: Establish baseline and version tracking
        $pdo->exec("INSERT OR IGNORE INTO settings (`key`, `value`) VALUES ('db_version', '1')");
        $pdo->exec("UPDATE settings SET value = '1' WHERE key = 'db_version'");
        $currentVersion = 1;
    }

    if ($currentVersion < 2) {
        // Version 2: Role Management Permissions
        $pdo->exec("INSERT OR IGNORE INTO permissions (name) VALUES ('manage_roles')");
        $pdo->exec("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) 
            SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'Admin' AND p.name = 'manage_roles'");
        
        $pdo->exec("UPDATE settings SET value = '2' WHERE key = 'db_version'");
        $currentVersion = 2;
    }

    if ($currentVersion < 3) {
        // Version 3: View Permissions and Guest Role
        $pdo->exec("INSERT OR IGNORE INTO roles (name) VALUES ('Guest')");

        $viewPerms = ['view_home', 'view_displayboard', 'view_programme', 'view_documents'];
        foreach ($viewPerms as $perm) {
            $pdo->exec("INSERT OR IGNORE INTO permissions (name) VALUES ('$perm')");

            // Give view permission to ALL roles by default to prevent breaking existing setups
            $pdo->exec("INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id FROM roles r, permissions p WHERE p.name = '$perm'");
        }

        $pdo->exec("UPDATE settings SET value = '3' WHERE key = 'db_version'");
        $currentVersion = 3;
    }

} catch (PDOException $e) {
    die("Database Update Error: " . $e->getMessage());
}
