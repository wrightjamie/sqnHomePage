<?php
// force_update.php
// A utility script for development to force a check and update of the database schema.

require_once 'api/config.php';

// 1. Clear the session cache so future requests will re-check naturally.
if (isset($_SESSION['db_version_checked'])) {
    unset($_SESSION['db_version_checked']);
}

// 2. Perform a manual check and update immediately so we can show output.
$tableExists = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'")->fetch();

echo "<h1>Database Schema Update</h1>";

if ($tableExists) {
    $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'db_version'");
    $stmt->execute();
    $dbVersionRow = $stmt->fetch();
    $currentVersion = $dbVersionRow ? (int)$dbVersionRow['value'] : 0;
    
    echo "<p>Target Version: <strong>$target_db_version</strong></p>";
    echo "<p>Current DB Version: <strong>$currentVersion</strong></p>";
    
    if ($currentVersion < $target_db_version) {
        echo "<p>Running update script...</p>";
        require_once __DIR__ . '/api/update.php';
        echo "<p class='text-success-green'>Database updated successfully to version $target_db_version.</p>";
    } else {
        echo "<p class='text-info-blue'>Database is already up to date.</p>";
    }
} else {
    echo "<p class='text-error-red'>Settings table does not exist. The database might not be initialized yet. Please run <a href='install.php'>install.php</a>.</p>";
}

echo "<hr>";
echo "<a href='index.php'>Return to Homepage</a> | <a href='admin.php'>Return to Admin</a>";
?>
