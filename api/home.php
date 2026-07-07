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
    $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'home_config'");
    $stmt->execute();
    $result = $stmt->fetchColumn();
    if ($result) {
        $decoded = json_decode($result, true);
        jsonResponse($decoded);
    } else {
        jsonError('No config found', 404);
    }
    exit;
}

// POST actions require authentication
if (!isset($_SESSION['user_id'])) {
    jsonError('Unauthorized', 401);
}

if ($method === 'POST' && $action === 'config') {
    $jsonConfig = json_encode($data);
    $stmt = $pdo->prepare("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES ('home_config', ?)");
    $stmt->execute([$jsonConfig]);
    jsonResponse(['message' => 'Config saved']);
}

jsonError('Invalid action', 400);
