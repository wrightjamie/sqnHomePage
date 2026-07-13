<?php
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<div id="bottom-right-controls">
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
    <?php else: ?>
        <a href="index.php" class="menu-btn flex-center" title="Display Board"><span class="material-symbols-outlined">slideshow</span></a>
    <?php endif; ?>

    <?php if ($currentPage !== 'home.php'): ?>
        <a href="home.php" class="menu-btn flex-center" title="Home"><span class="material-symbols-outlined">home</span></a>
    <?php endif; ?>

    <?php if ($currentPage !== 'programme.php'): ?>
        <a href="programme.php" class="menu-btn flex-center" title="Training Programme"><span class="material-symbols-outlined">calendar_month</span></a>
    <?php endif; ?>

    <?php if ($currentPage === 'home.php'): ?>
        <button id="btn-next-bg" class="menu-btn flex-center hidden" title="Next Background"><span class="material-symbols-outlined">image</span></button>
    <?php endif; ?>

    <button id="btn-login-trigger" class="menu-btn flex-center <?php if($isLoggedIn) echo 'hidden'; ?>" title="Login"><span class="material-symbols-outlined">login</span></button>
    
    <?php if ($currentPage === 'programme.php'): ?>
        <button id="btn-toggle-edit" class="menu-btn flex-center <?php if(!$isLoggedIn || !hasPermission($pdo, 'edit_programme')) echo 'hidden'; ?>" title="Edit Programme"><span class="material-symbols-outlined">edit</span></button>
    <?php elseif ($currentPage === 'index.php'): ?>
        <button id="btn-edit-mode" class="menu-btn flex-center <?php if(!$isLoggedIn || !hasPermission($pdo, 'edit_slides')) echo 'hidden'; ?>" title="Edit Slides"><span class="material-symbols-outlined">edit</span></button>
    <?php else: ?>
        <button id="btn-edit-mode" class="menu-btn flex-center <?php if(!$isLoggedIn || !hasPermission($pdo, 'edit_slides')) echo 'hidden'; ?>" title="Edit Mode"><span class="material-symbols-outlined">edit</span></button>
    <?php endif; ?>

    <a href="admin.php" id="link-admin" class="menu-btn flex-center <?php if(!$isLoggedIn) echo 'hidden'; ?>" title="Admin Panel"><span class="material-symbols-outlined">settings</span></a>
    <button id="btn-logout" class="menu-btn flex-center <?php if(!$isLoggedIn) echo 'hidden'; ?>" title="Logout"><span class="material-symbols-outlined">logout</span></button>
</div>

<!-- Login Modal -->
<?php include __DIR__ . '/login_modal.php'; ?>
