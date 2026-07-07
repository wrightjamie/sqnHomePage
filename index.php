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
        <!-- Logo Top Right -->
        <div id="logo-container">
            <img src="images/rafac-logo.svg" alt="RAF Air Cadets">
        </div>

        <!-- Slides will be rendered here -->
        <div id="slide-viewer"></div>
        
        <!-- Slideshow Selection Menu -->
        <div id="slideshow-menu" class="hidden">
            <!-- Tabs will be dynamically inserted here -->
        </div>

        <!-- Interactive UI Layer -->
        <div id="bottom-right-controls">
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
            <button id="btn-login-trigger" class="menu-btn flex-center" title="Login"><span class="material-symbols-outlined">login</span></button>
            <a href="programme.php" class="menu-btn flex-center" title="Training Programme"><span class="material-symbols-outlined">calendar_month</span></a>
            <button id="btn-edit-mode" class="menu-btn flex-center hidden" title="Edit Mode"><span class="material-symbols-outlined">edit</span></button>
            <a href="admin.php" id="link-admin" class="menu-btn flex-center hidden" title="Admin Panel"><span class="material-symbols-outlined">settings</span></a>
            <button id="btn-logout" class="menu-btn flex-center hidden" title="Logout"><span class="material-symbols-outlined">logout</span></button>
        </div>
    </div>
    
    <!-- Brand Swoosh Footer -->
    <div id="swoosh-footer">
        <!-- Outer, Dividing, Inner curves matching RAF brand guidelines -->
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0 Q60,10 100,0 L100,20 L0,20 Z" class="swoosh-inner" />
            <path d="M0,2 Q60,12 100,2 L100,0 Q60,10 0,0 Z" class="swoosh-dividing" />
            <path d="M0,20 L0,2 Q60,12 100,2 L100,20 Z" class="swoosh-outer" />
        </svg>
    </div>

    <!-- Modals -->
    <?php include 'components/login_modal.php'; ?>

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
                <div id="focus-preview-container" style="position: relative; display: inline-block; cursor: crosshair; max-width: 100%; border: 1px solid var(--color-muted);">
                    <img id="focus-preview-img" src="" style="display: block; max-width: 100%; max-height: 50vh; object-fit: contain;">
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
    <script src="js/utils.js"></script>
    <script src="js/api.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
