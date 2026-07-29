import { apiFetch } from "./api.js";
import { Auth } from "./auth.js";
import { Toast } from "./components/Toast.js";

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    let authStatus = null;
    try {
        const response = await apiFetch('api/auth.php?action=status');
        authStatus = response || null;
    } catch (e) {
        console.error('Failed to get auth status:', e);
    }
    
    if (!authStatus || !authStatus.logged_in) {
        window.location.href = 'index.php?page=login';
        return;
    }

    // Pre-fill display name
    document.getElementById('profile-display-name').value = authStatus.display_name || authStatus.username || '';

    // Tabs logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(targetId) {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));

        const btn = document.querySelector(`.tab-btn[data-target="${targetId}"]`);
        const content = document.getElementById(targetId);

        if (btn && content) {
            btn.classList.add('active');
            content.classList.remove('hidden');
        }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.target);
        });
    });

    // Handle change display name
    document.getElementById('btn-save-display-name')?.addEventListener('click', async () => {
        const displayName = document.getElementById('profile-display-name').value;
        const msg = document.getElementById('display-name-msg');

        if (!displayName) {
            msg.textContent = 'Display name cannot be empty.';
            msg.style.color = 'red';
            return;
        }

        const btn = document.getElementById('btn-save-display-name');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined loading-spinner">autorenew</span> Updating...';
        btn.disabled = true;

        try {
            const result = await apiFetch('api/auth.php?action=update_profile', 'POST', { display_name: displayName });
            if (result && result.success) {
                msg.textContent = 'Profile updated successfully.';
                msg.style.color = 'green';
                new Toast('Profile updated successfully!', 'success');
            } else {
                msg.textContent = result?.error || 'Failed to update profile.';
                msg.style.color = 'red';
            }
        } catch (e) {
            msg.textContent = 'An error occurred.';
            msg.style.color = 'red';
        }

        btn.innerHTML = originalText;
        btn.disabled = false;
    });

    // Handle change password
    document.getElementById('btn-change-password')?.addEventListener('click', async () => {
        const current = document.getElementById('pwd-current').value;
        const newPwd = document.getElementById('pwd-new').value;
        const confirmPwd = document.getElementById('pwd-confirm').value;
        const msg = document.getElementById('pwd-msg');

        if (!current || !newPwd || !confirmPwd) {
            msg.textContent = 'All fields are required.';
            msg.style.color = 'red';
            return;
        }

        if (newPwd !== confirmPwd) {
            msg.textContent = 'New passwords do not match.';
            msg.style.color = 'red';
            return;
        }

        const btn = document.getElementById('btn-change-password');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined loading-spinner">autorenew</span> Updating...';
        btn.disabled = true;

        try {
            const result = await apiFetch('api/auth.php?action=change_password', 'POST', { old_password: current, new_password: newPwd });
            if (result && result.success) {
                msg.textContent = 'Password changed successfully.';
                msg.style.color = 'green';
                document.getElementById('pwd-current').value = '';
                document.getElementById('pwd-new').value = '';
                document.getElementById('pwd-confirm').value = '';
                new Toast('Password changed successfully!', 'success');
            } else {
                msg.textContent = result?.error || 'Failed to change password.';
                msg.style.color = 'red';
            }
        } catch (e) {
            msg.textContent = 'An error occurred.';
            msg.style.color = 'red';
        }

        btn.innerHTML = originalText;
        btn.disabled = false;
    });
});
