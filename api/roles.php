<?php
// api/roles.php
require_once 'config.php';
require_once 'utils.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

/**
 * Built-in system roles that cannot be renamed or deleted because core
 * authentication and authorization logic references them by name.
 */
const PROTECTED_SYSTEM_ROLES = ['Admin', 'Guest'];

/**
 * Default permission names granted to newly created roles when no explicit
 * permission IDs are supplied.
 */
const DEFAULT_ROLE_VIEW_PERMISSIONS = [
    'view_home',
    'view_displayboard',
    'view_programme',
    'view_documents'
];

if ($method === 'GET' && $action === 'basic_list') {
    // Basic list doesn't require manage_roles permission
    $roles = $pdo->query("SELECT id, name FROM roles WHERE name != 'Guest' ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(['roles' => $roles]);
}

// Ensure user has manage_roles permission for full list and mutations
requirePermission($pdo, 'manage_roles');

if ($method === 'GET' && $action === 'list') {
    $roles = $pdo->query("
        SELECT r.id, r.name, COUNT(u.id) AS user_count
        FROM roles r
        LEFT JOIN users u ON u.role_id = r.id
        GROUP BY r.id, r.name
        ORDER BY r.id ASC
    ")->fetchAll(PDO::FETCH_ASSOC);

    foreach ($roles as &$role) {
        $role['id'] = (int)$role['id'];
        $role['user_count'] = (int)$role['user_count'];
        $role['is_protected'] = in_array($role['name'], PROTECTED_SYSTEM_ROLES, true);
    }
    unset($role);

    $permissions = $pdo->query("SELECT id, name FROM permissions ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($permissions as &$perm) {
        $perm['id'] = (int)$perm['id'];
    }
    unset($perm);

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

if ($method === 'POST' && $action === 'create') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $name = trim((string)($data['name'] ?? ''));
    $hasExplicitPermissions = array_key_exists('permission_ids', $data) && is_array($data['permission_ids']);
    $permIds = $hasExplicitPermissions ? array_values(array_unique(array_map('intval', $data['permission_ids']))) : null;

    if ($name === '') {
        jsonError('Role name is required.', 400);
    }

    $dupStmt = $pdo->prepare("SELECT COUNT(*) FROM roles WHERE LOWER(name) = LOWER(?)");
    $dupStmt->execute([$name]);
    if ((int)$dupStmt->fetchColumn() > 0) {
        jsonError('A role with that name already exists.', 400);
    }

    try {
        $pdo->beginTransaction();

        $insertStmt = $pdo->prepare("INSERT INTO roles (name) VALUES (?)");
        $insertStmt->execute([$name]);
        $newRoleId = (int)$pdo->lastInsertId();

        if ($permIds === null) {
            $placeholders = implode(',', array_fill(0, count(DEFAULT_ROLE_VIEW_PERMISSIONS), '?'));
            $defaultPermStmt = $pdo->prepare("SELECT id FROM permissions WHERE name IN ($placeholders)");
            $defaultPermStmt->execute(DEFAULT_ROLE_VIEW_PERMISSIONS);
            $permIds = array_map('intval', $defaultPermStmt->fetchAll(PDO::FETCH_COLUMN));
        }

        if (!empty($permIds)) {
            $rpInsert = $pdo->prepare("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
            foreach ($permIds as $pid) {
                if ($pid > 0) {
                    $rpInsert->execute([$newRoleId, $pid]);
                }
            }
        }

        $pdo->commit();
        jsonResponse([
            'id' => $newRoleId,
            'name' => $name,
            'permission_ids' => $permIds,
            'is_protected' => false,
            'user_count' => 0
        ]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonError('Database error: ' . $e->getMessage(), 500);
    }
}

if ($method === 'POST' && $action === 'rename') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $roleId = isset($data['role_id']) ? (int)$data['role_id'] : 0;
    $newName = trim((string)($data['name'] ?? ''));

    if ($roleId <= 0 || $newName === '') {
        jsonError('Role ID and new role name are required.', 400);
    }

    $stmt = $pdo->prepare("SELECT id, name FROM roles WHERE id = ?");
    $stmt->execute([$roleId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        jsonError('Role not found.', 404);
    }

    if (in_array($existing['name'], PROTECTED_SYSTEM_ROLES, true)) {
        jsonError('System roles (Admin and Guest) cannot be renamed.', 400);
    }

    $dupStmt = $pdo->prepare("SELECT COUNT(*) FROM roles WHERE LOWER(name) = LOWER(?) AND id != ?");
    $dupStmt->execute([$newName, $roleId]);
    if ((int)$dupStmt->fetchColumn() > 0) {
        jsonError('A role with that name already exists.', 400);
    }

    try {
        $updStmt = $pdo->prepare("UPDATE roles SET name = ? WHERE id = ?");
        $updStmt->execute([$newName, $roleId]);
        jsonResponse([
            'id' => $roleId,
            'name' => $newName
        ]);
    } catch (PDOException $e) {
        jsonError('Database error: ' . $e->getMessage(), 500);
    }
}

if ($method === 'POST' && $action === 'delete') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $roleId = isset($data['role_id']) ? (int)$data['role_id'] : 0;

    if ($roleId <= 0) {
        jsonError('Valid role ID is required.', 400);
    }

    $stmt = $pdo->prepare("SELECT id, name FROM roles WHERE id = ?");
    $stmt->execute([$roleId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        jsonError('Role not found.', 404);
    }

    if (in_array($existing['name'], PROTECTED_SYSTEM_ROLES, true)) {
        jsonError('System roles (Admin and Guest) cannot be deleted.', 400);
    }

    try {
        $pdo->beginTransaction();

        $userCountStmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE role_id = ?");
        $userCountStmt->execute([$roleId]);
        $unassignedUsers = (int)$userCountStmt->fetchColumn();

        $pdo->prepare("UPDATE users SET role_id = NULL WHERE role_id = ?")->execute([$roleId]);
        $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ?")->execute([$roleId]);
        $pdo->prepare("DELETE FROM roles WHERE id = ?")->execute([$roleId]);

        $pdo->commit();
        jsonResponse([
            'id' => $roleId,
            'deleted_name' => $existing['name'],
            'unassigned_users' => $unassignedUsers
        ]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonError('Database error: ' . $e->getMessage(), 500);
    }
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
