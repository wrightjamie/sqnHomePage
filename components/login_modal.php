<div id="login-modal" class="modal hidden">
    <div class="modal-content modal-sm flex-col">
        <h2>Login</h2>
        <form id="frontend-login-form" class="flex-col w-100">
            <input type="text" id="login-user" placeholder="Username" class="p-sm mb-sm w-100" required>
            <input type="password" id="login-pass" placeholder="Password" class="p-sm mb-sm w-100" required>
            <div class="flex-row gap-sm mt-md">
                <button type="submit" id="btn-do-login" class="btn-primary">Login</button>
                <button type="button" id="btn-cancel-login" class="btn-secondary">Cancel</button>
            </div>
        </form>
        <p id="login-error" class="text-error mt-sm"></p>
    </div>
</div>
