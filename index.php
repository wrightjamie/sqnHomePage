<?php
// index.php
require_once 'api/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sqn Display Board</title>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet">
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/pages/index.css">
    <link rel="icon" href="uploads/roundel.svg" type="image/svg+xml">
</head>
<body>
    <div id="display-container" class="flex-col">
        <!-- Slides will be rendered here -->
        <div id="slide-viewer"></div>
        
        <!-- Slideshow Selection Menu -->
        <div id="slideshow-menu" class="hidden">
            <!-- Tabs will be dynamically inserted here -->
        </div>

        <!-- Interactive UI Layer -->
        <?php include 'components/menu.php'; ?>
    </div>
    
    <!-- Brand Swoosh Sidebar -->
    <header id="swoosh-sidebar">
        <div class="swoosh-desktop">
            <?php 
                $swooshOrientation = 'vertical';
                include 'components/swoosh.php'; 
            ?>
        </div>
        <div class="swoosh-mobile">
            <?php 
                $swooshOrientation = 'horizontal';
                $swooshClass = 'header-swoosh-svg';
                include 'components/swoosh.php'; 
            ?>
        </div>
        
        <div class="header-titles">
            <h1 class="swoosh-sidebar-text">2459 Squadron</h1>
        </div>

        <!-- Logo -->
        <div id="logo-container">
            <img src="images/rafac-logo.svg" alt="RAF Air Cadets">
        </div>
    </header>

    <!-- Modals -->

    <div id="reorder-modal" class="modal hidden">
        <div class="modal-content flex-col">
            <h2>Reorder Slides</h2>
            <div id="reorder-list" class="flex-col gap-sm mb-md reorder-list-container">
                <!-- Reorder items injected here -->
            </div>
            <div class="flex-row gap-sm">
                <button id="btn-save-reorder" class="btn-primary">Save Order</button>
                <button id="btn-cancel-reorder" class="btn-secondary">Cancel</button>
            </div>
        </div>
    </div>

        <?php include 'components/gallery.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>
    <script src="js/utils.js?v=<?= time() ?>"></script>
    <script src="js/qrcode.min.js"></script>
    <script src="js/api.js?v=<?= time() ?>"></script>
    <script src="js/auth.js?v=<?= time() ?>"></script>
    <script src="js/display-board.js?v=<?= time() ?>"></script>
</body>
</html>
