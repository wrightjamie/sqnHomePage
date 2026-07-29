<?php if (!defined('IN_ROUTER')) { die('Direct access not permitted'); } ?>
<?php
// profile.php
require_once 'api/config.php';
require_once 'api/utils.php';

if (!$isLoggedIn) {
    header("Location: index.php?page=login");
    // die is handled gracefully by not printing it here just exit function
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Profile - Sqn Display Board</title>
    <link rel="icon" href="uploads/roundel.svg" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/pages/admin.css"> <!-- We reuse the admin styles for forms/layout -->
</head>
<body>
    <?php
        $headerTitle = 'My Profile';
        include 'components/header_swoosh.php';
    ?>

    <div class="admin-container" id="main-admin-container">
        <div>
            <div class="flex-row justify-between align-center mb-md">
                <h2 class="m-0">Profile Settings</h2>
            </div>

            <div class="tabs">
                <button class="tab-btn active" data-target="tab-profile">Details</button>
                <button class="tab-btn" data-target="tab-security">Security</button>
            </div>

            <div id="tab-profile" class="tab-content active">
                <div class="mb-lg">
                    <h3 class="mb-sm">Change Display Name</h3>
                    <div class="set-item mb-md flex-col items-start">
                        <label for="profile-display-name" class="mb-xs font-bold">Display Name</label>
                        <input type="text" id="profile-display-name" class="mb-md w-full max-w-sm" placeholder="Display Name">

                        <div id="display-name-msg" class="mb-sm font-bold"></div>
                        <button class="btn btn-primary" type="button" id="btn-save-display-name">Save Display Name</button>
                    </div>
                </div>
            </div>

            <div id="tab-security" class="tab-content hidden">
                <div class="mb-lg">
                    <h3 class="mb-sm text-danger">Change Password</h3>
                    <div class="set-item flex-col items-start">
                        <label for="pwd-current" class="mb-xs font-bold">Current Password</label>
                        <input type="password" id="pwd-current" class="mb-md w-full max-w-sm" required>

                        <label for="pwd-new" class="mb-xs font-bold">New Password</label>
                        <input type="password" id="pwd-new" class="mb-md w-full max-w-sm" required>

                        <label for="pwd-confirm" class="mb-xs font-bold">Confirm New Password</label>
                        <input type="password" id="pwd-confirm" class="mb-md w-full max-w-sm" required>

                        <div id="pwd-msg" class="mb-sm font-bold"></div>
                        <button class="btn btn-primary" type="button" id="btn-change-password">Update Password</button>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <?php include 'components/menu.php'; ?>

    <script type="module" src="js/profile.js?v=<?= time() ?>"></script>
</body>
</html>
