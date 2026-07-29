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
    requirePermission($pdo, 'manage_settings');

    $json_value = json_encode($data);
    $stmt = $pdo->prepare("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES ('global_config', ?)");
    if ($stmt->execute([$json_value])) {
        jsonResponse(['success' => true]);
    } else {
        http_response_code(500);
        jsonResponse(['success' => false, 'error' => 'Database error']);
    }
}

if ($method === 'GET' && $action === 'menu_order') {
    $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'menu_order'");
    $stmt->execute();
    $result = $stmt->fetchColumn();
    $menu_order = $result ? json_decode($result, true) : ['home.php', 'programme.php', 'index.php', 'documents.php'];

    $stmt = $pdo->prepare("SELECT value FROM settings WHERE key = 'default_page'");
    $stmt->execute();
    $result = $stmt->fetchColumn();
    $default_page = $result ? json_decode($result, true) : 'displayboard';

    jsonResponse([
        'menu_order' => $menu_order,
        'default_page' => $default_page
    ]);
}

if ($method === 'POST' && $action === 'menu_order') {
    requirePermission($pdo, 'manage_settings');

    $menu_order = $data['menu_order'] ?? ['home.php', 'programme.php', 'index.php', 'documents.php'];
    $default_page = $data['default_page'] ?? 'displayboard';

    $stmt1 = $pdo->prepare("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES ('menu_order', ?)");
    $res1 = $stmt1->execute([json_encode($menu_order)]);

    $stmt2 = $pdo->prepare("INSERT OR REPLACE INTO settings (`key`, `value`) VALUES ('default_page', ?)");
    $res2 = $stmt2->execute([json_encode($default_page)]);

    if ($res1 && $res2) {
        $_SESSION['menu_order'] = $menu_order; // Update current user's session cache
        jsonResponse(['success' => true]);
    } else {
        http_response_code(500);
        jsonResponse(['success' => false, 'error' => 'Database error']);
    }
}

http_response_code(400);
jsonResponse(['success' => false, 'error' => 'Invalid action']);
?>
