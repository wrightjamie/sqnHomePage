<?php
require_once 'config.php';
require_once 'utils.php';
require_once 'programme_helpers.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    if (!empty($_POST)) {
        $data = $_POST;
    } else {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
    }
} else {
    $data = $_GET;
}

if ($method === 'GET' && $action === 'config') {
    $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'programme_config'");
    $stmt->execute();
    $result = $stmt->fetchColumn();
    if ($result) {
        $decoded = json_decode($result, true);
        jsonResponse($decoded);
    } else {
        // Fallback default structure
        $defaultProgrammeConfig = [
            "uniforms" => [],
            "parade_nights" => [],
            "activity_types" => [],
            "classifications" => [],
            "ranks" => [],
            "staff" => []
        ];
        jsonResponse($defaultProgrammeConfig);
    }
}

if ($method === 'GET' && $action === 'month') {
    $year = $_GET['year'] ?? '';
    $month = $_GET['month'] ?? '';
    $key = "programme_{$year}_{$month}";
    
    $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = ?");
    $stmt->execute([$key]);
    $result = $stmt->fetchColumn();
    if ($result) {
        $decoded = json_decode($result, true);
        jsonResponse($decoded);
    } else {
        jsonResponse(['parade_nights' => [], 'month_comments' => []]);
    }
}

if ($method === 'GET' && $action === 'night') {
    $mode = $_GET['mode'] ?? 'next';
    $targetDate = '';
    
    // Always fetch config to know the parade days
    $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'programme_config'");
    $stmt->execute();
    $configResult = $stmt->fetchColumn();
    $paradeDays = [];
    if ($configResult) {
        $config = json_decode($configResult, true);
        $paradeDays = $config['parade_nights'] ?? [];
    }
    
    if ($mode === 'specific') {
        $targetDate = $_GET['date'] ?? date('Y-m-d');
    } elseif ($mode === 'today') {
        $targetDate = date('Y-m-d');
    } else {
        $targetDate = date('Y-m-d'); // Default fallback
        if (!empty($paradeDays)) {
            for ($i = 1; $i <= 7; $i++) {
                $testDate = date('Y-m-d', strtotime("+$i days"));
                $dayOfWeek = date('l', strtotime($testDate));
                if (in_array($dayOfWeek, $paradeDays)) {
                    $targetDate = $testDate;
                    break;
                }
            }
        }
    }
    
    // Calculate prev and next dates relative to the targetDate
    $prevDate = null;
    $nextDate = null;
    if (!empty($paradeDays)) {
        for ($i = 1; $i <= 7; $i++) {
            $testDate = date('Y-m-d', strtotime("$targetDate -$i days"));
            if (in_array(date('l', strtotime($testDate)), $paradeDays)) {
                $prevDate = $testDate;
                break;
            }
        }
        for ($i = 1; $i <= 7; $i++) {
            $testDate = date('Y-m-d', strtotime("$targetDate +$i days"));
            if (in_array(date('l', strtotime($testDate)), $paradeDays)) {
                $nextDate = $testDate;
                break;
            }
        }
    }
    
    $year = date('Y', strtotime($targetDate));
    $month = date('n', strtotime($targetDate));
    
    $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = ?");
    $stmt->execute(["programme_{$year}_{$month}"]);
    $monthResult = $stmt->fetchColumn();
    
    $nightData = null;
    $monthNotes = [];
    if ($monthResult) {
        $monthData = json_decode($monthResult, true);
        if (isset($monthData['month_comments'])) {
            $monthNotes = $monthData['month_comments'];
        }
        if (isset($monthData['parade_nights'])) {
            foreach ($monthData['parade_nights'] as $night) {
                if (isset($night['date']) && $night['date'] === $targetDate) {
                    $nightData = $night;
                    break;
                }
            }
        }
    }
    
    jsonResponse(['date' => $targetDate, 'night' => $nightData, 'month_notes' => $monthNotes, 'prev_date' => $prevDate, 'next_date' => $nextDate]);
}

if ($method === 'GET' && $action === 'autocomplete') {
    $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'programme_autocomplete_cache'");
    $stmt->execute();
    $result = $stmt->fetchColumn();
    if ($result) {
        $decoded = json_decode($result, true);
        jsonResponse($decoded);
    } else {
        jsonResponse(['activities' => [], 'comments' => []]);
    }
}

if ($method === 'GET' && $action === 'rename_preview') {
    requirePermission($pdo, 'edit_programme');
    $type = trim((string)($_GET['type'] ?? ''));
    $oldValue = trim((string)($_GET['old_value'] ?? ''));

    if (!isValidProgrammeRenameType($type) || $oldValue === '') {
        jsonError('Valid type and old_value required.', 400);
    }

    $preview = propagateProgrammeRename($pdo, $type, $oldValue, $oldValue, false);
    jsonResponse($preview);
}

// POST actions require authentication
if ($method === 'POST') {
    $hasEditProg = hasPermission($pdo, 'edit_programme');
    $hasEditDuties = hasPermission($pdo, 'edit_duties');
    if (!$hasEditProg && !$hasEditDuties) {
        jsonError("Permission denied.", 403);
    }
}

if ($method === 'POST' && $action === 'config') {
    if (!hasPermission($pdo, 'edit_programme')) jsonError("Permission denied.", 403);
    $jsonConfig = json_encode($data);
    $stmt = $pdo->prepare("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES ('programme_config', ?)");
    $stmt->execute([$jsonConfig]);
    jsonResponse(['success' => true, 'message' => 'Config saved']);
}

if ($method === 'POST' && $action === 'rename_references') {
    if (!hasPermission($pdo, 'edit_programme')) jsonError("Permission denied.", 403);
    $type = trim((string)($data['type'] ?? ''));
    $oldValue = trim((string)($data['old_value'] ?? ''));
    $newValue = trim((string)($data['new_value'] ?? ''));

    if (!isValidProgrammeRenameType($type) || $oldValue === '' || $newValue === '') {
        jsonError('Valid type, old_value, and new_value required.', 400);
    }

    try {
        $result = propagateProgrammeRename($pdo, $type, $oldValue, $newValue, true);
        jsonResponse([
            'success' => true,
            'updated_nights' => $result['matching_nights'],
            'updated_occurrences' => $result['matching_occurrences'],
            'updated_months' => $result['updated_months'],
            'from_date' => $result['from_date']
        ]);
    } catch (Exception $e) {
        jsonError('Failed to update upcoming parade nights.', 500);
    }
}

if ($method === 'POST' && $action === 'month') {
    $year = filter_var($data['year'] ?? null, FILTER_VALIDATE_INT);
    $month = filter_var($data['month'] ?? null, FILTER_VALIDATE_INT);
    $programme = $data['programme'] ?? [];
    
    if ($year === false || $month === false || $year < 1970 || $year > 2100 || $month < 1 || $month > 12) {
        jsonError('Valid year and month required', 400);
    }
    
    $key = "programme_{$year}_{$month}";

    if (!hasPermission($pdo, 'edit_programme') && hasPermission($pdo, 'edit_duties')) {
        // Restricted duties-only edit mode: allow creating/updating a month skeleton with duties only
        $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = ?");
        $stmt->execute([$key]);
        $existingResult = $stmt->fetchColumn();
        $existingData = $existingResult ? json_decode($existingResult, true) : null;

        $configStmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'programme_config'");
        $configStmt->execute();
        $configResult = $configStmt->fetchColumn();
        $programmeConfig = $configResult ? (json_decode($configResult, true) ?: []) : [];

        $programme = mergeDutiesOnlyProgramme(
            $programmeConfig,
            is_array($existingData) ? $existingData : null,
            is_array($programme) ? $programme : [],
            (int)$year,
            (int)$month
        );
    }
    
    $jsonProgramme = json_encode($programme);
    
    $stmt = $pdo->prepare("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES (?, ?)");
    $stmt->execute([$key, $jsonProgramme]);
    
    if (hasPermission($pdo, 'edit_programme')) {
        // Update autocomplete cache
        $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'programme_autocomplete_cache'");
        $stmt->execute();
        $result = $stmt->fetchColumn();
    $cache = $result ? json_decode($result, true) : ['activities' => [], 'comments' => []];
    
    // Tally frequencies
    $activityFreq = [];
    $commentFreq = [];
    
    // Repopulate from scratch based on existing cache to maintain past counts, but decay them over time?
    // Let's just maintain a simple dict of {name: count} and increment.
    foreach($cache['activities'] as $act) {
        $activityFreq[$act['name']] = $act['count'];
    }
    foreach($cache['comments'] as $com) {
        $commentFreq[$com['name']] = $com['count'];
    }
    
    // Process new programme
    if (isset($programme['parade_nights']) && is_array($programme['parade_nights'])) {
        foreach($programme['parade_nights'] as $pn) {
            if (isset($pn['activities']) && is_array($pn['activities'])) {
                foreach($pn['activities'] as $act) {
                    if (!empty($act['name'])) {
                        $n = trim($act['name']);
                        if (!isset($activityFreq[$n])) $activityFreq[$n] = 0;
                        $activityFreq[$n]++;
                    }
                }
            }
            if (isset($pn['notes']) && is_array($pn['notes'])) {
                foreach($pn['notes'] as $note) {
                    if (!empty($note)) {
                        $n = trim($note);
                        if (!isset($commentFreq[$n])) $commentFreq[$n] = 0;
                        $commentFreq[$n]++;
                    }
                }
            }
        }
    }
    if (isset($programme['month_comments']) && is_array($programme['month_comments'])) {
        foreach($programme['month_comments'] as $note) {
            if (!empty($note)) {
                $n = trim($note);
                if (!isset($commentFreq[$n])) $commentFreq[$n] = 0;
                $commentFreq[$n]++;
            }
        }
    }
    
    // Convert back to sorted arrays
    $newActivities = [];
    foreach($activityFreq as $name => $count) {
        $newActivities[] = ['name' => $name, 'count' => $count];
    }
    usort($newActivities, function($a, $b) { return $b['count'] <=> $a['count']; });
    
    $newComments = [];
    foreach($commentFreq as $name => $count) {
        $newComments[] = ['name' => $name, 'count' => $count];
    }
    usort($newComments, function($a, $b) { return $b['count'] <=> $a['count']; });
    
    $newCache = [
        'activities' => array_slice($newActivities, 0, 100), // Keep top 100
        'comments' => array_slice($newComments, 0, 100)
    ];
    
    $stmt = $pdo->prepare("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES ('programme_autocomplete_cache', ?)");
    $stmt->execute([json_encode($newCache)]);
    } // End of if (hasPermission($pdo, 'edit_programme'))
    
    jsonResponse(['success' => true, 'message' => 'Month saved']);
}

jsonError('Invalid action', 400);
