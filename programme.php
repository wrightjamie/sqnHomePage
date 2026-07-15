<?php
require_once 'api/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Training Programme</title>
    <link rel="icon" href="uploads/roundel.svg" type="image/svg+xml">
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
                        <th rowspan="2" class="duty-col">Duties</th>
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
        
    </div>
    
    
    <!-- Popovers -->
    <div id="activity-popover" class="popover-panel" popover>
        <h3>Edit Activity</h3>
        <input type="text" id="act-name" list="dl-activities" placeholder="Activity Name" class="form-control">
        <div class="popular-btns mb-sm" id="act-popular-btns"></div>
        
        <div id="act-type" class="radio-selector-group mb-sm flex-row flex-wrap gap-xs"></div>
        
        <select id="act-instructor" class="form-control"></select>
        <div class="popular-btns mb-md flex-wrap gap-xs" id="staff-popular-btns"></div>
        
        <div class="popover-footer">
            <div class="flex-row gap-xs">
                <button id="btn-act-merge" class="btn btn-secondary btn-sm" title="Merge Left"><span class="material-symbols-outlined btn-icon-md">keyboard_double_arrow_left</span></button>
                <button id="btn-act-split" class="btn btn-secondary btn-sm" title="Split"><span class="material-symbols-outlined btn-icon-md">splitscreen</span></button>
            </div>
            <button id="btn-act-save" class="btn btn-primary btn-sm" title="Done"><span class="material-symbols-outlined btn-icon-md">check</span></button>
        </div>
    </div>
    
    <div id="uniform-popover" class="popover-panel" popover>
        <h3>Select Uniform</h3>
        <div id="unif-grid" class="unif-grid"></div>
    </div>

    <div id="duty-popover" class="popover-panel" popover>
        <h3>Edit Duties</h3>
        <label class="form-label text-sm font-bold mb-xs">Duty NCO</label>
        <select id="duty-nco-select" class="form-control mb-md"></select>

        <label class="form-label text-sm font-bold mb-xs">Duty Cadet</label>
        <input type="text" id="duty-cadet-input" placeholder="Duty Cadet" class="form-control mb-md">
        <div class="popover-footer popover-footer-end">
            <button id="btn-duty-save" class="btn btn-primary btn-sm" title="Done"><span class="material-symbols-outlined btn-icon-md">check</span></button>
        </div>
    </div>

    <div id="notes-popover" class="popover-panel" popover>
        <h3>Edit Notes</h3>
        <div id="notes-list-editor" class="flex-col gap-xs mb-sm"></div>
        <datalist id="dl-notes"></datalist>
        <div class="flex-row gap-xs mb-md">
            <input type="text" id="new-note-input" class="form-control flex-grow-1" placeholder="Type a note..." list="dl-notes">
            <button id="btn-note-add" class="btn btn-primary btn-sm flex-center" title="Add Note"><span class="material-symbols-outlined btn-icon-md">add</span></button>
        </div>
        <div class="popular-btns flex-row flex-wrap gap-xs mb-sm" id="note-popular-btns"></div>
        <div class="popover-footer popover-footer-end">
            <button id="btn-note-save" class="btn btn-primary btn-sm" title="Done"><span class="material-symbols-outlined btn-icon-md">check</span></button>
        </div>
    </div>

    <!-- Interactive UI Layer -->
    <?php include 'components/menu.php'; ?>

    <script src="js/utils.js"></script>
    <script src="js/api.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/programme-editor.js"></script>
    <script src="js/programme.js"></script>
</body>
</html>
