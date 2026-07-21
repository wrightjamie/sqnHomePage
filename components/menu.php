<?php
require_once __DIR__ . '/../api/utils.php';
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<div id="bottom-right-controls">
    <div class="hamburger-menu" tabindex="0">
        <div class="hamburger-trigger" title="Menu">
            <span class="material-symbols-outlined">menu</span>
        </div>
        <div class="hamburger-items">
            <?php if ($currentPage !== 'index.php' && hasPermission($pdo, 'view_displayboard')): ?>
                <a href="index.php" class="menu-btn flex-center" title="Display Board"><span class="material-symbols-outlined">slideshow</span></a>
            <?php endif; ?>

            <?php if ($currentPage !== 'home.php' && hasPermission($pdo, 'view_home')): ?>
                <a href="home.php" class="menu-btn flex-center" title="Home"><span class="material-symbols-outlined">home</span></a>
            <?php endif; ?>

            <?php if ($currentPage !== 'programme.php' && hasPermission($pdo, 'view_programme')): ?>
                <a href="programme.php" class="menu-btn flex-center" title="Training Programme"><span class="material-symbols-outlined">calendar_month</span></a>
            <?php endif; ?>

            <?php if ($currentPage !== 'documents.php' && hasPermission($pdo, 'view_documents')): ?>
                <a href="documents.php" class="menu-btn flex-center" title="Documents"><span class="material-symbols-outlined">description</span></a>
            <?php endif; ?>

            <?php if ($currentPage === 'home.php'): ?>
                <button id="btn-next-bg" class="menu-btn flex-center hidden" title="Next Background"><span class="material-symbols-outlined">image</span></button>
            <?php endif; ?>
        </div>
    </div>
    
    <?php if ($currentPage === 'index.php'): ?>
        <div id="controls-wrapper" class="expandable-menu flex-center" tabindex="0">
            <div class="expandable-menu-trigger flex-center" title="Slideshow Controls">
                <span class="material-symbols-outlined">slideshow</span>
            </div>
            <div class="expandable-menu-items">
                <button id="btn-prev" class="flex-center" title="Previous Slide"><span class="material-symbols-outlined">skip_previous</span></button>
                <button id="btn-pause-play" class="flex-center" title="Pause/Play"><span class="material-symbols-outlined">pause</span></button>
                <button id="btn-next" class="flex-center" title="Next Slide"><span class="material-symbols-outlined">skip_next</span></button>
            </div>
        </div>
    <?php endif; ?>
</div>

<div id="top-right-controls" class="no-print">
    <div class="user-dropdown" tabindex="0">
        <div class="user-trigger flex-center" title="User Menu">
            <span class="material-symbols-outlined">person</span>
        </div>
        <div class="user-dropdown-items">
            <button id="btn-login-trigger" class="user-dropdown-btn <?php if($isLoggedIn) echo 'hidden'; ?>" title="Login">
                <span class="material-symbols-outlined">login</span> Login
            </button>
            
            <?php if ($isLoggedIn): ?>
                <div class="user-dropdown-header" style="padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); margin-bottom: 8px; font-weight: bold; color: white; font-size: 1.1rem;">
                    <?php echo htmlspecialchars($_SESSION['display_name'] ?: $_SESSION['username']); ?>
                </div>
                <?php if ($currentPage === 'programme.php' && hasPermission($pdo, 'edit_programme')): ?>
                    <button id="btn-toggle-edit" class="user-dropdown-btn" title="Edit Programme"><span class="material-symbols-outlined">edit</span> Edit</button>
                <?php elseif ($currentPage === 'index.php' && hasPermission($pdo, 'edit_slides')): ?>
                    <button id="btn-edit-mode" class="user-dropdown-btn" title="Edit Slides"><span class="material-symbols-outlined">edit</span> Edit</button>
                <?php elseif ($currentPage === 'documents.php'): ?>
                    <!-- Edit Mode for documents is moving to inline buttons per feedback, so no toggle here -->
                <?php elseif (hasPermission($pdo, 'edit_slides')): ?>
                    <button id="btn-edit-mode" class="user-dropdown-btn" title="Edit Mode"><span class="material-symbols-outlined">edit</span> Edit</button>
                <?php endif; ?>

                <a href="admin.php" id="link-admin" class="user-dropdown-btn" title="Admin Panel"><span class="material-symbols-outlined">settings</span> Settings</a>
                <button id="btn-logout" class="user-dropdown-btn" title="Logout"><span class="material-symbols-outlined">logout</span> Logout</button>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Login Modal -->
<?php include __DIR__ . '/login_modal.php'; ?>
