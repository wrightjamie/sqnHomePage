<?php
require_once __DIR__ . '/../api/utils.php';
$currentPage = isset($_GET['page']) ? $_GET['page'] : 'displayboard';

if (!isset($_SESSION['menu_order'])) {
    $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'menu_order'");
    $stmt->execute();
    $result = $stmt->fetchColumn();
    if ($result) {
        $_SESSION['menu_order'] = json_decode($result, true);
    } else {
        $_SESSION['menu_order'] = ['home.php', 'programme.php', 'index.php', 'documents.php'];
    }
}
$menuOrder = $_SESSION['menu_order'];
?>
<div id="bottom-right-controls">
    <div class="hamburger-menu" tabindex="0">
        <div class="hamburger-trigger" title="Menu">
            <span class="material-symbols-outlined">menu</span>
        </div>
        <div class="hamburger-items">
            <?php 
            // Map old filenames from DB to new route pages
            $pageMap = [
                'home.php' => 'home',
                'programme.php' => 'programme',
                'index.php' => 'displayboard',
                'documents.php' => 'documents'
            ];

            $menuItems = [
                'home' => ['title' => 'Home', 'icon' => 'home', 'perm' => 'view_home'],
                'programme' => ['title' => 'Training Programme', 'icon' => 'calendar_month', 'perm' => 'view_programme'],
                'displayboard' => ['title' => 'Display Board', 'icon' => 'slideshow', 'perm' => 'view_displayboard'],
                'documents' => ['title' => 'Documents', 'icon' => 'description', 'perm' => 'view_documents']
            ];

            foreach ($menuOrder as $dbPage):
                $routePage = isset($pageMap[$dbPage]) ? $pageMap[$dbPage] : null;
                if ($routePage && isset($menuItems[$routePage]) && $currentPage !== $routePage && hasPermission($pdo, $menuItems[$routePage]['perm'])):
            ?>
                <a href="index.php?page=<?php echo htmlspecialchars($routePage); ?>" class="menu-btn flex-center" title="<?php echo htmlspecialchars($menuItems[$routePage]['title']); ?>"><span class="material-symbols-outlined"><?php echo htmlspecialchars($menuItems[$routePage]['icon']); ?></span></a>
            <?php 
                endif;
            endforeach; 
            ?>

            <?php if ($currentPage === 'home'): ?>
                <button id="btn-next-bg" class="menu-btn flex-center hidden" title="Next Background"><span class="material-symbols-outlined">image</span></button>
            <?php endif; ?>
        </div>
    </div>
    
    <?php if ($currentPage === 'displayboard'): ?>
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
                <div class="user-dropdown-header">
                    <?php echo htmlspecialchars($_SESSION['display_name'] ?: $_SESSION['username']); ?>
                </div>
                <?php if ($currentPage === 'programme' && (hasPermission($pdo, 'edit_programme') || hasPermission($pdo, 'edit_duties'))): ?>
                    <button id="btn-toggle-edit" class="user-dropdown-btn" title="Edit Programme"><span class="material-symbols-outlined">edit</span> Edit</button>
                <?php elseif ($currentPage === 'displayboard' && hasPermission($pdo, 'edit_slides')): ?>
                    <button id="btn-edit-mode" class="user-dropdown-btn" title="Edit Slides"><span class="material-symbols-outlined">edit</span> Edit</button>
                <?php elseif ($currentPage === 'documents'): ?>
                    <!-- Edit Mode for documents is moving to inline buttons per feedback, so no toggle here -->
                <?php elseif (hasPermission($pdo, 'edit_slides')): ?>
                    <button id="btn-edit-mode" class="user-dropdown-btn" title="Edit Mode"><span class="material-symbols-outlined">edit</span> Edit</button>
                <?php endif; ?>

                <a href="index.php?page=profile" id="link-profile" class="user-dropdown-btn" title="My Profile"><span class="material-symbols-outlined">person</span> Profile</a>
                <a href="index.php?page=admin" id="link-admin" class="user-dropdown-btn" title="Admin Panel"><span class="material-symbols-outlined">settings</span> Settings</a>
                <button id="btn-logout" class="user-dropdown-btn" title="Logout"><span class="material-symbols-outlined">logout</span> Logout</button>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Login Modal -->
<?php include __DIR__ . '/login_modal.php'; ?>
