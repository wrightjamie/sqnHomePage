/**
 * Global Authentication Manager
 * Handles login modal UI, login requests, and logout requests.
 */
const Auth = {
    modal: null,
    form: null,
    errorMsg: null,

    init() {
        this.modal = document.getElementById('login-modal');
        this.form = document.getElementById('frontend-login-form');
        this.errorMsg = document.getElementById('login-error');

        // Setup UI bindings if the modal exists on this page
        if (this.modal && this.form) {
            this.form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const u = document.getElementById('login-user').value;
                const p = document.getElementById('login-pass').value;
                
                try {
                    await this.login(u, p);
                    this.hideModal();
                    window.location.reload();
                } catch (err) {
                    this.errorMsg.textContent = err.message;
                }
            });

            const btnCancel = document.getElementById('btn-cancel-login');
            if (btnCancel) {
                btnCancel.addEventListener('click', () => this.hideModal());
            }
        }

        // Global menu bindings
        const btnLoginTrigger = document.getElementById('btn-login-trigger');
        if (btnLoginTrigger) {
            btnLoginTrigger.addEventListener('click', () => this.showModal());
        }

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this.logout());
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
        return await apiFetch('api/auth.php?action=login', 'POST', { username, password });
    },

    async logout() {
        const result = await apiFetch('api/auth.php?action=logout');
        window.location.reload();
        return result;
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => Auth.init());
