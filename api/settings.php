<?php
// api/settings.php
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

if ($method === 'GET' && $action === 'global_config') {
    $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'global_config'");
    $stmt->execute();
    $result = $stmt->fetchColumn();
    if ($result) {
        jsonResponse(json_decode($result, true));
    } else {
        // Return default if not set
        jsonResponse(['sidebarText' => '2459 Squadron', 'slideSpeed' => 10]);
    }
}

if ($method === 'POST' && $action === 'global_config') {
    if (!isset($_SESSION['user_id']) && (!isset($_SESSION['username']))) {
        // wait, let's just use check_session logic if needed. Or just check if session user is set
        // Actually, init_db sets username. But I'll just check if either is set for safety.
        if (empty($_SESSION)) {
            session_start();
        }
        if (!isset($_SESSION['user_id']) && !isset($_SESSION['username'])) {
            http_response_code(401);
            jsonResponse(['success' => false, 'error' => 'Unauthorized']);
        }
    }

    $json_value = json_encode($data);
    $stmt = $pdo->prepare("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES ('global_config', ?)");
    if ($stmt->execute([$json_value])) {
        jsonResponse(['success' => true]);
    } else {
        http_response_code(500);
        jsonResponse(['success' => false, 'error' => 'Database error']);
    }
}

http_response_code(400);
jsonResponse(['success' => false, 'error' => 'Invalid action']);
?>
