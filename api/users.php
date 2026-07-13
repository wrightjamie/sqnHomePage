<?php
// api/users.php
require_once 'config.php';
require_once 'utils.php';

header('Content-Type: application/json');

// Check authentication and authorization
requirePermission($pdo, 'manage_users');

$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
} else {
    $data = $_GET;
}

if ($method === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->query("
            SELECT u.id, u.username, u.display_name, u.status, u.role_id, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ORDER BY u.id DESC
        ");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $rolesStmt = $pdo->query("SELECT id, name FROM roles ORDER BY id ASC");
        $roles = $rolesStmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(['users' => $users, 'roles' => $roles]);
    }
}

if ($method === 'POST') {
    if ($action === 'update_status') {
        $userId = $data['user_id'] ?? null;
        $status = $data['status'] ?? null;

        if ($userId && $status && in_array($status, ['active', 'pending', 'disabled'])) {
            // Cannot disable/pend the last admin user
            if ($status !== 'active') {
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Admin' AND u.status = 'active' AND u.id != ?");
                $stmt->execute([$userId]);
                if ($stmt->fetchColumn() == 0) {
                     $checkAdmin = $pdo->prepare("SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?");
                     $checkAdmin->execute([$userId]);
                     if ($checkAdmin->fetchColumn() === 'Admin') {
                         jsonError('Cannot change status: You are the last active Admin.', 400);
                     }
                }
            }

            $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
            if ($stmt->execute([$status, $userId])) {
                jsonResponse(['success' => true]);
            }
        }
        jsonError('Invalid request', 400);
    }

    if ($action === 'update_role') {
        $userId = $data['user_id'] ?? null;
        $roleId = $data['role_id'] ?? null; // allow null or empty for no role
        if ($roleId === '') $roleId = null;

        if ($userId) {
            // Cannot change role of the last admin user
            $checkAdminRole = $pdo->prepare("SELECT id FROM roles WHERE name = 'Admin'");
            $checkAdminRole->execute();
            $adminRoleId = $checkAdminRole->fetchColumn();

            if ($roleId != $adminRoleId) {
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Admin' AND u.status = 'active' AND u.id != ?");
                $stmt->execute([$userId]);
                if ($stmt->fetchColumn() == 0) {
                     $checkAdmin = $pdo->prepare("SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?");
                     $checkAdmin->execute([$userId]);
                     if ($checkAdmin->fetchColumn() === 'Admin') {
                         jsonError('Cannot change role: You are the last active Admin.', 400);
                     }
                }
            }

            $stmt = $pdo->prepare("UPDATE users SET role_id = ? WHERE id = ?");
            if ($stmt->execute([$roleId, $userId])) {
                jsonResponse(['success' => true]);
            }
        }
        jsonError('Invalid request', 400);
    }

    if ($action === 'delete_user') {
        $userId = $data['user_id'] ?? null;
        if ($userId) {
            // Prevent deleting last admin
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Admin' AND u.status = 'active' AND u.id != ?");
            $stmt->execute([$userId]);
            if ($stmt->fetchColumn() == 0) {
                 $checkAdmin = $pdo->prepare("SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?");
                 $checkAdmin->execute([$userId]);
                 if ($checkAdmin->fetchColumn() === 'Admin') {
                     jsonError('Cannot delete: You are the last active Admin.', 400);
                 }
            }

            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            if ($stmt->execute([$userId])) {
                jsonResponse(['success' => true]);
            }
        }
        jsonError('Invalid request', 400);
    }
}

jsonError('Invalid action', 400);
?>
