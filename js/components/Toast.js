// js/components/Toast.js

export const Toast = {
    container: null,
    timeoutId: null,

    init() {
        if (!document.getElementById('global-toast-container')) {
            const div = document.createElement('div');
            div.id = 'global-toast-container';
            div.innerHTML = `
                <span class="material-symbols-outlined" id="global-toast-icon">info</span>
                <span id="global-toast-message"></span>
            `;
            document.body.appendChild(div);
        }
        this.container = document.getElementById('global-toast-container');
    },

    show(msg, type = 'info', icon = null) {
        if (!this.container) this.init();

        const msgEl = document.getElementById('global-toast-message');
        const iconEl = document.getElementById('global-toast-icon');

        msgEl.textContent = msg;

        // Determine default icon based on type if not provided
        if (!icon) {
            if (type === 'success') icon = 'check_circle';
            else if (type === 'error') icon = 'error';
            else icon = 'info';
        }

        iconEl.textContent = icon;

        if (icon === 'sync') {
            iconEl.style.animation = 'spin 1s linear infinite';
        } else {
            iconEl.style.animation = '';
        }

        this.container.className = `show ${type}`;

        if (this.timeoutId) clearTimeout(this.timeoutId);

        // Auto dismiss after 3 seconds, except if it's a syncing indicator
        if (icon !== 'sync') {
            this.timeoutId = setTimeout(() => this.hide(), 3000);
        }
    },

    hide() {
        if (this.container) {
            this.container.classList.remove('show');
        }
    }
};

// Initialize Toast on load
document.addEventListener('DOMContentLoaded', () => Toast.init());
