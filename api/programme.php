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
    
    jsonResponse(['message' => 'Month saved']);
}

jsonError('Invalid action', 400);
