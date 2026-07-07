<?php
session_start();
$isLoggedIn = isset($_SESSION['user_id']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RAFAC Squadron Homepage</title>
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,<svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'><path fill='none' stroke='%2300247D' stroke-linecap='round' stroke-linejoin='round' stroke-width='16' d='M232,104A48.14,48.14,0,0,0,184,56H163.63a15.93,15.93,0,0,0-13.8,8L104,144H56a24,24,0,0,0,0,48h40L53.63,225.82a8,8,0,0,0,6.79,12.18h28L152,152h32A48.14,48.14,0,0,0,232,104Z'/><line fill='none' stroke='%2300247D' stroke-linecap='round' stroke-linejoin='round' stroke-width='16' x1='24' y1='112' x2='48' y2='112'/></svg>">

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

  <script>
      window.IS_LOGGED_IN = <?php echo $isLoggedIn ? 'true' : 'false'; ?>;
  </script>
  
  <script src="js/utils.js"></script>
  <script src="js/api.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/home.js"></script>
</body>
</html>
