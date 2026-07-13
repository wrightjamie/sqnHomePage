<?php
// install.php
require_once 'api/config.php';

$message = '';
$isInstalled = false;

// Check if already installed
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    if ($stmt !== false) {
        $count = $stmt->fetchColumn();
        if ($count > 0) {
            $isInstalled = true;
            $message = "The display board is already installed. <a href='index.php'>Go to Display Board</a> or <a href='admin.php'>Admin Panel</a>.";
        }
    }
} catch (PDOException $e) {
    // Tables don't exist yet, which means not installed.
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$isInstalled) {
    $adminUser = $_POST['admin_username'] ?? 'admin';
    $adminPass = $_POST['admin_password'] ?? 'admin';
    
    try {
        // Create slide_sets table
        $pdo->exec("CREATE TABLE IF NOT EXISTS slide_sets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT DEFAULT 'folder',
            is_active INTEGER DEFAULT 0,
            display_order INTEGER DEFAULT 0
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

        // Create images table
        $pdo->exec("CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            title TEXT DEFAULT '',
            description TEXT DEFAULT '',
            tags TEXT DEFAULT '[]',
            focus_x INTEGER DEFAULT 50,
            focus_y INTEGER DEFAULT 50,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Create settings table
        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
            `key` TEXT PRIMARY KEY,
            `value` TEXT NOT NULL
        )");
        
        // Admin User is created in init_db.php or we can create it explicitly here
        // The init_db.php script handles base schema and users. Let's include it to make sure the schema is created correctly.
        require_once 'api/init_db.php';

        // Update the admin user password if needed, or create the requested admin user if it doesn't exist
        $hash = password_hash($adminPass, PASSWORD_DEFAULT);
        $stmt = $pdo->query("SELECT id FROM roles WHERE name = 'Admin'");
        $adminRoleId = $stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$adminUser]);
        if ($stmt->fetch()) {
             $pdo->prepare("UPDATE users SET password_hash = ?, display_name = 'Administrator', status = 'active', role_id = ? WHERE username = ?")->execute([$hash, $adminRoleId, $adminUser]);
        } else {
             $pdo->prepare("INSERT INTO users (username, password_hash, display_name, status, role_id) VALUES (?, ?, 'Administrator', 'active', ?)")->execute([$adminUser, $hash, $adminRoleId]);
        }

        // Seed Dummy Data if requested
        if (isset($_POST['seed_data'])) {
            require_once 'api/utils.php';

            // Add dummy users (Staff, NCO, and Pending)
            $stmt = $pdo->query("SELECT id FROM roles WHERE name = 'Staff'");
            $staffRoleId = $stmt->fetchColumn();
            $stmt = $pdo->query("SELECT id FROM roles WHERE name = 'NCO'");
            $ncoRoleId = $stmt->fetchColumn();

            $pdo->exec("INSERT OR IGNORE INTO users (username, password_hash, display_name, status, role_id) VALUES
                ('staff_user', '" . password_hash('password', PASSWORD_DEFAULT) . "', 'CI Smith', 'active', $staffRoleId),
                ('nco_user', '" . password_hash('password', PASSWORD_DEFAULT) . "', 'Sgt Jones', 'active', $ncoRoleId),
                ('pending_user', '" . password_hash('password', PASSWORD_DEFAULT) . "', 'Cdt Davies', 'pending', NULL)
            ");
            require_once 'api/utils.php';
            
            // Create a slide set
            $pdo->exec("INSERT INTO slide_sets (name, icon, is_active) VALUES ('Welcome to the Squadron', 'star', 1)");
            $setId = $pdo->lastInsertId();

            // Prepare Uploads Directory
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

            // "Upload" AI image 1
            $img1Filename = time() . '_raf_formation.png';
            $img1Src = __DIR__ . '/install_assets/raf_formation.png';
            $img1Dest = $uploadDir . $img1Filename;
            $img1Url = 'uploads/' . $img1Filename;
            if (file_exists($img1Src)) {
                copy($img1Src, $img1Dest);
                generateThumbnail($img1Dest, $uploadDir . 'thumb_' . $img1Filename);
                $stmt = $pdo->prepare("INSERT INTO images (filename, title, description, tags) VALUES (?, ?, ?, ?)");
                $stmt->execute([$img1Filename, 'RAF Formation', 'RAF aircraft flying in formation', json_encode(['aircraft', 'raf', 'formation'])]);
            }

            // "Upload" AI image 2
            $img2Filename = time() . '_raf_low.png';
            $img2Src = __DIR__ . '/install_assets/raf_low.png';
            $img2Dest = $uploadDir . $img2Filename;
            $img2Url = 'uploads/' . $img2Filename;
            if (file_exists($img2Src)) {
                copy($img2Src, $img2Dest);
                generateThumbnail($img2Dest, $uploadDir . 'thumb_' . $img2Filename);
                $stmt = $pdo->prepare("INSERT INTO images (filename, title, description, tags) VALUES (?, ?, ?, ?)");
                $stmt->execute([$img2Filename, 'Low Pass', 'RAF aircraft flying low', json_encode(['aircraft', 'raf', 'action'])]);
            }

            // Dummy Slide 1: Welcome (Text)
            $content1 = json_encode([
                "title" => "Welcome to the Royal Air Force Air Cadets",
                "body" => "We are the next generation.\n\n- Experience aviation\n- Develop leadership\n- Build lifelong friendships"
            ]);
            $stmt = $pdo->prepare("INSERT INTO slides (slide_set_id, type, content, display_order) VALUES (?, 'text', ?, 1)");
            $stmt->execute([$setId, $content1]);

            // Dummy Slide 2: Image
            $content2 = json_encode([
                "title" => "Our Core Values",
                "imageUrl" => file_exists($img1Src) ? $img1Url : "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/RAF_roundel.svg/1024px-RAF_roundel.svg.png"
            ]);
            $stmt = $pdo->prepare("INSERT INTO slides (slide_set_id, type, content, display_order) VALUES (?, 'image', ?, 2)");
            $stmt->execute([$setId, $content2]);

            // Dummy Slide 3: Text
            $content3 = json_encode([
                "title" => "Upcoming Events",
                "body" => "Don't forget these key dates!\n\n- **12th July:** Squadron Parade\n- **15th August:** Summer Camp Departure\n- **20th September:** Annual Awards Night"
            ]);
            $stmt = $pdo->prepare("INSERT INTO slides (slide_set_id, type, content, display_order) VALUES (?, 'text', ?, 3)");
            $stmt->execute([$setId, $content3]);

            // Dummy Slide 4: Image
            $content4 = json_encode([
                "title" => "Action & Adventure",
                "imageUrl" => file_exists($img2Src) ? $img2Url : "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Air_Training_Corps_glider.jpg/800px-Air_Training_Corps_glider.jpg"
            ]);
            $stmt = $pdo->prepare("INSERT INTO slides (slide_set_id, type, content, display_order) VALUES (?, 'image', ?, 4)");
            $stmt->execute([$setId, $content4]);
        }

        // --- Seed Dashboard Config and Assets ---
        $uploadDir = __DIR__ . '/uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        
        $startAssetsDir = __DIR__ . '/install_assets/start/';
        $backgrounds = [];
        
        if (is_dir($startAssetsDir)) {
            require_once 'api/utils.php';
            $files = glob($startAssetsDir . '*.{jpg,jpeg,png,gif,webp,svg}', GLOB_BRACE);
            foreach ($files as $file) {
                $filename = basename($file);
                
                // If it's a background image, copy to uploads. 
                // If it's something else like roundel.svg, maybe just keep it in assets/start? 
                // The user said "push them into our uploads". So we'll push all of them.
                $dest = $uploadDir . $filename;
                $url = 'uploads/' . $filename;
                copy($file, $dest);
                
                if (preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $filename)) {
                    generateThumbnail($dest, $uploadDir . 'thumb_' . $filename);
                    $stmt = $pdo->prepare("SELECT id FROM images WHERE filename = ?");
                    $stmt->execute([$filename]);
                    if (!$stmt->fetch()) {
                        $stmt = $pdo->prepare("INSERT INTO images (filename, title, description, tags) VALUES (?, ?, ?, ?)");
                        $stmt->execute([$filename, 'Dashboard Image', '', json_encode(['background'])]);
                    }
                    if (strpos($filename, 'bg_') === 0) {
                        $backgrounds[] = $url;
                    }
                }
            }
        }
        
        // Default Config
        $defaultConfig = [
            "title" => "2459 Squadron",
            "logoUrl" => "uploads/roundel.svg",
            "maxWidth" => "1400px",
            "backgrounds" => $backgrounds,
            "bgInterval" => 5,
            "layout" => [
                [ "type" => "row", "children" => [ [ "type" => "column", "children" => [ [ "type" => "widget", "widgetType" => "title" ] ] ] ] ],
                [ "type" => "row", "children" => [ [ "type" => "column", "children" => [ [ "type" => "widget", "widgetType" => "search" ] ] ] ] ],
                [ "type" => "row", "children" => [ 
                    [ "type" => "column", "width" => "1/4", "children" => [ [ "type" => "widget", "widgetType" => "time" ] ] ],
                    [ "type" => "column", "width" => "3/4", "children" => [ [ "type" => "widget", "widgetType" => "weather", "locationName" => "Poulton-le-Fylde", "latitude" => 53.847, "longitude" => -2.992, "forecastDays" => 4 ] ] ]
                ] ],
                [
                    "type" => "row",
                    "children" => [
                        [
                            "type" => "column",
                            "children" => [
                                [
                                    "type" => "links",
                                    "title" => "Squadron Resources",
                                    "columns" => 3,
                                    "links" => [
                                        [ "title" => "RAFAC Website", "url" => "https://www.raf.mod.uk/aircadets/", "icon" => "globe" ],
                                        [ "title" => "Uniform Guidelines", "url" => "https://www.raf.mod.uk/aircadets/cadets/uniform/", "icon" => "shirt-folded" ],
                                        [ "title" => "Welfare", "url" => "https://www.raf.mod.uk/aircadets/safeguarding/", "icon" => "heart" ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ],
                [
                    "type" => "row",
                    "children" => [
                        [
                            "type" => "column",
                            "width" => "1/2",
                            "children" => [
                                [
                                    "type" => "links",
                                    "title" => "Cadet Resources",
                                    "columns" => 2,
                                    "links" => [
                                        [ "title" => "Cadet Portal", "url" => "https://cadets.bader.mod.uk", "icon" => "airplane-tilt" ],
                                        [ "title" => "Bader Learn", "url" => "https://learning.bader.mod.uk", "icon" => "book-open" ],
                                        [ "title" => "First Aid", "url" => "https://www.sja.org.uk/", "icon" => "first-aid" ],
                                        [ "title" => "DofE", "url" => "https://www.edofe.org/", "icon" => "backpack" ],
                                        [ "title" => "TG21 / AV Med", "url" => "https://rafac.sharepoint.com", "icon" => "file-text" ],
                                        [ "title" => "Uniform Request", "url" => "https://cadets.bader.mod.uk", "icon" => "t-shirt" ],
                                        [ "title" => "Claim Badges", "url" => "https://cadets.bader.mod.uk", "icon" => "medal" ]
                                    ]
                                ]
                            ]
                        ],
                        [
                            "type" => "column",
                            "width" => "1/2",
                            "children" => [
                                [
                                    "type" => "links",
                                    "title" => "Staff Resources",
                                    "columns" => 2,
                                    "links" => [
                                        [ "title" => "Bader SharePoint", "url" => "https://rafac.sharepoint.com", "icon" => "microsoft-teams-logo" ],
                                        [ "title" => "Volunteer Portal", "url" => "https://volunteer.bader.mod.uk", "icon" => "users" ],
                                        [ "title" => "Bader Home Page", "url" => "https://bader.mod.uk", "icon" => "database" ],
                                        [ "title" => "Training Portal", "url" => "https://learning.bader.mod.uk", "icon" => "chalkboard-teacher" ],
                                        [ "title" => "SMS", "url" => "https://sms.bader.mod.uk", "icon" => "desktop" ],
                                        [ "title" => "Key RAFAC Docs", "url" => "https://rafac.sharepoint.com", "icon" => "folder-open" ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ],
                [
                    "type" => "row",
                    "children" => [
                        [
                            "type" => "column",
                            "children" => [
                                [
                                    "type" => "links",
                                    "title" => "Useful Resources",
                                    "links" => [
                                        [ "title" => "BBC News", "url" => "https://www.bbc.co.uk/news", "icon" => "television" ],
                                        [ "title" => "YouTube", "url" => "https://www.youtube.com", "icon" => "youtube-logo" ],
                                        [ "title" => "Royal Air Force", "url" => "https://www.raf.mod.uk", "icon" => "airplane-in-flight" ],
                                        [ "title" => "Air Cadet Central", "url" => "https://aircadetcentral.net", "icon" => "users-three" ],
                                        [ "title" => "Flightradar24", "url" => "https://www.flightradar24.com", "icon" => "radar" ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ];
        
        $stmt = $pdo->prepare("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES ('home_config', ?)");
        $stmt->execute([json_encode($defaultConfig)]);
        
        // Default Programme Config
        $defaultProgrammeConfig = [
            "uniforms" => [
                [ "name" => "Dark Blue", "color" => "#002F5F" ],
                [ "name" => "Light Blue", "color" => "#5482AB" ],
                [ "name" => "Greens", "color" => "#879637" ],
                [ "name" => "Civvis", "color" => "#5E6A71" ]
            ],
            "parade_nights" => ["Monday", "Thursday"],
            "activity_types" => [
                [ "name" => "Outdoor", "color" => "#879637" ],
                [ "name" => "Project", "color" => "#E98300" ],
                [ "name" => "Academic", "color" => "#C60C30" ]
            ],
            "classifications" => [
                "Junior", "First Class", "Leading", "Senior / Master"
            ],
            "ranks" => [
                "Wg Cdr", "Sqn Ldr", "Flt Lt", "Fg Off", "Plt Off", 
                "WO", "FSgt", "Sgt", "CI", 
                "CWO", "FS", "Cpl", "Cdt"
            ],
            "staff" => [
                [ "name" => "Di Domenico", "rank" => "Flt Lt" ],
                [ "name" => "Wright", "rank" => "WO" ],
                [ "name" => "Gaskin", "rank" => "CWO" ],
                [ "name" => "Drew", "rank" => "FSgt" ],
                [ "name" => "Drew", "rank" => "CI" ]
            ]
        ];
        $stmt = $pdo->prepare("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES ('programme_config', ?)");
        $stmt->execute([json_encode($defaultProgrammeConfig)]);
        // ----------------------------------------

        $isInstalled = true;
        $message = "Installation successful! <a href='admin.php'>Login to Admin</a>";
        
    } catch (PDOException $e) {
        $message = "Error during installation: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install - Sqn Display Board</title>
    <link rel="icon" href="uploads/roundel.svg" type="image/svg+xml">
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/pages/install.css">
</head>
<body>
    <div class="install-box">
        <h1>Installation</h1>
        
        <?php if ($message): ?>
            <div class="message"><?php echo $message; ?></div>
        <?php endif; ?>

        <?php if (!$isInstalled): ?>
            <form method="POST">
                <label>Admin Username</label>
                <input type="text" name="admin_username" value="admin" required>
                
                <label>Admin Password</label>
                <input type="password" name="admin_password" required>
                
                <div class="checkbox-row">
                    <input type="checkbox" id="seed_data" name="seed_data" checked>
                    <label for="seed_data">Seed database with dummy slides</label>
                </div>
                
                <button type="submit">Install & Setup</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
