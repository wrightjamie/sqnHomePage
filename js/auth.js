/**
 * auth.js
 *
 * Global Authentication Manager
 * Handles login and registration modal UI, making login/registration/logout requests
 * to `api/auth.php`, and tracking the current authentication state.
 */
const Auth = {
    modal: null,
    form: null,
    errorMsg: null,
    callbacks: {
        onLogin: [],
        onLogout: []
    },

    init() {
        this.modal = document.getElementById('login-modal');
        this.form = document.getElementById('frontend-login-form');
        this.regForm = document.getElementById('frontend-register-form');
        this.errorMsg = document.getElementById('login-error');
        this.isRegisterMode = false;

        // Setup UI bindings if the modal exists on this page
        if (this.modal) {
            const btnSwitch = document.getElementById('btn-switch-auth-mode');
            const title = document.getElementById('auth-modal-title');

            if (btnSwitch) {
                btnSwitch.addEventListener('click', () => {
                    this.isRegisterMode = !this.isRegisterMode;
                    this.errorMsg.textContent = '';
                    if (this.isRegisterMode) {
                        this.form.classList.add('hidden');
                        this.regForm.classList.remove('hidden');
                        title.textContent = 'Register';
                        btnSwitch.textContent = 'Login instead';
                    } else {
                        this.regForm.classList.add('hidden');
                        this.form.classList.remove('hidden');
                        title.textContent = 'Login';
                        btnSwitch.textContent = 'Register instead';
                    }
                });
            }

            if (this.form) {
                this.form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const u = document.getElementById('login-user').value;
                const p = document.getElementById('login-pass').value;
                
                try {
                    await this.login(u, p);
                    this.hideModal();
                    // trigger callbacks
                    this.callbacks.onLogin.forEach(cb => cb());
                } catch (err) {
                    this.errorMsg.textContent = err.message;
                }
            });

            }

            if (this.regForm) {
                this.regForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const u = document.getElementById('register-user').value;
                    const p1 = document.getElementById('register-pass').value;
                    const p2 = document.getElementById('register-pass-confirm').value;

                    if (p1 !== p2) {
                        this.errorMsg.textContent = 'Passwords do not match.';
                        return;
                    }

                    try {
                        const result = await this.register(u, p1);
                        Toast.show(result.message || 'Registration submitted and pending approval.', 'success');
                        this.hideModal();
                    } catch (err) {
                        this.errorMsg.textContent = err.message;
                    }
                });
            }

            const btnCancel = document.getElementById('btn-cancel-login');
            if (btnCancel) {
                btnCancel.addEventListener('click', () => this.hideModal());
            }
            const btnCancelReg = document.getElementById('btn-cancel-register');
            if (btnCancelReg) {
                btnCancelReg.addEventListener('click', () => this.hideModal());
            }
        }
    },

    showModal() {
        if (!this.modal) return;
        this.modal.classList.remove('hidden');
        if (this.errorMsg) this.errorMsg.textContent = '';
        const userField = document.getElementById('login-user');
        if (userField) userField.focus();
    },

    hideModal() {
        if (!this.modal) return;
        this.modal.classList.add('hidden');
        if (this.form) this.form.reset();
    },

    async checkStatus() {
        return await apiFetch('api/auth.php?action=status');
    },

    async login(username, password) {
        const res = await apiFetch('api/auth.php?action=login', 'POST', { username, password });
        if (typeof Toast !== 'undefined') Toast.show('Logged in successfully', 'success');
        return res;
    },

    async register(username, password) {
        return await apiFetch('api/auth.php?action=register', 'POST', { username, password });
    },

    async logout() {
        const result = await apiFetch('api/auth.php?action=logout');
        this.callbacks.onLogout.forEach(cb => cb());
        return result;
    },

    onLogin(cb) {
        this.callbacks.onLogin.push(cb);
    },

    onLogout(cb) {
        this.callbacks.onLogout.push(cb);
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => Auth.init());
