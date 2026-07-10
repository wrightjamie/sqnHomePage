<?php
require_once 'api/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RAFAC Squadron Homepage</title>
  
  <!-- Favicon -->
  <link rel="icon" href="uploads/roundel.svg" type="image/svg+xml">

  <!-- Core & Components -->
  <link rel="stylesheet" href="css/core.css">
  <link rel="stylesheet" href="css/components.css">
  <!-- Page Styles -->
  <link rel="stylesheet" href="css/pages/home.css">
  <!-- Editor Styles -->
  <link rel="stylesheet" href="css/pages/home-editor.css">
  
  <!-- Phosphor Icons Script -->
  <script src="https://unpkg.com/@phosphor-icons/web"></script>

  <!-- Material Symbols for controls -->
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
</head>
<body>
  
  <div class="container">
    <div id="app-root"></div>
  </div>

  <!-- Interactive UI Layer -->
  <div id="bottom-right-controls">
      <a href="index.php" class="menu-btn flex-center" title="Display Board"><span class="material-symbols-outlined">slideshow</span></a>
      <a href="programme.php" class="menu-btn flex-center" title="Training Programme"><span class="material-symbols-outlined">calendar_month</span></a>
      <button id="btn-next-bg" class="menu-btn flex-center hidden" title="Next Background"><span class="material-symbols-outlined">image</span></button>
      <button id="btn-login-trigger" class="menu-btn flex-center" title="Login" <?php if($isLoggedIn) echo 'style="display:none;"'; ?>><span class="material-symbols-outlined">login</span></button>
      <button id="btn-edit-mode" class="menu-btn flex-center" title="Edit Mode" <?php if(!$isLoggedIn) echo 'style="display:none;"'; ?>><span class="material-symbols-outlined">edit</span></button>
      <a href="admin.php" id="link-admin" class="menu-btn flex-center" title="Admin Panel" <?php if(!$isLoggedIn) echo 'style="display:none;"'; ?>><span class="material-symbols-outlined">settings</span></a>
      <button id="btn-logout" class="menu-btn flex-center" title="Logout" <?php if(!$isLoggedIn) echo 'style="display:none;"'; ?>><span class="material-symbols-outlined">logout</span></button>
  </div>

  <!-- Login Modal -->
  <?php include 'components/login_modal.php'; ?>

  <!-- Gallery Modal for background picking -->
  <div id="gallery-modal" class="modal hidden">
      <div class="modal-content modal-lg flex-col">
          <div class="flex-row justify-between align-center mb-md">
              <h2>Image Gallery</h2>
              <div>
                <button id="btn-upload-new" class="btn-primary">Upload New</button>
                <button id="btn-close-gallery" class="btn-secondary">Close</button>
              </div>
              <input type="file" id="gallery-file-input" class="hidden" accept="image/*">
          </div>
          <div id="gallery-grid" class="gallery-grid">
              <!-- Images injected here -->
          </div>
          <div id="gallery-pagination" class="flex-center gap-sm mt-md">
              <!-- Pagination injected here -->
          </div>
      </div>
  </div>

  <script src="js/utils.js"></script>
  <script src="js/api.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/home-editor.js"></script>
  <script src="js/home.js"></script>
</body>
</html>
