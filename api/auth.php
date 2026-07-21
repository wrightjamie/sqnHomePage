<?php
// api/auth.php
require_once 'config.php';
require_once 'utils.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'login') {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password_hash'])) {
            if ($user['status'] === 'pending') {
                jsonError('Account is pending approval by an administrator.', 403);
            } elseif ($user['status'] !== 'active') {
                jsonError('Account is disabled.', 403);
            }
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['display_name'] = $user['display_name'];
            jsonResponse(['message' => 'Logged in']);
        } else {
            jsonError('Invalid credentials', 401);
        }
    }
    
    if ($action === 'register') {
        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? '';
        $display_name = trim($data['display_name'] ?? '');

        if (empty($username) || empty($password) || empty($display_name)) {
            jsonError('All fields are required', 400);
        }

        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            jsonError('Username already taken', 400);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, display_name, status, role_id) VALUES (?, ?, ?, 'pending', NULL)");
        if ($stmt->execute([$username, $hash, $display_name])) {
            jsonResponse(['message' => 'Registration successful, awaiting approval']);
        } else {
            jsonError('Registration failed', 500);
        }
    }

    if ($action === 'change_password') {
        if (!isset($_SESSION['user_id'])) {
            jsonError('Unauthorized', 401);
        }
        $old_password = $data['old_password'] ?? '';
        $new_password = $data['new_password'] ?? '';
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($old_password, $user['password_hash'])) {
            $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
            $updateStmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $updateStmt->execute([$new_hash, $_SESSION['user_id']]);
            jsonResponse(['success' => true]);
        } else {
            jsonResponse(['success' => false, 'error' => 'Incorrect current password']);
        }
    }
}

if ($action === 'logout') {
    session_destroy();
    jsonResponse(['message' => 'Logged out']);
}

if ($action === 'status') {
    $loggedIn = isset($_SESSION['user_id']);
    $role = null;
    $permissions = [];
    $displayName = null;

    if ($loggedIn) {
        $stmt = $pdo->prepare("
            SELECT u.display_name, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        ");
        $stmt->execute([$_SESSION['user_id']]);
        if ($user = $stmt->fetch()) {
            $role = $user['role_name'];
            $displayName = $user['display_name'];

            $permStmt = $pdo->prepare("
                SELECT p.name
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN users u ON u.role_id = rp.role_id
                WHERE u.id = ?
            ");
            $permStmt->execute([$_SESSION['user_id']]);
            $permissions = $permStmt->fetchAll(PDO::FETCH_COLUMN);
        } else {
            // User not found in db anymore
            session_destroy();
            $loggedIn = false;
        }
    }

    jsonResponse([
        'logged_in' => $loggedIn,
        'username' => $loggedIn ? $_SESSION['username'] : null,
        'display_name' => $displayName,
        'role' => $role,
        'permissions' => $permissions
    ]);
}

jsonError('Invalid action', 400);
?>
