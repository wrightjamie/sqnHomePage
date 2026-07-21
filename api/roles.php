<?php
// api/roles.php
require_once 'config.php';
require_once 'utils.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && $action === 'basic_list') {
    // Basic list doesn't require manage_roles permission
    $roles = $pdo->query("SELECT id, name FROM roles WHERE name != 'Guest' ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(['roles' => $roles]);
}

// Ensure user has manage_roles permission for full list and update
requirePermission($pdo, 'manage_roles');

if ($method === 'GET' && $action === 'list') {
    $roles = $pdo->query("SELECT id, name FROM roles ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
    $permissions = $pdo->query("SELECT id, name FROM permissions ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
    
    // Group permissions by role_id
    $rolePermissions = [];
    $rpStmt = $pdo->query("SELECT role_id, permission_id FROM role_permissions");
    while ($row = $rpStmt->fetch(PDO::FETCH_ASSOC)) {
        $rolePermissions[$row['role_id']][] = (int)$row['permission_id'];
    }

    jsonResponse([
        'roles' => $roles,
        'permissions' => $permissions,
        'role_permissions' => $rolePermissions
    ]);
}

if ($method === 'POST' && $action === 'update') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $roleId = $data['role_id'] ?? null;
    $permIds = $data['permission_ids'] ?? [];
    
    if ($roleId) {
        // Safety check: Do not allow removing manage_roles from Admin role to prevent lockout
        $stmt = $pdo->prepare("SELECT name FROM roles WHERE id = ?");
        $stmt->execute([$roleId]);
        if ($stmt->fetchColumn() === 'Admin') {
            $stmt = $pdo->prepare("SELECT id FROM permissions WHERE name = 'manage_roles'");
            $stmt->execute();
            $manageRolesId = $stmt->fetchColumn();
            if ($manageRolesId && !in_array($manageRolesId, $permIds)) {
                $permIds[] = $manageRolesId; // Force it back in
            }
        }

        try {
            $pdo->beginTransaction();
            
            // Delete existing mappings
            $stmt = $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ?");
            $stmt->execute([$roleId]);
            
            // Insert new mappings
            if (!empty($permIds)) {
                $stmt = $pdo->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
                foreach($permIds as $pid) {
                    $stmt->execute([$roleId, $pid]);
                }
            }
            
            $pdo->commit();
            jsonResponse(['success' => true]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            jsonError('Database error: ' . $e->getMessage());
        }
    }
    jsonError('Invalid request data');
}

jsonError('Invalid action', 400);
