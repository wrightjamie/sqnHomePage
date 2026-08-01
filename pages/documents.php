<?php if (!defined('IN_ROUTER')) { die('Direct access not permitted'); } ?>
<?php


require_once 'api/config.php';
require_once 'api/utils.php';

requirePagePermission($pdo, 'view_documents');

$basePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
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
        @media screen {
            html, body {
                overflow: hidden; /* Stop whole page scrolling */
                height: 100%;
            }
            .doc-container {
                max-width: 1000px;
                margin: 0 auto;
                padding: var(--space-xl);
                padding-top: 80px; /* Push content down to clear the overflowing swoosh */
                height: calc(100% - 120px);
                display: flex;
                flex-direction: column;
                position: relative;
                z-index: 2;
            }
            .doc-view, #doc-list {
                flex: 1;
                overflow-y: auto;
                scrollbar-width: thin;
                padding-right: var(--space-sm);
            }
            
            /* Quill editor container flex styling */
            .ql-toolbar {
                flex-shrink: 0;
            }
            .ql-container {
                flex: 1;
                overflow-y: auto;
                min-height: 0;
            }
            #editor-container {
                display: flex;
                flex-direction: column;
                flex: 1;
                min-height: 0; /* Important for nested flex scrolling */
            }
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
            h1, h2 { page-break-before: auto; }
            h1 { font-size: 2rem !important; }
            .doc-amendments-section { page-break-before: always; break-before: page; }
            .mb-md { margin-bottom: 0 !important; }
            button { display: none !important; }

            /* Running header/footer via fixed position */
            @page {
                margin: 20mm;
                margin-top: 0;
                margin-bottom: 25mm; /* Extra space for footer */
            }

            .print-only-footer {
                display: block !important;
                position: fixed;
                bottom: 0;
                right: 0;
                font-size: 0.9rem;
                color: #555;
            }
        }

        .print-only-footer {
            display: none;
        }
    </style>
</head>
<body>

    <?php
        $headerTitle = 'Squadron Documents';
        include 'components/header_swoosh.php';
    ?>

    <div class="doc-container" id="app-root">
        <!-- JS renders here -->
    </div>

    <!-- Interactive UI Layer -->
    <?php

 include 'components/menu.php'; ?>

    <!-- Image Gallery Modal -->
    <?php

 include 'components/gallery.php'; ?>
    <?php include 'components/image_editor.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>



    <script type="module" src="js/utils/image-editor.js?v=<?= time() ?>"></script>
    <script type="module" src="js/documents.js"></script>
</body>
</html>
