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
        <svg viewBox="0 0 45 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path class="swoosh-inner" d="M0 0v300H3.9c-3.3-99.4.1-187.2 37-300Z"></path>
            <path class="swoosh-dividing" d="M45 0C32.2 35.4 4.4 163.2 18.1 300H3.9c-3.3-99.4.1-187.2 37-300H45Z"></path>
        </svg>
        
        <!-- Logo Top Left -->
        <div id="logo-container">
            <img src="images/rafac-logo.svg" alt="RAF Air Cadets">
        </div>

        <h1 class="swoosh-sidebar-text">2459 Squadron</h1>
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

    <div id="gallery-modal" class="modal hidden">
        <div class="modal-content modal-lg flex-col">
            <div class="flex-row justify-between align-center mb-md">
                <h2>Image Gallery</h2>
                <button id="btn-upload-new" class="btn-primary">Upload New</button>
                <input type="file" id="gallery-file-input" class="hidden" accept="image/*">
            </div>
            <div id="gallery-grid-view">
                <div id="gallery-grid" class="gallery-grid">
                    <!-- Images injected here -->
                </div>
                <div id="gallery-pagination" class="flex-center gap-sm mt-md">
                    <button id="btn-gal-prev" class="btn-secondary">Prev</button>
                    <span id="gal-page-info">Page 1 of 1</span>
                    <button id="btn-gal-next" class="btn-secondary">Next</button>
                </div>
                <div class="text-right mt-md">
                    <button id="btn-close-gallery" class="btn-secondary">Close</button>
                </div>
            </div>

            <!-- Focus Selector View -->
            <div id="focus-selector-view" class="hidden flex-col">
                <h3 class="mb-sm">Set Image Focus Point</h3>
                <p class="mb-md">Click on the image to set its central focus point. This prevents important details from being cropped out on the display board.</p>
                <div id="focus-preview-container" style="position: relative; display: block; margin: 0 auto; width: max-content; max-width: 100%; cursor: crosshair; border: 1px solid var(--color-muted);">
                    <img id="focus-preview-img" src="" style="display: block; max-width: 100%; max-height: 50vh; width: auto; height: auto;">
                    <div id="focus-reticle" style="position: absolute; width: 20px; height: 20px; border: 2px solid var(--raf-red); border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; box-shadow: 0 0 0 2px white;"></div>
                </div>
                <div class="flex-row justify-between align-center mt-md">
                    <span id="focus-coords-text">Focus: 50%, 50%</span>
                    <div class="flex-row gap-sm">
                        <button id="btn-focus-back" class="btn-secondary">Cancel</button>
                        <button id="btn-focus-save" class="btn-primary">Save & Select</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>
    <script src="js/utils.js?v=<?= time() ?>"></script>
    <script src="js/api.js?v=<?= time() ?>"></script>
    <script src="js/auth.js?v=<?= time() ?>"></script>
    <script src="js/display-board.js?v=<?= time() ?>"></script>
</body>
</html>
