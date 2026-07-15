<?php
require_once 'api/config.php';
$basePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
$slug = null;
if (!empty($_SERVER['PATH_INFO'])) {
    $slug = trim($_SERVER['PATH_INFO'], '/');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <base href="<?= htmlspecialchars($basePath) ?>">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Squadron Documents</title>
    <link rel="icon" href="uploads/roundel.svg" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet">
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/components.css">
    <style>
        .doc-container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: var(--space-xl);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            min-height: calc(100vh - 140px); /* Fix double scrollbar by accounting for header height */
        }

        .doc-header-swoosh {
            height: 140px;
            width: 100%;
            position: relative;
            display: flex;
            align-items: center;
            padding: 0 var(--space-lg);
            color: white;
            justify-content: space-between;
            background: linear-gradient(to bottom, var(--colour-footer) 0%, var(--colour-footer) calc(100% - 60px), transparent calc(100% - 60px), transparent 100%);
        }

        .header-swoosh-svg {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 60px;
            z-index: -1;
            transform: scaleX(-1);
        }

        .doc-header-swoosh h1 {
            margin: 0;
            font-size: 2.5rem;
            z-index: 2;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .doc-header-swoosh img {
            height: 80px;
            z-index: 2;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
            margin-right: 60px; /* Prevent overlap with top-right menu */
        }

        .doc-list-item {
            padding: var(--space-md);
            border: 1px solid #ddd;
            margin-bottom: var(--space-md);
            border-radius: var(--space-sm);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f9f9f9;
            cursor: pointer;
            transition: box-shadow 0.2s;
        }

        .doc-list-item:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        dialog::backdrop {
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(3px);
        }

        .doc-amendments-section {
            margin-top: 5rem;
        }

        .doc-meta {
            color: var(--color-muted);
            font-size: 0.9rem;
            margin-bottom: var(--space-md);
            padding-bottom: var(--space-sm);
            border-bottom: 1px solid #eee;
        }

        .doc-content {
            line-height: 1.6;
        }

        .doc-history-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: var(--space-md);
        }

        .doc-history-table th, .doc-history-table td {
            border: 1px solid #ddd;
            padding: var(--space-sm);
            text-align: left;
        }

        .doc-history-table th {
            background: #f4f4f4;
            font-weight: bold;
        }

        /* Edit mode specific */
        .edit-controls {
            background: #f9f9f9;
            padding: var(--space-md);
            border-radius: var(--space-sm);
            margin-bottom: var(--space-lg);
            border: 1px solid #ddd;
        }

        #editor-container {
            height: 500px;
            margin-bottom: var(--space-lg);
        }

        .ql-toolbar {
            border-top-left-radius: var(--space-sm);
            border-top-right-radius: var(--space-sm);
            background: #f4f4f4;
        }

        .ql-container {
            border-bottom-left-radius: var(--space-sm);
            border-bottom-right-radius: var(--space-sm);
            font-family: inherit;
            font-size: 1rem;
        }

        /* User Menu Override */
        #top-right-controls {
            z-index: 100 !important;
        }
        
        #user-menu {
            z-index: 101 !important;
        }

        /* Hide specific nav buttons that don't apply here */
        #btn-toggle-play, #btn-fullscreen {
            display: none !important;
        }

        /* Fix bottom right controls opacity logic for this page */
        #bottom-right-controls {
            opacity: 1; /* Always visible unlike index */
        }

        #bottom-right-controls:hover {
            opacity: 1;
        }

        .nav-btn {
            background: var(--nav-btn-bg);
            opacity: 1;
        }

        .nav-btn:hover {
            background: var(--nav-btn-hover);
            opacity: 1;
        }

        @media print {
            body { background: white; margin: 0; padding-top: 140px; }
            #bottom-right-controls, .no-print { display: none !important; }
            .doc-container { padding: 0; max-width: 100%; box-shadow: none; margin: 0; min-height: 0; }
            h1 { page-break-before: always; }
            .doc-amendments-section { page-break-before: always; break-before: page; }
            .mb-md { margin-bottom: 0 !important; }
            button { display: none !important; }

            .doc-header-swoosh { 
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                z-index: 1000; 
                height: 120px;
                display: flex !important;
            }

            /* Running header/footer via fixed position */
            @page {
                margin: 20mm;
                margin-top: 0;
            }
        }
    </style>
</head>
<body>

    <div class="doc-header-swoosh no-print">
        <?php 
            $swooshOrientation = 'horizontal';
            $swooshClass = 'header-swoosh-svg';
            include 'components/swoosh.php'; 
        ?>
        <h1>Squadron Documents</h1>
        <img src="images/rafac-logo.svg" alt="RAFAC">
    </div>

    <div class="doc-container" id="app-root">
        <!-- JS renders here -->
    </div>

    <!-- Interactive UI Layer -->
    <?php include 'components/menu.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>
    <script src="js/utils.js"></script>
    <script src="js/api.js"></script>
    <script src="js/auth.js"></script>
    <script>
        window.initialDocSlug = <?= json_encode($slug) ?>;
    </script>
    <script src="js/documents.js"></script>
</body>
</html>
