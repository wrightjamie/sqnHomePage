/**
 * users_admin.js
 *
 * Frontend logic for the User Management tab in the admin panel.
 * Handles loading users, populating the users table, and managing the Add/Edit/Delete user workflows.
 * Communicates with the `api/users.php` endpoint.
 * Requires Admin role access to function.
 */
document.addEventListener('DOMContentLoaded', () => {
    const tabUsersBtn = document.getElementById('tab-users-btn');
    const usersList = document.getElementById('users-list');

    // Add User
    const btnAddUser = document.getElementById('btn-add-user');

    // Edit Modal
    const userModal = document.getElementById('user-edit-modal');
    const userForm = document.getElementById('user-edit-form');
    const btnCancelUser = document.getElementById('btn-cancel-user');

    // Fields
    const editId = document.getElementById('edit-user-id');
    const editName = document.getElementById('edit-user-name');
    const editPass = document.getElementById('edit-user-pass');
    const editRole = document.getElementById('edit-user-role');
    const editStatus = document.getElementById('edit-user-status');
    const title = document.getElementById('user-modal-title');

    let cachedRoles = [];

    if (!tabUsersBtn || !usersList) return;

    // Load users only when the tab is clicked to save initial load time
    tabUsersBtn.addEventListener('click', () => {
        loadUsers();
    });

    async function loadRoles() {
        if (cachedRoles.length > 0) return;
        try {
            cachedRoles = await apiFetch('api/users.php?action=roles');
            editRole.innerHTML = cachedRoles.map(r => `<option value="${r}">${r}</option>`).join('');
            editRole.innerHTML += '<option value="Viewer">Viewer (No Access)</option>';
        } catch (e) {
            console.error("Failed to load roles");
        }
    }

    async function loadUsers() {
        try {
            await loadRoles();
            const users = await apiFetch('api/users.php?action=list');
            usersList.innerHTML = users.map(u => `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">${u.username}</td>
                    <td style="padding: 10px;"><span style="background: var(--raf-nav-1); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${u.role}</span></td>
                    <td style="padding: 10px;">
                        <span style="color: ${u.status === 'active' ? 'green' : u.status === 'pending' ? 'orange' : 'red'}; font-weight: bold;">
                            ${u.status.toUpperCase()}
                        </span>
                    </td>
                    <td style="padding: 10px; text-align: right;">
                        <button class="btn btn-secondary" onclick="editUser(${u.id}, '${u.username}', '${u.role}', '${u.status}')">Edit</button>
                        <button class="btn" style="background: var(--raf-logo-1); color: white;" onclick="deleteUser(${u.id}, '${u.username}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            // Handled by Toast
            usersList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 10px; color: red;">Failed to load users. You may not be an Admin.</td></tr>';
        }
    }

    // Modal Handlers
    btnAddUser.addEventListener('click', async () => {
        await loadRoles();
        userForm.reset();
        editId.value = '';
        editName.disabled = false;
        editPass.required = true;
        title.textContent = 'Add New User';
        userModal.classList.remove('hidden');
    });

    btnCancelUser.addEventListener('click', () => {
        userModal.classList.add('hidden');
    });

    window.editUser = async (id, name, role, status) => {
        await loadRoles();
        userForm.reset();
        editId.value = id;
        editName.value = name;
        editName.disabled = true; // Don't allow changing username
        editPass.required = false; // Optional on edit
        editRole.value = role;
        editStatus.value = status;
        title.textContent = `Edit User: ${name}`;
        userModal.classList.remove('hidden');
    };

    window.deleteUser = async (id, name) => {
        if (!confirm(`Are you sure you want to delete user '${name}'? This cannot be undone.`)) return;
        try {
            await apiFetch('api/users.php?action=delete', 'POST', { id });
            Toast.show('User deleted successfully', 'success');
            loadUsers();
        } catch (e) {}
    };

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editId.value;
        const name = editName.value;
        const pass = editPass.value;
        const role = editRole.value;
        const status = editStatus.value;

        try {
            if (id) {
                // Update
                await apiFetch('api/users.php?action=update', 'POST', { id, role, status });
                if (pass) {
                    await apiFetch('api/users.php?action=reset_password', 'POST', { id, password: pass });
                }
                Toast.show('User updated successfully', 'success');
            } else {
                // Create
                await apiFetch('api/users.php?action=create', 'POST', { username: name, password: pass, role, status });
                Toast.show('User created successfully', 'success');
            }
            userModal.classList.add('hidden');
            loadUsers();
        } catch (e) {}
    });
});
