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
