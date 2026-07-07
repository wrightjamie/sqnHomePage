<?php
// api/upgrade_db.php
require_once 'config.php';

try {
    echo "Upgrading Database...<br>\n";

    // 1. Add display_order to slide_sets if it doesn't exist
    $result = $pdo->query("PRAGMA table_info(slide_sets)")->fetchAll();
    $hasDisplayOrder = false;
    foreach ($result as $row) {
        if ($row['name'] === 'display_order') {
            $hasDisplayOrder = true;
            break;
        }
    }

    if (!$hasDisplayOrder) {
        $pdo->exec("ALTER TABLE slide_sets ADD COLUMN display_order INTEGER DEFAULT 0");
        echo "Added display_order to slide_sets.<br>\n";
        
        // Initialize existing rows with a display order
        $sets = $pdo->query("SELECT id FROM slide_sets")->fetchAll();
        $order = 1;
        $stmt = $pdo->prepare("UPDATE slide_sets SET display_order = ? WHERE id = ?");
        foreach ($sets as $set) {
            $stmt->execute([$order++, $set['id']]);
        }
    } else {
        echo "display_order already exists.<br>\n";
    }

    // 2. Create or alter images table
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
    
    // Check if focus columns exist
    $result = $pdo->query("PRAGMA table_info(images)")->fetchAll();
    $hasFocusX = false;
    foreach ($result as $row) {
        if ($row['name'] === 'focus_x') {
            $hasFocusX = true;
            break;
        }
    }
    if (!$hasFocusX) {
        $pdo->exec("ALTER TABLE images ADD COLUMN focus_x INTEGER DEFAULT 50");
        $pdo->exec("ALTER TABLE images ADD COLUMN focus_y INTEGER DEFAULT 50");
        echo "Added focus_x and focus_y to images.<br>\n";
    }

    echo "Images table ensured.<br>\n";

    // 3. Migrate existing images
    $uploadDir = __DIR__ . '/../uploads/';
    if (is_dir($uploadDir)) {
        $files = scandir($uploadDir);
        $insertStmt = $pdo->prepare("INSERT OR IGNORE INTO images (filename, uploaded_at) VALUES (?, datetime(?, 'unixepoch'))");
        $count = 0;
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            if (strpos($file, 'thumb_') === 0) continue;
            
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                $mtime = filemtime($uploadDir . $file);
                $insertStmt->execute([$file, $mtime]);
                if ($insertStmt->rowCount() > 0) {
                    $count++;
                }
            }
        }
        echo "Migrated $count existing images into the database.<br>\n";
    }

    echo "Upgrade complete.<br>\n";
} catch (PDOException $e) {
    die("DB Upgrade Error: " . $e->getMessage());
}
?>
