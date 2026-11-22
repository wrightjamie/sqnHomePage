// js/utils/programme-settings-editor.js
import { Toast } from '../components/Toast.js';

export const DEFAULT_STAFF_RANKS = [
    'Wg Cdr', 'Sqn Ldr', 'Flt Lt', 'Fg Off', 'Plt Off',
    'WO', 'FSgt', 'Sgt', 'CI', 'CWO', 'FS', 'Cpl', 'Cdt'
];

export const PROTECTED_SYSTEM_ROLES = ['Admin', 'Guest'];
export const DEFAULT_ROLE_VIEW_PERMISSIONS = [
    'view_home',
    'view_displayboard',
    'view_programme',
    'view_documents'
];

/**
 * Checks whether a role is a built-in system role that cannot be renamed or deleted.
 *
 * @param {Object} role - Role object containing at least a `name` or `is_protected` flag.
 * @returns {boolean} True if protected (`Admin` or `Guest`).
 */
export function isProtectedRole(role) {
    if (!role) return false;
    if (typeof role.is_protected === 'boolean') {
        return role.is_protected;
    }
    return PROTECTED_SYSTEM_ROLES.includes(String(role.name || '').trim());
}

/**
 * Creates a controller around the native <dialog id="role-delete-dialog"> confirmation modal.
 *
 * @param {Object} config
 * @param {HTMLDialogElement|null} config.dialogEl - The native dialog element.
 * @returns {{ confirmDeleteRole: Function }} Dialog controller.
 */
export function createRoleDeleteDialog({ dialogEl }) {
    if (dialogEl && typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
        const isOutside = (e) => {
            const rect = dialogEl.getBoundingClientRect();
            return e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
        };
        let pressedOutside = false;
        dialogEl.addEventListener('pointerdown', (e) => {
            pressedOutside = isOutside(e);
        });
        dialogEl.addEventListener('pointerup', (e) => {
            if (pressedOutside && isOutside(e)) {
                dialogEl.close('');
            }
            pressedOutside = false;
        });
    }

    /**
     * Opens the modal dialog to confirm deleting a custom role.
     *
     * @param {Object} role - Role to delete (`id`, `name`, `user_count`).
     * @returns {Promise<boolean>} True if confirmed, false if cancelled.
     */
    function confirmDeleteRole(role) {
        const roleName = String(role?.name || '').trim();
        const userCount = Number(role?.user_count || 0);

        if (!dialogEl) {
            const fallbackMsg = userCount > 0
                ? `Delete role "${roleName}"? ${userCount} assigned user(s) will be set to (No Role).`
                : `Are you sure you want to delete the "${roleName}" role?`;
            return Promise.resolve(typeof confirm === 'function' ? confirm(fallbackMsg) : true);
        }

        const titleEl = dialogEl.querySelector('#role-delete-dialog-title');
        const msgEl = dialogEl.querySelector('#role-delete-message');

        if (titleEl) {
            titleEl.textContent = `Delete Role "${roleName}"?`;
        }
        if (msgEl) {
            if (userCount > 0) {
                const userWord = userCount === 1 ? 'user is' : 'users are';
                msgEl.textContent = `${userCount} ${userWord} currently assigned to "${roleName}". Deleting this role will unassign them to (No Role).`;
            } else {
                msgEl.textContent = `Are you sure you want to delete the "${roleName}" role? This action cannot be undone.`;
            }
        }

        return new Promise((resolve) => {
            const handleClose = () => {
                const returnValue = dialogEl.returnValue;
                dialogEl.returnValue = '';
                resolve(returnValue === 'delete');
            };

            dialogEl.addEventListener('close', handleClose, { once: true });

            if (typeof dialogEl.showModal === 'function') {
                dialogEl.showModal();
            } else {
                dialogEl.setAttribute('open', '');
            }
        });
    }

    return { confirmDeleteRole };
}

/**
 * Renders the Role Capabilities matrix table (existing roles with inline rename + delete,
 * and a blank bottom row with a role name input, pre-checked default view permissions, and an 'Add +' button).
 *
 * @param {Object} params
 * @param {HTMLElement} params.thead - The `<tr id="roles-table-head">` element.
 * @param {HTMLElement} params.tbody - The `<tbody id="roles-table-body">` element.
 * @param {Array<Object>} params.roles - Array of role objects (`{ id, name, is_protected, user_count }`).
 * @param {Array<Object>} params.permissions - Array of permission objects (`{ id, name }`).
 * @param {Object} params.rolePermissions - Map of `role_id -> Array<permission_id>`.
 * @param {Function} params.onCreateRole - Async callback `({ name, permission_ids }) => Promise<void>`.
 * @param {Function} params.onRenameRole - Async callback `(role, newName) => Promise<void>`.
 * @param {Function} params.onDeleteRole - Async callback `(role) => Promise<void>`.
 * @param {Function} [params.onError] - Error toast callback `(message) => void`.
 */
export function renderRolesMatrixTable({
    thead,
    tbody,
    roles = [],
    permissions = [],
    rolePermissions = {},
    onCreateRole,
    onRenameRole,
    onDeleteRole,
    onError = (msg) => Toast.show(msg, 'error')
}) {
    if (!thead || !tbody) return;

    let headHtml = '<th class="p-sm" scope="col">Role</th>';
    permissions.forEach((p) => {
        headHtml += `<th class="p-sm center" scope="col">${escapeHtml(p.name)}</th>`;
    });
    headHtml += '<th class="p-sm center" scope="col">Actions</th>';
    thead.innerHTML = headHtml;

    tbody.innerHTML = '';

    roles.forEach((role) => {
        const tr = document.createElement('tr');
        tr.dataset.roleId = String(role.id);
        const protectedRole = isProtectedRole(role);
        const rolePerms = rolePermissions[role.id] || [];

        const nameCellHtml = protectedRole
            ? `<strong class="role-name-locked">${escapeHtml(role.name)}</strong>`
            : renderEditableTextButton(role.name, {
                className: 'edit-role-name-btn',
                title: `Click to rename role ${role.name}`,
                ariaLabel: `Rename role ${role.name}`
            });

        let cellsHtml = `<th class="p-sm role-name-cell" scope="row">${nameCellHtml}</th>`;

        permissions.forEach((p) => {
            const isChecked = rolePerms.includes(p.id) ? 'checked' : '';
            const disabled = (role.name === 'Admin' && p.name === 'manage_roles') ? 'disabled' : '';

            cellsHtml += `<td class="p-sm center">
                <input type="checkbox" class="role-perm-checkbox" data-role-id="${escapeHtml(role.id)}" data-perm-id="${escapeHtml(p.id)}" aria-label="${escapeHtml(role.name)} — ${escapeHtml(p.name)}" ${isChecked} ${disabled}>
            </td>`;
        });

        const actionCellHtml = protectedRole
            ? `<span class="text-sm text-muted role-protected-badge" title="System role cannot be deleted">System</span>`
            : `<button type="button" class="btn btn-icon btn-remove-item btn-delete-role" data-role-id="${escapeHtml(role.id)}" title="Delete role ${escapeHtml(role.name)}" aria-label="Delete role ${escapeHtml(role.name)}">
                <span class="material-symbols-outlined" aria-hidden="true">delete</span>
            </button>`;

        cellsHtml += `<td class="p-sm center role-actions-cell">${actionCellHtml}</td>`;
        tr.innerHTML = cellsHtml;
        tbody.appendChild(tr);

        if (!protectedRole) {
            bindEditableTextButton(tr, '.edit-role-name-btn', {
                inputLabel: `Rename role ${role.name}`,
                emptyErrorMessage: 'Role name cannot be empty.',
                onError,
                onCommit: async (newName) => {
                    const duplicate = roles.some(
                        (r) => r.id !== role.id && String(r.name).toLowerCase() === newName.toLowerCase()
                    );
                    if (duplicate) {
                        onError(`Role "${newName}" already exists.`);
                        return;
                    }
                    if (typeof onRenameRole === 'function') {
                        await onRenameRole(role, newName);
                    }
                }
            });

            const deleteBtn = tr.querySelector('.btn-delete-role');
            if (deleteBtn && typeof onDeleteRole === 'function') {
                deleteBtn.addEventListener('click', () => {
                    onDeleteRole(role);
                });
            }
        }
    });

    // Blank creation row at the bottom of the table
    const addRow = document.createElement('tr');
    addRow.className = 'new-role-row';

    let addRowHtml = `
        <th class="p-sm role-name-cell" scope="row">
            <input type="text" id="new-role-name-input" class="new-role-name-input" placeholder="New role name..." aria-label="New role name">
        </th>
    `;

    permissions.forEach((p) => {
        const isDefaultView = DEFAULT_ROLE_VIEW_PERMISSIONS.includes(p.name) ? 'checked' : '';
        addRowHtml += `<td class="p-sm center">
            <input type="checkbox" class="new-role-perm-checkbox" data-perm-id="${escapeHtml(p.id)}" aria-label="New role — ${escapeHtml(p.name)}" ${isDefaultView}>
        </td>`;
    });

    addRowHtml += `
        <td class="p-sm center role-actions-cell">
            <button type="button" id="btn-add-new-role" class="btn btn-primary btn-add-role" title="Add new role" aria-label="Add new role">
                Add +
            </button>
        </td>
    `;

    addRow.innerHTML = addRowHtml;
    tbody.appendChild(addRow);

    const nameInput = addRow.querySelector('#new-role-name-input');
    const addBtn = addRow.querySelector('#btn-add-new-role');

    const submitNewRole = async () => {
        const trimmedName = (nameInput?.value || '').trim();
        if (!trimmedName) {
            onError('Please enter a role name.');
            if (nameInput) nameInput.focus();
            return;
        }

        const duplicate = roles.some(
            (r) => String(r.name).toLowerCase() === trimmedName.toLowerCase()
        );
        if (duplicate) {
            onError(`Role "${trimmedName}" already exists.`);
            if (nameInput) nameInput.focus();
            return;
        }

        const selectedPermIds = [];
        addRow.querySelectorAll('.new-role-perm-checkbox').forEach((cb) => {
            if (cb.checked) {
                selectedPermIds.push(parseInt(cb.getAttribute('data-perm-id'), 10));
            }
        });

        if (addBtn) addBtn.disabled = true;
        try {
            if (typeof onCreateRole === 'function') {
                await onCreateRole({
                    name: trimmedName,
                    permission_ids: selectedPermIds
                });
            }
        } finally {
            if (addBtn) addBtn.disabled = false;
        }
    };

    if (addBtn) {
        addBtn.addEventListener('click', submitNewRole);
    }

    if (nameInput) {
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.isComposing || e.keyCode === 229) {
                    return;
                }
                submitNewRole();
            }
        });
    }
}

export const RANK_SVG_MAP = {
    'Cdt': 'cdt.svg',
    'Cpl': 'cpl.svg',
    'Sgt': 'sgt.svg',
    'FSgt': 'fsgt.svg',
    'FS': 'fsgt.svg',
    'CWO': 'cwo.svg',
    'CI': 'ci.svg',
    'Plt Off': 'plt_off.svg',
    'Fg Off': 'fg_off.svg',
    'Flt Lt': 'flt_lt.svg',
    'Sqn Ldr': 'sqn_ldr.svg',
    'Wg Cdr': 'wg_cdr.svg',
    'WO': 'wo.svg'
};

/**
 * Returns the relative SVG asset path for a given rank string.
 *
 * @param {string} rank - Rank abbreviation (e.g. 'Sgt', 'FS', 'Flt Lt').
 * @returns {string} Path to the rank insignia SVG.
 */
export function getRankSvg(rank) {
    return RANK_SVG_MAP[rank] ? `images/ranks/${RANK_SVG_MAP[rank]}` : 'images/ranks/cdt.svg';
}

/**
 * Escapes HTML special characters for safe template interpolation.
 *
 * @param {string} value - Raw string value.
 * @returns {string} HTML-escaped string.
 */
export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Formats a personnel rank and name into the display string stored in programmes.
 *
 * @param {string} rank - Personnel rank (optional).
 * @param {string} name - Personnel surname/name.
 * @returns {string} Combined display string.
 */
export function formatPersonnelName(rank, name) {
    const trimmedRank = String(rank ?? '').trim();
    const trimmedName = String(name ?? '').trim();
    if (trimmedRank && trimmedName) {
        return `${trimmedRank} ${trimmedName}`;
    }
    return trimmedName || trimmedRank;
}

/**
 * Renders the HTML for a directly clickable inline-editable text button with a subtle edit cue icon.
 *
 * @param {string} value - Current text label.
 * @param {Object} [options] - Optional classes and accessibility labels.
 * @param {string} [options.className='edit-text'] - Extra CSS class for selector binding.
 * @param {string} [options.title='Click to edit'] - Hover tooltip text.
 * @param {string} [options.ariaLabel] - Explicit aria-label override.
 * @returns {string} HTML markup for the editable button.
 */
export function renderEditableTextButton(value, options = {}) {
    const className = options.className || 'edit-text';
    const title = options.title || 'Click to edit';
    const safeVal = escapeHtml(value);
    const ariaLabel = escapeHtml(options.ariaLabel || `Edit ${value}`);

    return `<button type="button" class="editable-text-btn ${escapeHtml(className)}" data-value="${safeVal}" title="${escapeHtml(title)}" aria-label="${ariaLabel}">
        <span class="editable-text-value">${safeVal}</span>
        <span class="material-symbols-outlined edit-cue-icon" aria-hidden="true">edit</span>
    </button>`;
}

/**
 * Attaches direct click-to-edit behavior to an editable text button inside a list row.
 * Supports keyboard activation, IME-safe Enter submission, Escape cancellation, and inline Save/Cancel controls.
 *
 * @param {HTMLElement} containerEl - Row element containing the editable button.
 * @param {string} selector - CSS selector for the editable button inside containerEl.
 * @param {Object} options - Behavior callbacks and labels.
 * @param {Function} options.onCommit - Called with (newValue, oldValue, triggerBtn) when a non-empty change is submitted.
 * @param {string} [options.inputLabel='Edit name'] - Accessible label for the inline text input.
 * @param {string} [options.emptyErrorMessage='Name cannot be empty.'] - Validation error message.
 * @param {Function} [options.onError] - Optional error notifier (defaults to Toast.show).
 */
export function bindEditableTextButton(containerEl, selector, options) {
    const btn = containerEl.querySelector(selector);
    if (!btn) return;

    const {
        onCommit,
        inputLabel = 'Edit name',
        emptyErrorMessage = 'Name cannot be empty.',
        onError = (msg) => Toast.show(msg, 'error')
    } = options;

    btn.addEventListener('click', () => {
        if (btn.classList.contains('hidden')) return;

        const valueEl = btn.querySelector('.editable-text-value');
        const currentValue = (btn.dataset.value ?? valueEl?.textContent ?? btn.textContent).trim();
        const row = btn.closest('.reorder-item');

        if (row) {
            row.classList.add('is-editing');
            row.draggable = false;
        }

        const form = document.createElement('form');
        form.className = 'inline-edit-form';
        form.noValidate = true;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-edit-input';
        input.value = currentValue;
        input.setAttribute('aria-label', inputLabel);

        const btnSave = document.createElement('button');
        btnSave.type = 'submit';
        btnSave.className = 'btn btn-inline-action btn-inline-save';
        btnSave.title = 'Save';
        btnSave.setAttribute('aria-label', 'Save');
        btnSave.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">check</span>';

        const btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.className = 'btn btn-inline-action btn-inline-cancel';
        btnCancel.title = 'Cancel';
        btnCancel.setAttribute('aria-label', 'Cancel');
        btnCancel.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">close</span>';

        form.appendChild(input);
        form.appendChild(btnSave);
        form.appendChild(btnCancel);

        let finished = false;
        let suppressBlurCommit = false;

        const cleanup = (restoreFocus) => {
            form.remove();
            btn.classList.remove('hidden');
            if (row) {
                row.classList.remove('is-editing');
                row.draggable = true;
            }
            if (restoreFocus) {
                btn.focus();
            }
        };

        const cancelEdit = (restoreFocus) => {
            if (finished) return;
            finished = true;
            cleanup(restoreFocus);
        };

        const commitEdit = (explicitSubmit) => {
            if (finished) return;
            const trimmed = input.value.trim();

            if (!trimmed) {
                if (explicitSubmit) {
                    onError(emptyErrorMessage);
                    suppressBlurCommit = false;
                    input.focus();
                    return;
                }
                cancelEdit(false);
                return;
            }

            if (trimmed === currentValue) {
                cancelEdit(explicitSubmit);
                return;
            }

            finished = true;
            cleanup(true);
            onCommit(trimmed, currentValue, btn);
        };

        // IME-safe Enter and Escape handling for single-line inline rename input
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.isComposing || e.keyCode === 229) {
                    return;
                }
                if (typeof form.requestSubmit === 'function') {
                    form.requestSubmit();
                } else {
                    form.dispatchEvent(new Event('submit', { cancelable: true }));
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit(true);
            }
        });

        btnCancel.addEventListener('pointerdown', () => {
            suppressBlurCommit = true;
        });
        btnCancel.addEventListener('click', () => {
            cancelEdit(true);
        });

        btnSave.addEventListener('pointerdown', () => {
            suppressBlurCommit = true;
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            commitEdit(true);
        });

        form.addEventListener('focusout', (e) => {
            if (finished || suppressBlurCommit) return;
            if (e.relatedTarget && form.contains(e.relatedTarget)) return;
            commitEdit(false);
        });

        btn.classList.add('hidden');
        btn.parentNode.insertBefore(form, btn.nextSibling);
        input.focus();
        input.select();
    });
}

/**
 * Formats a summary chip showing either a rank insignia, colour swatch, or plain label.
 *
 * @param {string} text - Label text.
 * @param {Object} [visual] - Optional visual metadata.
 * @param {string} [visual.rank] - Rank string to show insignia SVG.
 * @param {string} [visual.swatchColor] - Hex colour to show swatch box.
 * @returns {string} HTML string for the preview chip.
 */
function renderRenameChip(text, visual = {}) {
    let prefix = '';
    if (visual.rank) {
        prefix = `<img src="${escapeHtml(getRankSvg(visual.rank))}" alt="" class="rename-chip-rank-svg">`;
    } else if (visual.swatchColor) {
        prefix = `<span class="rename-chip-swatch" style="background-color: ${escapeHtml(visual.swatchColor)};" aria-hidden="true"></span>`;
    }
    return `<span class="rename-chip">${prefix}<span>${escapeHtml(text)}</span></span>`;
}

/**
 * Creates a controller around the native <dialog id="programme-rename-dialog"> confirmation modal.
 * Shows a before/after preview and an optional checkbox to update upcoming parade nights.
 *
 * @param {Object} config
 * @param {HTMLDialogElement|null} config.dialogEl - The native dialog element.
 * @param {Function} config.apiFetchFn - API fetch function for preview counts.
 * @returns {{ confirmRename: Function }} Dialog controller.
 */
export function createProgrammeRenameDialog({ dialogEl, apiFetchFn }) {
    // Progressive light-dismiss fallback for browsers without native closedby support
    if (dialogEl && typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
        const isOutside = (e) => {
            const rect = dialogEl.getBoundingClientRect();
            return e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
        };
        let pressedOutside = false;
        dialogEl.addEventListener('pointerdown', (e) => {
            pressedOutside = isOutside(e);
        });
        dialogEl.addEventListener('pointerup', (e) => {
            if (pressedOutside && isOutside(e)) {
                dialogEl.close('');
            }
            pressedOutside = false;
        });
    }

    let previewToken = 0;

    /**
     * Opens the modal dialog to confirm an edit and optionally update upcoming parade nights.
     *
     * @param {Object} params
     * @param {string} params.title - Dialog heading.
     * @param {string} params.entityType - Backend type ('nco'|'staff'|'uniform'|'activity_type'|'classification').
     * @param {string} params.oldDisplay - Previous display label/value.
     * @param {string} params.newDisplay - New display label/value.
     * @param {string} [params.oldRank] - Optional old rank for SVG preview.
     * @param {string} [params.newRank] - Optional new rank for SVG preview.
     * @param {string} [params.swatchColor] - Optional swatch colour for Uniforms/Activity Types.
     * @returns {Promise<{ confirmed: boolean, updateUpcoming: boolean }>}
     */
    function confirmRename({
        title = 'Save Change',
        entityType,
        oldDisplay,
        newDisplay,
        oldRank = '',
        newRank = '',
        swatchColor = ''
    }) {
        if (!dialogEl) {
            return Promise.resolve({ confirmed: true, updateUpcoming: false });
        }

        const titleEl = dialogEl.querySelector('#programme-rename-dialog-title');
        const summaryEl = dialogEl.querySelector('#programme-rename-summary');
        const checkbox = dialogEl.querySelector('#programme-rename-update-upcoming');
        const hintEl = dialogEl.querySelector('#programme-rename-upcoming-hint');

        if (titleEl) titleEl.textContent = title;
        if (summaryEl) {
            summaryEl.innerHTML = `
                ${renderRenameChip(oldDisplay, { rank: oldRank, swatchColor })}
                <span class="material-symbols-outlined rename-arrow" aria-hidden="true">arrow_forward</span>
                ${renderRenameChip(newDisplay, { rank: newRank, swatchColor })}
            `;
        }
        if (checkbox) checkbox.checked = false;
        if (hintEl) hintEl.textContent = 'Checking upcoming parade nights...';

        const currentToken = ++previewToken;
        if (typeof apiFetchFn === 'function' && entityType && oldDisplay) {
            const params = new URLSearchParams({
                action: 'rename_preview',
                type: entityType,
                old_value: oldDisplay
            });
            apiFetchFn(`api/programme.php?${params.toString()}`)
                .then((preview) => {
                    if (currentToken !== previewToken || !hintEl) return;
                    const count = Number(preview?.matching_nights || 0);
                    if (count > 0) {
                        const nightWord = count === 1 ? 'night' : 'nights';
                        hintEl.textContent = `Will update ${count} upcoming parade ${nightWord} (today onwards). Past nights will not be changed.`;
                    } else {
                        hintEl.textContent = 'No upcoming parade nights currently use this entry. Past nights will not be changed.';
                    }
                })
                .catch(() => {
                    if (currentToken !== previewToken || !hintEl) return;
                    hintEl.textContent = 'Updates scheduled parade nights from today onwards. Past nights will not be changed.';
                });
        }

        return new Promise((resolve) => {
            const handleClose = () => {
                const returnValue = dialogEl.returnValue;
                // Always reset returnValue so stale values cannot leak into future dismissals
                dialogEl.returnValue = '';
                previewToken++;
                resolve({
                    confirmed: returnValue === 'save',
                    updateUpcoming: Boolean(checkbox?.checked)
                });
            };

            dialogEl.addEventListener('close', handleClose, { once: true });

            if (typeof dialogEl.showModal === 'function') {
                dialogEl.showModal();
            } else {
                dialogEl.setAttribute('open', '');
            }
        });
    }

    return { confirmRename };
}

/**
 * Manages a rank + name personnel list (Staff or Duty NCOs) with drag-and-drop reordering,
 * direct click-to-edit names, and a shared graphical rank picker popover.
 */
export class PersonnelManager {
    /**
     * @param {Object} config - Manager configuration and callbacks.
     */
    constructor(config) {
        this.containerId = config.containerId;
        this.title = config.title;
        this.ranks = (config.ranks && config.ranks.length > 0) ? config.ranks : DEFAULT_STAFF_RANKS;
        this.loadFn = config.loadFn;
        this.addFn = config.addFn;
        this.editFn = config.editFn;
        this.deleteFn = config.deleteFn;
        this.reorderFn = config.reorderFn;
        this.renderListFn = config.renderListFn;
        this.toastFn = config.toastFn || ((msg, type) => Toast.show(msg, type));
        this.items = [];

        this.managerId = this.containerId.replace('-container', '');
        this.popoverId = `rank-picker-${this.managerId}`;
        this.btnId = `btn-rank-${this.managerId}`;
        this.anchorToken = `--rank-anchor-${this.managerId}`;

        this.activeTrigger = null;
        this.activeRankContext = null;
        this.suppressNextTriggerClick = null;

        this.renderShell();
        this.load();
    }

    /**
     * Renders the static manager container, shared graphical rank picker popover, and add-entry form.
     */
    renderShell() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <h4 class="mb-sm text-muted">${escapeHtml(this.title)}</h4>
            <div id="${this.managerId}-list" class="flex-col gap-xs mb-md admin-list-container"></div>
            <div class="input-group input-group-adjacent" style="position: relative;">
                <button class="btn admin-input-btn-h w-auto rank-add-trigger" type="button" id="${this.btnId}">
                    <img src="" alt="" id="${this.managerId}-rank-display" class="admin-rank-preview hidden">
                    <span id="${this.managerId}-rank-text">Select Rank</span>
                </button>
                <input type="hidden" id="${this.managerId}-new-rank">

                <div id="${this.popoverId}" popover="auto" class="rank-picker-popover" style="position-anchor: ${this.anchorToken};">
                    <h4 class="mt-0 mb-sm rank-picker-title" id="${this.managerId}-rank-popover-title">Select Rank</h4>
                    <div class="icon-grid rank-picker-grid" id="${this.managerId}-rank-grid"></div>
                </div>

                <input type="text" id="${this.managerId}-new-name" placeholder="Name (e.g. Smith)" class="flex-grow-1">
                <button class="btn btn-icon w-auto" type="button" id="${this.managerId}-btn-add" title="Add" aria-label="Add"><span class="material-symbols-outlined">add</span></button>
            </div>
        `;

        this.populateRankPicker();

        const popover = document.getElementById(this.popoverId);
        const addRankBtn = document.getElementById(this.btnId);
        const newRankInput = document.getElementById(`${this.managerId}-new-rank`);
        const btnAdd = document.getElementById(`${this.managerId}-btn-add`);
        const nameInput = document.getElementById(`${this.managerId}-new-name`);

        if (popover) {
            popover.addEventListener('toggle', (e) => {
                if (e.newState === 'closed' && !this.isPopoverOpen(popover)) {
                    this.clearActiveAnchor();
                }
            });
        }

        if (addRankBtn) {
            this.bindRankTrigger(addRankBtn, () => ({
                trigger: addRankBtn,
                currentRank: newRankInput ? newRankInput.value : '',
                mode: 'add',
                title: 'Select Rank'
            }));
        }

        const handleAdd = async () => {
            const name = nameInput.value.trim();
            const rank = newRankInput.value.trim();
            if (name && rank) {
                await this.addFn(name, rank);
                nameInput.value = '';
                newRankInput.value = '';
                const rankText = document.getElementById(`${this.managerId}-rank-text`);
                const rankImg = document.getElementById(`${this.managerId}-rank-display`);
                if (rankText) rankText.classList.remove('hidden');
                if (rankImg) {
                    rankImg.classList.add('hidden');
                    rankImg.src = '';
                    rankImg.alt = '';
                }
                if (addRankBtn) {
                    addRankBtn.removeAttribute('title');
                }
                await this.load();
            } else {
                this.toastFn('Please select a rank and enter a name.', 'error');
            }
        };

        btnAdd.addEventListener('click', handleAdd);
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.isComposing || e.keyCode === 229) return;
                handleAdd();
            }
        });
    }

    /**
     * Populates the graphical rank picker popover with accessible rank buttons.
     */
    populateRankPicker() {
        const grid = document.getElementById(`${this.managerId}-rank-grid`);
        if (!grid) return;
        grid.innerHTML = '';

        this.ranks.forEach((rank) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rank-option-btn';
            btn.dataset.rank = rank;
            btn.setAttribute('aria-pressed', 'false');
            btn.innerHTML = `
                <img src="${escapeHtml(getRankSvg(rank))}" alt="" class="rank-svg-lg">
                <span class="text-sm text-center">${escapeHtml(rank)}</span>
            `;

            btn.addEventListener('click', () => {
                this.handleRankSelection(rank);
            });

            grid.appendChild(btn);
        });
    }

    /**
     * Clears anchor positioning state from the previously active trigger button.
     */
    clearActiveAnchor() {
        if (this.activeTrigger) {
            this.activeTrigger.style.anchorName = '';
            this.activeTrigger.classList.remove('is-rank-picker-open');
            this.activeTrigger = null;
        }
        this.activeRankContext = null;
    }

    /**
     * Checks whether the rank picker popover is currently open.
     *
     * @param {HTMLElement} popover - The popover element.
     * @returns {boolean}
     */
    isPopoverOpen(popover) {
        if (!popover) return false;
        try {
            if (popover.matches(':popover-open')) return true;
        } catch (e) {
            // Fallback for environments like JSDOM without :popover-open selector support
        }
        return popover.classList.contains(':popover-open');
    }

    /**
     * Hides the rank picker popover cleanly with fallback for polyfilled/test environments.
     */
    closeRankPicker() {
        const popover = document.getElementById(this.popoverId);
        if (!popover) return;
        if (typeof popover.hidePopover === 'function') {
            try {
                popover.hidePopover();
            } catch (e) {
                popover.classList.remove(':popover-open');
                this.clearActiveAnchor();
            }
        } else {
            popover.classList.remove(':popover-open');
            this.clearActiveAnchor();
        }
    }

    /**
     * Binds click and pointerdown handlers to a rank picker trigger button so clicking
     * an already-open trigger cleanly closes the popover instead of light-dismissing and reopening.
     *
     * @param {HTMLElement} trigger - Trigger button element.
     * @param {Function} getContext - Returns the openRankPicker context object.
     */
    bindRankTrigger(trigger, getContext) {
        trigger.addEventListener('pointerdown', () => {
            const popover = document.getElementById(this.popoverId);
            if (this.activeTrigger === trigger && this.isPopoverOpen(popover)) {
                this.suppressNextTriggerClick = trigger;
            } else {
                this.suppressNextTriggerClick = null;
            }
        });

        trigger.addEventListener('click', () => {
            if (this.suppressNextTriggerClick === trigger) {
                this.suppressNextTriggerClick = null;
                return;
            }
            this.openRankPicker(getContext());
        });
    }

    /**
     * Opens (or toggles closed) the shared graphical rank picker popover anchored to a trigger button.
     *
     * @param {Object} context
     * @param {HTMLElement} context.trigger - Trigger button that opened the picker.
     * @param {string} context.currentRank - Currently selected rank to highlight.
     * @param {'add'|'edit'} context.mode - Whether adding a new entry or updating an existing row.
     * @param {Object} [context.item] - Existing personnel item when mode === 'edit'.
     * @param {number} [context.index] - Row index when mode === 'edit'.
     * @param {string} [context.title] - Heading displayed in the popover.
     */
    openRankPicker(context) {
        const popover = document.getElementById(this.popoverId);
        if (!popover) return;

        const alreadyOpenForTrigger = this.activeTrigger === context.trigger && this.isPopoverOpen(popover);
        if (alreadyOpenForTrigger) {
            this.closeRankPicker();
            return;
        }

        if (this.isPopoverOpen(popover)) {
            this.closeRankPicker();
        }

        this.clearActiveAnchor();
        this.activeTrigger = context.trigger;
        this.activeRankContext = context;

        context.trigger.style.anchorName = this.anchorToken;
        context.trigger.classList.add('is-rank-picker-open');

        const titleEl = document.getElementById(`${this.managerId}-rank-popover-title`);
        if (titleEl) {
            titleEl.textContent = context.title || 'Select Rank';
        }

        const buttons = popover.querySelectorAll('.rank-option-btn');
        buttons.forEach((btn) => {
            const isSelected = btn.dataset.rank === context.currentRank;
            btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            btn.classList.toggle('is-selected', isSelected);
        });

        if (typeof popover.showPopover === 'function') {
            try {
                popover.showPopover({ source: context.trigger });
            } catch (e) {
                popover.showPopover();
            }
        } else {
            popover.classList.add(':popover-open');
        }
    }

    /**
     * Handles choosing a rank inside the popover for either Add or Edit mode.
     *
     * @param {string} selectedRank - The chosen rank abbreviation.
     */
    async handleRankSelection(selectedRank) {
        const context = this.activeRankContext;
        const trigger = this.activeTrigger;
        this.closeRankPicker();

        if (!context) return;

        if (context.mode === 'add') {
            const rankInput = document.getElementById(`${this.managerId}-new-rank`);
            const rankText = document.getElementById(`${this.managerId}-rank-text`);
            const rankImg = document.getElementById(`${this.managerId}-rank-display`);
            if (rankInput) rankInput.value = selectedRank;
            if (rankText) rankText.classList.add('hidden');
            if (rankImg) {
                rankImg.src = getRankSvg(selectedRank);
                rankImg.alt = selectedRank;
                rankImg.classList.remove('hidden');
            }
            if (trigger) {
                trigger.title = `Selected rank: ${selectedRank}`;
            }
            return;
        }

        if (context.mode === 'edit' && context.item) {
            if (selectedRank === context.item.rank) return;
            if (trigger) trigger.focus();
            const saved = await this.editFn(context.item, context.item.name, selectedRank, context.index);
            if (saved !== false) {
                await this.load();
            }
        }
    }

    /**
     * Loads personnel records and renders the interactive list.
     */
    async load() {
        this.items = (await this.loadFn()) || [];
        this.renderList();
    }

    /**
     * Renders the personnel rows with clickable rank picker triggers and direct click-to-edit names.
     */
    renderList() {
        this.renderListFn(`${this.managerId}-list`, this.items, {
            renderInner: (item) => {
                const displayName = formatPersonnelName(item.rank, item.name);
                return `
                    <button type="button" class="editable-rank-btn" title="Click to change rank" aria-label="Change rank for ${escapeHtml(displayName)} (currently ${escapeHtml(item.rank)})">
                        <img src="${escapeHtml(getRankSvg(item.rank))}" alt="" class="rank-svg-sm">
                        <span class="clickable-rank">${escapeHtml(item.rank)}</span>
                        <span class="material-symbols-outlined rank-cue-icon" aria-hidden="true">unfold_more</span>
                    </button>
                    ${renderEditableTextButton(item.name, {
                        className: 'edit-text-name',
                        title: 'Click to edit name',
                        ariaLabel: `Edit name ${item.name}`
                    })}
                `;
            },
            bindEvents: (div, item, i) => {
                const rankBtn = div.querySelector('.editable-rank-btn');
                if (rankBtn) {
                    this.bindRankTrigger(rankBtn, () => ({
                        trigger: rankBtn,
                        currentRank: item.rank,
                        mode: 'edit',
                        item,
                        index: i,
                        title: `Change Rank — ${item.name}`
                    }));
                }

                bindEditableTextButton(div, '.edit-text-name', {
                    inputLabel: `Edit name for ${formatPersonnelName(item.rank, item.name)}`,
                    onCommit: async (newName) => {
                        const saved = await this.editFn(item, newName, item.rank, i);
                        if (saved !== false) {
                            await this.load();
                        }
                    },
                    onError: (msg) => this.toastFn(msg, 'error')
                });
            },
            onRemove: async (i) => {
                const item = this.items[i];
                if (confirm(`Remove ${formatPersonnelName(item.rank, item.name)}?`)) {
                    await this.deleteFn(item, i);
                    await this.load();
                    this.toastFn('Removed', 'success');
                }
            },
            onReorder: async (newArr) => {
                await this.reorderFn(newArr);
                await this.load();
            }
        });
    }
}
