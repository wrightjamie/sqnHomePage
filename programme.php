<?php
require_once 'api/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Training Programme</title>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/pages/programme.css">

</head>
<body>
    <div class="programme-container">
        <div class="month-header">
            <div class="logos">
                <img src="images/rafac-logo-dark.svg" alt="ATC Crest" class="header-logo" id="logo-left">
            </div>
            <div>
                <div class="no-print flex-center gap-sm mb-xs">
                    <button class="btn btn-secondary btn-sm flex-center" id="btn-prev-month"><span class="material-symbols-outlined btn-icon-md mr-xs">chevron_left</span> <span id="lbl-prev-month">Prev Month</span></button>
                    <button class="btn btn-secondary btn-sm flex-center" id="btn-next-month"><span id="lbl-next-month">Next Month</span> <span class="material-symbols-outlined btn-icon-md ml-xs">chevron_right</span></button>
                </div>
                <h1 id="month-title">Training Programme</h1>
            </div>
            <div class="logos">
                <img src="images/rafac-logo-dark.svg" alt="RAFAC Logo" class="header-logo">
            </div>
        </div>
        
        <div style="position: relative;">
            <table class="prog-table" id="prog-table">
                <thead>
                    <tr>
                        <th rowspan="2" class="date-col">Date</th>
                        <th rowspan="2" class="uniform-col">Uniform</th>
                        <th id="classifications-header" style="border-bottom: 0.0625rem solid #000;">Classifications</th>
                        <th rowspan="2" class="notes-col">Notes</th>
                    </tr>
                    <tr id="classifications-subheader">
                        <!-- Populated by JS -->
                    </tr>
                </thead>
                <tbody id="prog-body">
                    <!-- Rows populated by JS -->
                </tbody>
            </table>
        </div>
        
        <div class="mt-lg">
            <h3 class="mb-sm">Month Notes</h3>
            <div id="month-notes-container" class="editable-cell month-notes-container" data-type="month-notes"></div>
        </div>
        
        <!-- Controls -->
        <div class="no-print" style="position: fixed; bottom: 1.25rem; right: 1.25rem; display: flex; gap: 0.625rem;">
            <a href="index.php" class="btn btn-secondary flex-center" title="Back to Display" style="padding:0.625rem;"><span class="material-symbols-outlined">home</span></a>
            <?php if (isset($_SESSION['user_id'])): ?>
                <button id="btn-toggle-edit" class="btn btn-primary flex-center" style="padding:0.625rem 1.25rem; font-weight:bold;"><span class="material-symbols-outlined" style="margin-right:0.3125rem;">edit</span> Edit Mode</button>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Auto Save Toast -->
    <div id="toast-container">
        <span class="material-symbols-outlined toast-icon-sync" id="toast-icon">sync</span>
        <span id="toast-message">Saving...</span>
    </div>
    
    <!-- Popovers -->
    <div id="activity-popover" class="popover-panel" popover>
        <h3>Edit Activity</h3>
        <input type="text" id="act-name" list="dl-activities" placeholder="Activity Name" class="form-control">
        <div class="popular-btns mb-sm" id="act-popular-btns"></div>
        
        <select id="act-type" class="form-control mb-sm"></select>
        
        <select id="act-instructor" class="form-control"></select>
        <div class="popular-btns mb-md flex-wrap gap-xs" id="staff-popular-btns"></div>
        
        <div class="popover-footer">
            <div class="flex-row gap-xs">
                <button id="btn-act-merge" class="btn btn-secondary btn-sm" title="Merge Left"><span class="material-symbols-outlined btn-icon-md">keyboard_double_arrow_left</span></button>
                <button id="btn-act-split" class="btn btn-secondary btn-sm" title="Split"><span class="material-symbols-outlined btn-icon-md">splitscreen</span></button>
            </div>
            <button id="btn-act-save" class="btn btn-primary btn-sm">Done</button>
        </div>
    </div>
    
    <div id="uniform-popover" class="popover-panel" popover>
        <h3>Select Uniform</h3>
        <div id="unif-grid" class="unif-grid"></div>
    </div>

    <div id="notes-popover" class="popover-panel" popover>
        <h3>Edit Notes</h3>
        <textarea id="note-text" placeholder="Add note..."></textarea>
        <div class="popular-btns" id="note-popular-btns"></div>
        <div class="popover-footer popover-footer-end">
            <button id="btn-note-save" class="btn btn-primary btn-sm">Done</button>
        </div>
    </div>

    <!-- Interactive UI Layer -->
    <div id="bottom-right-controls">
        <div class="expandable-menu vertical-menu flex-center" tabindex="0">
            <div class="expandable-menu-trigger flex-center" title="Menu">
                <span class="material-symbols-outlined">menu</span>
            </div>
            <div class="expandable-menu-items">
                <a href="index.php" class="menu-btn flex-center" title="Display Board"><span class="material-symbols-outlined">slideshow</span></a>
                <button id="btn-login-trigger" class="menu-btn flex-center" title="Login"><span class="material-symbols-outlined">login</span></button>
                <button id="btn-toggle-edit" class="menu-btn flex-center hidden" title="Edit Programme"><span class="material-symbols-outlined">edit</span></button>
                <a href="admin.php" id="link-admin" class="menu-btn flex-center hidden" title="Admin Panel"><span class="material-symbols-outlined">settings</span></a>
                <button id="btn-logout" class="menu-btn flex-center hidden" title="Logout"><span class="material-symbols-outlined">logout</span></button>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <?php include 'components/login_modal.php'; ?>

    <script src="js/api.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/programme.js"></script>
</body>
</html>
