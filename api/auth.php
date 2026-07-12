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
            if ($user['status'] !== 'active') {
                jsonError('Account is not active. Status: ' . $user['status'], 403);
            }
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            jsonResponse(['message' => 'Logged in']);
        } else {
            jsonError('Invalid credentials', 401);
        }
    }

    if ($action === 'register') {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        if (strlen($username) < 3 || strlen($password) < 5) {
            jsonError('Username >3 chars, Password >5 chars required', 400);
        }

        // Check if user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetchColumn()) {
            jsonError('Username already exists', 400);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, 'Viewer', 'pending')");
        if ($stmt->execute([$username, $hash])) {
            jsonResponse(['message' => 'Registration successful, awaiting admin approval.']);
        } else {
            jsonError('Failed to register', 500);
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
