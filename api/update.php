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

    // Future upgrades should follow this pattern:
    // if ($currentVersion < 2) {
    //     $pdo->exec("ALTER TABLE example ADD COLUMN new_column TEXT");
    //     $pdo->exec("UPDATE settings SET value = '2' WHERE key = 'db_version'");
    //     $currentVersion = 2;
    // }

} catch (PDOException $e) {
    die("Database Update Error: " . $e->getMessage());
}
