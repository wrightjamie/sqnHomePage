<?php
require_once 'api/config.php';
require_once 'api/utils.php';

$redirect = $_GET['redirect'] ?? 'index.php';

// If they are already logged in, just send them to the redirect destination
if ($isLoggedIn) {
    header("Location: $redirect");
    die();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Squadron Portal</title>
    <link rel="icon" href="uploads/roundel.svg" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/components.css">
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: var(--color-bg);
            margin: 0;
            flex-direction: column;
        }
        .login-box {
            background: white;
            padding: var(--space-xl);
            border-radius: var(--space-sm);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }
        .login-box h2 {
            margin-top: 0;
            margin-bottom: var(--space-md);
            text-align: center;
            color: var(--raf-deep-blue);
        }
        .login-logo {
            text-align: center;
            margin-bottom: var(--space-lg);
        }
        .login-logo img {
            max-height: 80px;
        }
    </style>
</head>
<body>

    <div class="login-logo">
        <img src="images/rafac-logo-dark.svg" alt="RAFAC">
    </div>

    <div class="login-box">
        <h2>Login Required</h2>
        <p class="text-center mb-md text-sm text-muted">You must log in to view this page.</p>
        <form id="standalone-login-form" class="flex-col w-100">
            <input type="text" id="login-user" placeholder="Username" class="p-sm mb-sm w-100" required>
            <input type="password" id="login-pass" placeholder="Password" class="p-sm mb-sm w-100" required>
            <div class="flex-col gap-sm mt-md">
                <button type="submit" id="btn-do-login" class="btn-primary w-100">Login</button>
                <a href="index.php" class="btn btn-secondary w-100 text-center" style="text-decoration: none; box-sizing: border-box;">Go to Home</a>
            </div>
        </form>
        <div class="mt-md text-center">
            <a href="register.php" style="color: var(--raf-nav-2); text-decoration: none; font-size: 0.9rem;">Create an account</a>
        </div>
        <p id="login-error" class="text-error mt-sm text-center"></p>
    </div>

    <script src="js/utils.js"></script>
    <script src="js/api.js"></script>
    <script>
        // Ensure redirect is safe (relative path only, no absolute URLs or javascript schema)
        let rawRedirect = <?= json_encode($redirect) ?>;
        let redirectUrl = 'index.php'; // Default safe fallback

        try {
            // Check if it's a valid relative path by ensuring it can't be parsed as a full URL
            if (!rawRedirect.startsWith('http') && !rawRedirect.startsWith('//') && !rawRedirect.startsWith('javascript:')) {
                // Remove leading slashes just to be absolutely sure it doesn't jump to root inappropriately if nested
                redirectUrl = rawRedirect.replace(/^\/+/, '');
                if (!redirectUrl) redirectUrl = 'index.php';
            }
        } catch(e) {
            console.error('Invalid redirect URL', e);
        }

        document.getElementById('standalone-login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('login-user').value;
            const p = document.getElementById('login-pass').value;
            const errorMsg = document.getElementById('login-error');

            try {
                errorMsg.textContent = 'Logging in...';
                await apiFetch('api/auth.php?action=login', 'POST', { username: u, password: p });
                window.location.href = redirectUrl;
            } catch (err) {
                errorMsg.textContent = err.message;
            }
        });
    </script>
</body>
</html>
