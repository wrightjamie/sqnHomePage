<?php
require_once 'api/config.php';
if ($isLoggedIn) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Sqn Display Board</title>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="icon" href="uploads/roundel.svg" type="image/svg+xml">
    <style>
        .register-container {
            max-width: 400px;
            margin: var(--space-xl) auto;
            padding: var(--space-lg);
            background: var(--color-bg);
            border-radius: var(--space-sm);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 { margin-bottom: var(--space-md); text-align: center; }
    </style>
</head>
<body>
    <div class="register-container flex-col">
        <h1>Create an Account</h1>
        <p class="mb-md text-center">Your account will require administrator approval before you can log in.</p>

        <form id="register-form" class="flex-col gap-md">
            <input type="text" id="reg-display-name" placeholder="Display Name (e.g. Cdt Smith)" class="form-control" required>
            <input type="text" id="reg-username" placeholder="Username" class="form-control" required>
            <input type="password" id="reg-password" placeholder="Password" class="form-control" required>

            <button type="submit" class="btn-primary w-100">Register</button>
            <a href="index.php" class="btn btn-secondary w-100 text-center d-block border-box" >Cancel</a>
        </form>
    </div>

    <script src="js/utils.js?v=<?= time() ?>"></script>
    <script src="js/api.js?v=<?= time() ?>"></script>
    <script>
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const displayName = document.getElementById('reg-display-name').value;
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;

            try {
                const res = await apiFetch('api/auth.php?action=register', 'POST', {
                    display_name: displayName,
                    username,
                    password
                });

                Toast.show('Registration successful! Please wait for admin approval.', 'success');
                setTimeout(() => {
                    window.location.href = 'index.php';
                }, 3000);
            } catch (err) {
                // Toast is automatically shown by apiFetch on error
            }
        });
    </script>
</body>
</html>