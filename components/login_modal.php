<div id="login-modal" class="modal hidden">
    <div class="modal-content modal-sm flex-col">
        <div class="flex-row justify-between align-center mb-md">
            <h2 id="auth-modal-title" class="m-0">Login</h2>
            <button id="btn-switch-auth-mode" class="btn btn-muted">Register instead</button>
        </div>

        <form id="frontend-login-form" class="flex-col w-100">
            <input type="text" id="login-user" placeholder="Username" class="p-sm mb-sm w-100" required>
            <input type="password" id="login-pass" placeholder="Password" class="p-sm mb-sm w-100" required>
            <div class="flex-row gap-sm mt-md">
                <button type="submit" id="btn-do-login" class="btn-primary">Login</button>
                <button type="button" id="btn-cancel-login" class="btn-secondary">Cancel</button>
            </div>
        </form>

        <form id="frontend-register-form" class="flex-col w-100 hidden">
            <input type="text" id="register-user" placeholder="Choose Username" class="p-sm mb-sm w-100" required>
            <input type="password" id="register-pass" placeholder="Create Password" class="p-sm mb-sm w-100" required>
            <input type="password" id="register-pass-confirm" placeholder="Confirm Password" class="p-sm mb-sm w-100" required>
            <div class="flex-row gap-sm mt-md">
                <button type="submit" id="btn-do-register" class="btn-primary">Register</button>
                <button type="button" id="btn-cancel-register" class="btn-secondary">Cancel</button>
            </div>
        </form>

        <p id="login-error" class="text-error mt-sm"></p>
    </div>
</div>
