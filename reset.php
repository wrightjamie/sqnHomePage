<?php
// reset.php
require_once 'api/config.php';

$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['confirm_reset']) && $_POST['confirm_reset'] === 'YES') {
        try {
            // Drop tables if they exist
            $pdo->exec("DROP TABLE IF EXISTS slides");
            $pdo->exec("DROP TABLE IF EXISTS slide_sets");
            $pdo->exec("DROP TABLE IF EXISTS users");
            $pdo->exec("DROP TABLE IF EXISTS images");
            
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
    } else {
        $message = "You must type YES to confirm the reset.";
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
        <p class="warning">This will DELETE ALL slides, slide sets, and users. This action cannot be undone.</p>
        <p style="text-align:center; font-size: 0.9em; margin-bottom: 1.25rem;">(Please delete this file before deploying to production!)</p>
        
        <?php if ($message): ?>
            <div class="message"><?php echo $message; ?></div>
        <?php endif; ?>

        <form method="POST">
            <label style="text-align:center; display:block;">Type <strong>YES</strong> below to confirm:</label>
            <input type="text" name="confirm_reset" placeholder="YES" autocomplete="off" required>
            
            <button type="submit">NUKE DATABASE</button>
        </form>
    </div>
</body>
</html>
