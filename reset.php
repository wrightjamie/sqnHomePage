<?php
// reset.php
require_once 'api/config.php';
require_once 'api/utils.php';

$message = '';

if (!isset($_SESSION['user_id'])) {
    die("Access Denied: You must be logged in as an Administrator to view this page.");
}

// Since requirePermission calls jsonError, let's just do a manual check so we can show HTML
$stmt = $pdo->prepare("
    SELECT 1
    FROM users u
    JOIN role_permissions rp ON u.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = ? AND p.name = 'manage_settings'
");
$stmt->execute([$_SESSION['user_id']]);
if (!$stmt->fetch()) {
    die("Access Denied: Administrator privileges required.");
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['password'])) {
        $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $hash = $stmt->fetchColumn();

        if (!$hash || !password_verify($_POST['password'], $hash)) {
            $message = "Incorrect password.";
        } else {
            try {
                // Drop tables if they exist
                $pdo->exec("DROP TABLE IF EXISTS slides");
                $pdo->exec("DROP TABLE IF EXISTS slide_sets");
                $pdo->exec("DROP TABLE IF EXISTS users");
                $pdo->exec("DROP TABLE IF EXISTS images");
                $pdo->exec("DROP TABLE IF EXISTS ncos");
                $pdo->exec("DROP TABLE IF EXISTS documents");
                $pdo->exec("DROP TABLE IF EXISTS settings");

                // Delete uploaded files
                $uploadDir = __DIR__ . '/uploads/';
                if (is_dir($uploadDir)) {
                    $files = glob($uploadDir . '*');
                    foreach ($files as $file) {
                        if (is_file($file)) {
                            unlink($file);
                        }
                    }
                }

                // Destroy session to log out any current users
                session_destroy();

                $message = "Database has been completely reset. <a href='install.php'>Go to Install Page</a>";
            } catch (PDOException $e) {
                $message = "Error resetting database: " . $e->getMessage();
            }
        }
    } else {
        $message = "You must provide your password to confirm the reset.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset - Sqn Display Board</title>
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/pages/reset.css">
</head>
<body>
    <div class="reset-box">
        <h1>DANGER: Reset Database</h1>
        <p class="warning">This will DELETE ALL slides, slide sets, users, documents, and settings. This action cannot be undone.</p>
        <p style="text-align:center; font-size: 0.9em; margin-bottom: 1.25rem;">(Please delete this file before deploying to production!)</p>
        
        <?php if ($message): ?>
            <div class="message"><?php echo $message; ?></div>
        <?php endif; ?>

        <form method="POST">
            <label style="text-align:center; display:block;">Enter your <strong>Admin Password</strong> to confirm:</label>
            <input type="password" name="password" placeholder="Password" autocomplete="off" required>
            
            <button type="submit">NUKE DATABASE</button>
        </form>
    </div>
</body>
</html>
