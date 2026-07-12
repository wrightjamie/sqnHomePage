<?php
// api/users.php
require_once 'config.php';
require_once 'utils.php';

// Authorization check: Only Admin users can manage users
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || strtolower($_SESSION['role']) !== 'admin') {
    jsonError('Unauthorized: Admin access required', 403);
}

// Additional check: Make sure user is active
$stmt = $pdo->prepare("SELECT status FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$userStatus = $stmt->fetchColumn();
if ($userStatus !== 'active') {
    jsonError('Unauthorized: Account is not active', 403);
}

$action = $_GET['action'] ?? '';

// GET routes
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->query("SELECT id, username, role, status FROM users ORDER BY username ASC");
        jsonResponse($stmt->fetchAll());
    }

    if ($action === 'roles') {
        $stmt = $pdo->query("SELECT name FROM user_roles ORDER BY name ASC");
        $roles = $stmt->fetchAll(PDO::FETCH_COLUMN);
        jsonResponse($roles);
    }
}

// POST routes
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'create') {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        $role = $data['role'] ?? 'Viewer';
        $status = $data['status'] ?? 'active';

        if (strlen($username) < 3 || strlen($password) < 5) {
            jsonError('Username >3 chars, Password >5 chars required', 400);
        }

        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetchColumn()) {
            jsonError('Username already exists', 400);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, ?)");
        if ($stmt->execute([$username, $hash, $role, $status])) {
            jsonResponse(['message' => 'User created successfully']);
        } else {
            jsonError('Failed to create user', 500);
        }
    }

    if ($action === 'update') {
        $id = $data['id'] ?? null;
        $role = $data['role'] ?? null;
        $status = $data['status'] ?? null;

        if (!$id) jsonError('Missing user ID', 400);

        // Prevent disabling or changing role of the last admin
        if ($status !== 'active' || strtolower($role) !== 'admin') {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE LOWER(role) = 'admin' AND status = 'active' AND id != ?");
            $stmt->execute([$id]);
            if ($stmt->fetchColumn() == 0) {
                // Ensure the user we are updating is actually an admin before blocking
                $stmt = $pdo->prepare("SELECT role, status FROM users WHERE id = ?");
                $stmt->execute([$id]);
                $currentUser = $stmt->fetch();
                if ($currentUser && strtolower($currentUser['role']) === 'admin' && $currentUser['status'] === 'active') {
                    jsonError('Cannot modify the last active admin account', 400);
                }
            }
        }

        $stmt = $pdo->prepare("UPDATE users SET role = ?, status = ? WHERE id = ?");
        if ($stmt->execute([$role, $status, $id])) {
            jsonResponse(['message' => 'User updated successfully']);
        } else {
            jsonError('Failed to update user', 500);
        }
    }

    if ($action === 'reset_password') {
        $id = $data['id'] ?? null;
        $password = $data['password'] ?? '';

        if (!$id) jsonError('Missing user ID', 400);
        if (strlen($password) < 5) jsonError('Password must be at least 5 characters', 400);

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        if ($stmt->execute([$hash, $id])) {
            jsonResponse(['message' => 'Password reset successfully']);
        } else {
            jsonError('Failed to reset password', 500);
        }
    }

    if ($action === 'delete') {
        $id = $data['id'] ?? null;
        if (!$id) jsonError('Missing user ID', 400);

        // Prevent deleting the last admin
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE LOWER(role) = 'admin' AND id != ?");
        $stmt->execute([$id]);
        if ($stmt->fetchColumn() == 0) {
            $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $currentUser = $stmt->fetch();
            if ($currentUser && strtolower($currentUser['role']) === 'admin') {
                jsonError('Cannot delete the last admin account', 400);
            }
        }

        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        if ($stmt->execute([$id])) {
            jsonResponse(['message' => 'User deleted successfully']);
        } else {
            jsonError('Failed to delete user', 500);
        }
    }
}

jsonError('Invalid action', 400);
?>
