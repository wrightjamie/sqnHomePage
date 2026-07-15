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
            max-width: 900px;
            margin: 0 auto;
            padding: var(--space-lg);
            background: #fff;
            color: #000;
            min-height: 100vh;
        }

        .doc-header-swoosh {
            background-color: var(--colour-footer);
            height: 120px;
            width: 100%;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            padding: 0 var(--space-lg);
            color: white;
            justify-content: space-between;
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
        }

        .doc-view {
            padding: var(--space-xl) 0;
        }

        .doc-history-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: var(--space-xl);
            font-size: 0.9rem;
        }

        .doc-history-table th, .doc-history-table td {
            border: 1px solid #ccc;
            padding: var(--space-sm);
            text-align: left;
        }

        .doc-history-table th {
            background: #f0f0f0;
        }

        .doc-title-view {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            color: var(--raf-deep-blue);
        }

        #editor-container {
            height: 400px;
            margin-bottom: var(--space-md);
        }

        /* Override global navigation button colors for white background */
        :root {
            --nav-btn-bg: rgba(0,0,0,0.6);
            --nav-btn-opacity: 0.7;
            --nav-btn-hover-bg: rgba(0,0,0,0.9);
            --nav-btn-hover-opacity: 1;
        }

        @media print {
            body { background: white; margin: 0; }
            #bottom-right-controls, .no-print, .doc-header-swoosh { display: none !important; }
            .doc-container { padding: 0; max-width: 100%; box-shadow: none; margin: 0; }
            h1 { page-break-before: always; }
            .doc-amendments-section { page-break-before: always; break-before: page; }
            .mb-md { margin-bottom: 0 !important; }
            button { display: none !important; }

            /* Running header/footer via fixed position */
            @page {
                margin: 20mm;
            }
        }
    </style>
</head>
<body>

    <div class="doc-header-swoosh no-print">
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
