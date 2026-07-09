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
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            jsonResponse(['message' => 'Logged in']);
        } else {
            jsonError('Invalid credentials', 401);
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
    jsonResponse(['logged_in' => $loggedIn, 'username' => $loggedIn ? $_SESSION['username'] : null]);
}

jsonError('Invalid action', 400);
?>
