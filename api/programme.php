<?php
require_once 'config.php';
require_once 'utils.php';

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

// POST actions require authentication
if (!isset($_SESSION['user_id'])) {
    jsonError('Unauthorized', 401);
}

if ($method === 'POST' && $action === 'config') {
    $jsonConfig = json_encode($data);
    $stmt = $pdo->prepare("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES ('programme_config', ?)");
    $stmt->execute([$jsonConfig]);
    jsonResponse(['message' => 'Config saved']);
}

if ($method === 'POST' && $action === 'month') {
    $year = $data['year'] ?? '';
    $month = $data['month'] ?? '';
    $programme = $data['programme'] ?? [];
    
    if (!$year || !$month) {
        jsonError('Year and month required', 400);
    }
    
    $key = "programme_{$year}_{$month}";
    $jsonProgramme = json_encode($programme);
    
    $stmt = $pdo->prepare("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES (?, ?)");
    $stmt->execute([$key, $jsonProgramme]);
    
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
    
    jsonResponse(['message' => 'Month saved']);
}

jsonError('Invalid action', 400);
