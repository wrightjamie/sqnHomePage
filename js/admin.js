import { apiFetch } from "./api.js";
import { Auth } from "./auth.js";
import { Toast } from "./components/Toast.js";
import { Pagination } from "./components/Pagination.js";
import { setupDragAndDrop } from "./utils/dragDrop.js";
import {
    DEFAULT_STAFF_RANKS,
    escapeHtml,
    formatPersonnelName,
    renderEditableTextButton,
    bindEditableTextButton,
    createProgrammeRenameDialog,
    PersonnelManager
} from "./utils/programme-settings-editor.js";


// js/admin.js

// Generic list renderer
function renderList(containerId, items, config) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if (!items) return;

    items.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'set-item reorder-item';
        div.draggable = true;
        div.dataset.id = i;

        // Start common HTML
        let html = `<div class="flex-row align-center flex-1 gap-sm">
                    <span class="material-symbols-outlined drag-handle" title="Drag to reorder">drag_indicator</span>`;

        html += config.renderInner(item, i);

        html += `</div>`;

        if (!config.hideRemove) {
            html += `<button type="button" class="btn btn-remove btn-remove-item" data-index="${i}" title="Remove" aria-label="Remove"><span class="material-symbols-outlined">delete</span></button>`;
        }

        div.innerHTML = html;

        // Bind edit events
        if (config.bindEvents) config.bindEvents(div, item, i);

        // Bind remove
        if (!config.hideRemove) {
            div.querySelector('.btn-remove').addEventListener('click', () => config.onRemove(i));
        }

        container.appendChild(div);
    });

    setupDragAndDrop(container, (newOrder) => {
        config.onReorder(newOrder.map(oldIdx => items[oldIdx]));
    });
}

function editableColorBinding(el, selector, onSave) {
    const colorBox = el.querySelector(selector);
    if(!colorBox) return;

    colorBox.style.cursor = 'pointer';
    colorBox.title = 'Click to edit color';
    colorBox.innerHTML = ''; // clear any existing

    const input = document.createElement('input');
    input.type = 'color';
    input.value = rgbToHex(colorBox.style.backgroundColor);
    input.setAttribute('list', 'brand-colors'); // Include brand colors datalist

    // Fill the parent so clicks hit the input natively
    input.style.position = 'absolute';
    input.style.top = '0';
    input.style.left = '0';
    input.style.opacity = '0';
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.border = 'none';
    input.style.padding = '0';
    input.style.margin = '0';
    input.style.cursor = 'pointer';

    input.addEventListener('input', () => {
        colorBox.style.backgroundColor = input.value;
    });
    input.addEventListener('change', () => {
        onSave(input.value);
    });

    colorBox.appendChild(input);
}

function rgbToHex(rgb) {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return rgb; // might already be hex
    return "#" + match.slice(1).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}

const ADMIN_CONFIG = {
    BUTTON_RESET_TIMEOUT_MS: 2000
};

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const adminSection = document.getElementById('admin-section');
    const loginForm = document.getElementById('login-form');
    const btnLogout = document.getElementById('btn-logout');

    const setsList = document.getElementById('sets-list');
    const createSetForm = document.getElementById('create-set-form');


    let currentUserPermissions = [];

    async function checkAuth() {
        try {
            const data = await fetch('api/auth.php?action=status');
            const res = await data.json();
            const headerTitle = document.getElementById('header-title');
            if (res.data && res.data.logged_in) {
                currentUserPermissions = res.data.permissions || [];
                loginSection.classList.add('hidden');
                adminSection.classList.remove('hidden');
                if (headerTitle) headerTitle.textContent = 'Admin';
                loadSets();
                if (window.checkUrlTab) window.checkUrlTab();

                if (currentUserPermissions.includes('manage_users')) {
                    document.getElementById('tab-btn-users').classList.remove('hidden');
                    loadUsers();
                } else {
                    document.getElementById('tab-btn-users').classList.add('hidden');
                }

                if (currentUserPermissions.includes('manage_roles')) {
                    document.getElementById('subtab-btn-roles').classList.remove('hidden');
                    if (typeof loadRolesMatrix === 'function') loadRolesMatrix();
                } else {
                    const rolesTab = document.getElementById('subtab-btn-roles');
                    if (rolesTab) rolesTab.classList.add('hidden');
                }
            } else {
                loginSection.classList.remove('hidden');
                adminSection.classList.add('hidden');
                if (headerTitle) headerTitle.textContent = 'Login';
                document.getElementById('username').focus();
            }
        } catch (e) {
            console.error('Auth error', e);
        }
    }

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            await apiFetch('api/auth.php?action=login', 'POST', {username, password});
            checkAuth();
        } catch (err) {
            // Toast will handle the error display automatically via apiFetch
        }
    });

    // Logout
    btnLogout.addEventListener('click', async () => {
        await apiFetch('api/auth.php?action=logout');
        checkAuth();
    });

    // Load Slide Sets
    async function loadSets() {
        const data = await apiFetch('api/slides.php?action=list_sets');
        
        setsList.innerHTML = '';
        if (data.success && data.sets) {
            data.sets.forEach(set => {
                // Add to list
                const div = document.createElement('div');
                div.className = 'set-item';
                div.innerHTML = `
                    <span><span class="material-symbols-outlined list-icon">${set.icon || 'folder'}</span><strong>${set.name}</strong> ${set.is_active ? '(ACTIVE)' : ''}</span>
                    <button class="btn" data-action="setActive" data-id="${set.id}" title="Set Active"><span class="material-symbols-outlined">check_circle</span></button>
                `;
                setsList.appendChild(div);
            });
        }
    }

    const setActiveSet = async (id) => {
        await apiFetch('api/slides.php?action=set_active', 'POST', {set_id: id});
        loadSets();
    };

    // Delegate events for sets list
    document.getElementById('sets-list').addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (target) {
            const action = target.getAttribute('data-action');
            if (action === 'setActive') {
                setActiveSet(target.getAttribute('data-id'));
            }
        }
    });

    // Handle icon picker popover selection
    document.querySelectorAll('.icon-radio').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('selected-icon-display').textContent = e.target.value;
            const popover = document.getElementById('icon-picker');
            if (popover.hidePopover) popover.hidePopover();
        });
    });

    // Create Set
    createSetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('new-set-name').value;
        const icon = document.querySelector('input[name="new-set-icon"]:checked').value;
        
        await apiFetch('api/slides.php?action=create_set', 'POST', {name, icon});
        document.getElementById('new-set-name').value = '';
        // Reset icon
        document.getElementById('icon-folder').checked = true;
        document.getElementById('selected-icon-display').textContent = 'folder';
        
        loadSets();
    });



    // --- Subtabs Logic ---
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subTabContents = document.querySelectorAll('.sub-tab-content');

    function switchSubTab(targetId) {
        subTabContents.forEach(c => c.classList.add('hidden'));
        subTabBtns.forEach(b => b.classList.remove('active'));
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.classList.remove('hidden');
        const btnEl = document.querySelector(`.sub-tab-btn[data-subtarget="${targetId}"]`);
        if (btnEl) btnEl.classList.add('active');

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('subtab', targetId.replace('subtab-', ''));
        window.history.replaceState({}, '', url);
    }

    subTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchSubTab(btn.getAttribute('data-subtarget'));
        });
    });

    // Load initial subtab from URL
    const urlParamsSub = new URLSearchParams(window.location.search);
    if (urlParamsSub.has('subtab')) {
        const target = `subtab-${urlParamsSub.get('subtab')}`;
        if (document.getElementById(target)) switchSubTab(target);
    }

    // --- Tabs Logic ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    function switchTab(targetId, updateUrl = true) {
        // Remove active from all
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));
        
        // Add active to clicked
        const btn = document.querySelector(`.tab-btn[data-target="${targetId}"]`);
        if (btn) btn.classList.add('active');
        const content = document.getElementById(targetId);
        if (content) {
            content.classList.remove('hidden');
            
            // Check if this tab has sub-tabs
            const subTabs = content.querySelectorAll('.sub-tab-btn');
            if (subTabs.length > 0) {
                const activeSubtab = content.querySelector('.sub-tab-btn.active');
                if (activeSubtab) {
                    switchSubTab(activeSubtab.getAttribute('data-subtarget'));
                } else {
                    // Default to first sub-tab
                    switchSubTab(subTabs[0].getAttribute('data-subtarget'));
                }
            }
        }
        
        if (updateUrl) {
            const url = new URL(window.location);
            url.searchParams.set('tab', targetId);
            window.history.replaceState({}, '', url);
        }
        
        // If Images tab clicked, load images
        if (targetId === 'tab-images') {
            loadTags();
            loadAdminGallery(1);
        }
    }
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.getAttribute('data-target'));
        });
    });
    
    // Read tab from URL on load (we'll do this after checking auth)
    window.checkUrlTab = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab && document.getElementById(tab)) {
            switchTab(tab, false);
        }
    };

    // --- Reorder Slide Sets ---
    const reorderSetsModal = document.getElementById('reorder-sets-modal');
    const reorderSetsList = document.getElementById('reorder-sets-list');
    let reorderSetsIds = [];

    document.getElementById('btn-reorder-sets').addEventListener('click', async () => {
        const data = await apiFetch('api/slides.php?action=list_sets');
        
        if (data.success && data.sets) {
            // Only reorder active sets? Actually, it's easier to order all sets or just active ones.
            // Let's order all sets, but they are returned sorted by display_order automatically if we update the query.
            // Wait, list_sets is not ordered by display_order. I should sort it in JS or update list_sets.
            let sets = data.sets.sort((a,b) => a.display_order - b.display_order);
            
            reorderSetsIds = sets.map(s => s.id);
            reorderSetsList.innerHTML = sets.map(s => `
                <div class="reorder-item reorder-list-item" draggable="true" data-id="${s.id}">
                    <span class="material-symbols-outlined drag-handle">drag_indicator</span>
                    <span class="material-symbols-outlined list-icon">${s.icon || 'folder'}</span>
                    ${s.name} ${s.is_active ? '(ACTIVE)' : ''}
                </div>
            `).join('');
            
            setupDragAndDrop(reorderSetsList, (newOrder) => {
                reorderSetsIds = newOrder;
            });
            
            reorderSetsModal.classList.remove('hidden');
        }
    });

    document.getElementById('btn-close-reorder-sets').addEventListener('click', () => {
        reorderSetsModal.classList.add('hidden');
    });

    document.getElementById('btn-save-reorder-sets').addEventListener('click', async () => {
        const data = await apiFetch('api/slides.php?action=reorder_sets', 'POST', { ordered_ids: reorderSetsIds });
        if (data.success) {
            reorderSetsModal.classList.add('hidden');
            loadSets(); // Refresh sets list
        }
    });

    // --- Admin Image Gallery ---
    const adminGalleryGrid = document.getElementById('admin-gallery-grid');
    const btnRegenThumbs = document.getElementById('btn-regen-thumbs');
    
    // Use the reusable Pagination component
    const adminPagination = new Pagination('admin-gallery-pagination', (page) => {
        loadAdminGallery(page);
    });

    let currentAdminTagFilter = [];

    async function loadAdminGallery(page) {
        const searchInput = document.getElementById('admin-gallery-search').value;
        const tagFilter = currentAdminTagFilter.join(',');
        
        const params = new URLSearchParams({
            action: 'list',
            page: page,
            limit: 18,
            search: searchInput,
            tag: tagFilter
        });
        
        const data = await apiFetch(`api/images.php?${params.toString()}`);
        
        if (!data.success) return;
        
        // Store globally to use when editing
        window.currentAdminImages = data.images;
        
        adminGalleryGrid.innerHTML = data.images.map(img => `
            <div class="admin-gallery-item-container">
                <img src="${img.thumb_url}" class="admin-gallery-item" title="${img.filename}">
                <button class="admin-edit-overlay-btn" data-action="openMetadata" data-id="${img.id}" title="Edit Metadata">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="admin-delete-overlay" data-action="deleteImage" data-filename="${img.filename}" title="Delete Image">
                    <span class="material-symbols-outlined">delete</span>
                </button>
                ${img.tags && img.tags.length > 0 ? `<div class="admin-img-tags">${[...img.tags].sort().join(', ')}</div>` : ''}
            </div>
        `).join('');
        
        adminPagination.render(data.page, data.pages);
    }
    
    document.getElementById('btn-admin-gallery-search').addEventListener('click', () => loadAdminGallery(1));
    document.getElementById('admin-gallery-search').addEventListener('keyup', (e) => {
        if(e.key === 'Enter') loadAdminGallery(1);
    });
    
    // --- Image Metadata Modal ---
    const metadataModal = document.getElementById('image-metadata-modal');
    const metadataForm = document.getElementById('metadata-form');
    let currentTags = [];
    let allAvailableTags = [];
    
    async function loadTags() {
        const data = await apiFetch('api/images.php?action=get_tags');
        if (data.success) {
            allAvailableTags = data.tags;
            renderAdminTagFilter();
        }
    }
    
    function renderAdminTagFilter() {
        const filterContainer = document.getElementById('admin-gallery-tag-filter');
        if (!filterContainer) return;
        filterContainer.innerHTML = `
            <div class="filter-tag ${currentAdminTagFilter.length === 0 ? 'active' : ''}" data-action="setTagFilter" data-tag="">All Tags</div>
            ${allAvailableTags.map(t => `<div class="filter-tag ${currentAdminTagFilter.includes(t) ? 'active' : ''}" data-action="setTagFilter" data-tag="${t}">${t}</div>`).join('')}
        `;
    }
    
    const setAdminTagFilter = (tag) => {
        if (tag === '') {
            currentAdminTagFilter = [];
        } else {
            const index = currentAdminTagFilter.indexOf(tag);
            if (index > -1) {
                currentAdminTagFilter.splice(index, 1);
            } else {
                currentAdminTagFilter.push(tag);
            }
        }
        renderAdminTagFilter();
        loadAdminGallery(1);
    };
    
    // Delegate events for tag filter
    document.getElementById('admin-gallery-tag-filter')?.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (target && target.getAttribute('data-action') === 'setTagFilter') {
            setAdminTagFilter(target.getAttribute('data-tag'));
        }
    });

    const openMetadataModal = (id) => {
        const img = window.currentAdminImages.find(i => i.id == id);
        if(!img) return;
        
        if (window.ImageEditor) {
            window.ImageEditor.edit(img, {
                onAccept: () => {
                    loadAdminGallery(adminPagination.currentPage);
                    loadTags();
                }
            });
        }
    };
    
    // Delegate events for gallery
    document.getElementById('admin-gallery-grid')?.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (target) {
            const action = target.getAttribute('data-action');
            if (action === 'openMetadata') {
                openMetadataModal(target.getAttribute('data-id'));
            } else if (action === 'deleteImage') {
                deleteAdminImage(target.getAttribute('data-filename'));
            }
        }
    });
    
    const deleteAdminImage = async (filename) => {
        if (!confirm(`Are you sure you want to permanently delete ${filename}?`)) return;
        
        const data = await apiFetch(`api/images.php?action=delete&filename=${encodeURIComponent(filename)}`);
        if (data.success) {
            loadAdminGallery(adminPagination.currentPage);
        } else {
            Toast.show('Failed to delete image: ' + (data.message || 'Unknown error'), 'error');
        }
    };
    
    btnRegenThumbs.addEventListener('click', async () => {
        const originalText = btnRegenThumbs.innerHTML;
        btnRegenThumbs.innerHTML = '<span class="material-symbols-outlined loading-spinner">autorenew</span> Working...';
        btnRegenThumbs.disabled = true;
        
        try {
            const data = await apiFetch('api/images.php?action=regenerate_all');
            
            if (data.success) {
                if (data.debug && !data.debug.gd_loaded) {
                    Toast.show('Warning: The PHP GD library is STILL NOT loaded by the web server. Please ensure you edited the correct php.ini and fully restarted Apache in XAMPP.', 'error');
                } else {
                    Toast.show(`Successfully generated ${data.count} new thumbnails!`, 'success');
                }
                loadAdminGallery(adminPagination.currentPage); // refresh grid to show new thumbs
            } else {
                Toast.show('Failed: ' + data.message, 'error');
            }
        } catch (e) {
            Toast.show('Error during regeneration.', 'error');
        }
        
        btnRegenThumbs.innerHTML = originalText;
        btnRegenThumbs.disabled = false;
    });

    // --- Upload Modal Logic ---
    const btnOpenUploadModal = document.getElementById('btn-open-upload-modal'); // slide form
    const btnOpenGalleryUploadModal = document.getElementById('btn-open-gallery-upload-modal'); // gallery
    
    function openUploadModal() {
        if (window.ImageEditor) {
            window.ImageEditor.openNew({
                onAccept: () => {
                    loadAdminGallery(1);
                    loadTags();
                }
            });
        }
    }

    if (btnOpenUploadModal) btnOpenUploadModal.addEventListener('click', openUploadModal);
    if (btnOpenGalleryUploadModal) btnOpenGalleryUploadModal.addEventListener('click', openUploadModal);

    // --- Settings Tab Logic ---
    async function loadGlobalSettings() {
        try {
            const data = await apiFetch('api/settings.php?action=global_config');
            if (data) {
                document.getElementById('global-sidebar-text').value = data.sidebarText || '';
                document.getElementById('global-slide-speed').value = data.slideSpeed || 10;
            }
        } catch (e) {
            console.error('Failed to load global settings', e);
        }
    }

    document.getElementById('btn-save-global-settings')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-save-global-settings');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined loading-spinner">autorenew</span> Saving...';
        btn.disabled = true;

        const payload = {
            sidebarText: document.getElementById('global-sidebar-text').value,
            slideSpeed: parseInt(document.getElementById('global-slide-speed').value, 10) || 10
        };

        try {
            await apiFetch('api/settings.php?action=global_config', 'POST', payload);
            btn.innerHTML = '<span class="material-symbols-outlined mr-sm">check</span> Saved!';
            btn.style.background = 'rgba(0, 200, 100, 0.6)';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, ADMIN_CONFIG.BUTTON_RESET_TIMEOUT_MS);
        } catch (e) {
            btn.innerHTML = 'Error saving';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, ADMIN_CONFIG.BUTTON_RESET_TIMEOUT_MS);
        }
    });

    // --- Menu Order Logic ---
    let currentMenuOrder = [];
    let currentDefaultPage = 'displayboard';
    
    async function loadMenuOrderSettings() {
        try {
            const result = await apiFetch('api/settings.php?action=menu_order');
            currentMenuOrder = result.menu_order || ['home.php', 'programme.php', 'index.php', 'documents.php'];
            currentDefaultPage = result.default_page || 'displayboard';
            renderMenuOrderManager();
        } catch (e) {
            console.error('Failed to load menu order settings', e);
        }
    }

    function renderMenuOrderManager() {
        const container = document.getElementById('menu-order-manager-container');
        if (!container) return;
        
        renderList('menu-order-manager-container', currentMenuOrder, {
            hideRemove: true,
            renderInner: (page) => {
                const pageNames = {
                    'home.php': 'Home',
                    'programme.php': 'Programme',
                    'index.php': 'Display Board',
                    'documents.php': 'Documents',
                    'profile.php': 'Profile'
                };
                const routePages = {
                    'home.php': 'home',
                    'programme.php': 'programme',
                    'index.php': 'displayboard',
                    'documents.php': 'documents',
                    'profile.php': 'profile'
                };
                const routePage = routePages[page] || page;
                const isDefault = (routePage === currentDefaultPage);
                
                return `<span class="font-bold flex-1">${pageNames[page] || page}</span>
                        <label class="cursor-pointer text-sm transition-colors mr-sm" style="border-radius: 4px; padding: 4px 10px; display: inline-block; background: ${isDefault ? 'var(--color-secondary)' : 'transparent'}; color: ${isDefault ? 'white' : 'inherit'}; border: 1px solid ${isDefault ? 'var(--color-secondary)' : '#ccc'};">
                            <input type="radio" name="default_page_radio" value="${routePage}" ${isDefault ? 'checked' : ''} class="hidden">
                            Initial Page
                        </label>`;
            },
            bindEvents: (el, page, idx) => {
                const radioInput = el.querySelector('input[type="radio"]');
                if (radioInput) {
                    radioInput.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            currentDefaultPage = e.target.value;
                        }
                    });
                }
            },
            onReorder: (newArr) => {
                currentMenuOrder = newArr;
                renderMenuOrderManager();
            }
        });
    }

    document.getElementById('btn-save-menu-order')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-save-menu-order');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined loading-spinner">autorenew</span> Saving...';
        btn.disabled = true;

        try {
            await apiFetch('api/settings.php?action=menu_order', 'POST', {
                menu_order: currentMenuOrder,
                default_page: currentDefaultPage
            });
            btn.innerHTML = '<span class="material-symbols-outlined mr-sm">check</span> Saved!';
            btn.style.background = 'rgba(0, 200, 100, 0.6)';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, ADMIN_CONFIG.BUTTON_RESET_TIMEOUT_MS);
        } catch (e) {
            btn.innerHTML = 'Error saving';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, ADMIN_CONFIG.BUTTON_RESET_TIMEOUT_MS);
        }
    });

    loadGlobalSettings();
    loadMenuOrderSettings();

    // User Management
    let rolesData = [];

    async function loadUsers() {
        const data = await apiFetch('api/users.php?action=list');
        if (data && data.users) {
            rolesData = data.roles || [];
            const tbody = document.getElementById('users-table-body');
            tbody.innerHTML = '';

            data.users.forEach(user => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--color-border)';

                // Status select
                const statusOptions = ['pending', 'active', 'disabled'].map(s =>
                    `<option value="${s}" ${user.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
                ).join('');

                // Role select
                const roleOptions = `<option value="">(No Role)</option>` + rolesData.map(r =>
                    `<option value="${r.id}" ${user.role_id == r.id ? 'selected' : ''}>${r.name}</option>`
                ).join('');

                tr.innerHTML = `
                    <td class="p-sm">${user.id}</td>
                    <td class="p-sm"><strong>${user.username}</strong></td>
                    <td class="p-sm">${user.display_name || ''}</td>
                    <td class="p-sm">
                        <select class="form-control admin-select-status w-auto" data-id="${user.id}">
                            ${statusOptions}
                        </select>
                    </td>
                    <td class="p-sm">
                        <select class="form-control admin-select-role w-auto" data-id="${user.id}">
                            ${roleOptions}
                        </select>
                    </td>
                    <td class="p-sm">
                        <div class="flex-row gap-xs">
                            <button class="btn btn-secondary btn-change-user-pwd" data-id="${user.id}" data-username="${user.username}" title="Change Password">
                                <span class="material-symbols-outlined">key</span>
                            </button>
                            <button class="btn btn-primary btn-delete-user" data-id="${user.id}" title="Delete User">
                                <span class="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Add event listeners
            document.querySelectorAll('.admin-select-status').forEach(sel => {
                sel.addEventListener('change', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    const status = e.target.value;
                    try {
                        await apiFetch('api/users.php?action=update_status', 'POST', { user_id: id, status: status });
                        Toast.show('Status updated', 'success');
                    } catch (err) {
                        Toast.show('Failed to update status', 'error');
                        loadUsers(); // revert UI
                    }
                });
            });

            document.querySelectorAll('.admin-select-role').forEach(sel => {
                sel.addEventListener('change', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    const roleId = e.target.value;
                    try {
                        await apiFetch('api/users.php?action=update_role', 'POST', { user_id: id, role_id: roleId });
                        Toast.show('Role updated', 'success');
                    } catch (err) {
                        Toast.show('Failed to update role', 'error');
                        loadUsers(); // revert UI
                    }
                });
            });

            document.querySelectorAll('.btn-change-user-pwd').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const username = e.currentTarget.getAttribute('data-username');
                    document.getElementById('change-password-user-id').value = id;
                    document.getElementById('change-password-username-display').textContent = `User: ${username}`;
                    document.getElementById('admin-new-password').value = '';
                    document.getElementById('admin-confirm-password').value = '';
                    document.getElementById('admin-change-password-modal').classList.remove('hidden');
                });
            });

            document.querySelectorAll('.btn-delete-user').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Are you sure you want to delete this user?')) {
                        const id = e.currentTarget.getAttribute('data-id');
                        try {
                            await apiFetch('api/users.php?action=delete_user', 'POST', { user_id: id });
                            Toast.show('User deleted', 'success');
                            loadUsers();
                        } catch (err) {
                            Toast.show('Failed to delete user', 'error');
                        }
                    }
                });
            });
        }
    }

    // --- Roles Management ---
    const btnSaveRoles = document.getElementById('btn-save-roles');
    
    async function loadRolesMatrix() {
        if (!currentUserPermissions.includes('manage_roles')) return;
        const rolesTab = document.getElementById('subtab-btn-roles');
        if (rolesTab) rolesTab.style.display = 'inline-block';
        
        try {
            const data = await apiFetch('api/roles.php?action=list');
            if (data.roles && data.permissions) {
                const thead = document.getElementById('roles-table-head');
                const tbody = document.getElementById('roles-table-body');
                
                // Build headers
                let headHtml = '<th class="p-sm">Role</th>';
                data.permissions.forEach(p => {
                    headHtml += `<th class="p-sm center">${p.name}</th>`;
                });
                thead.innerHTML = headHtml;
                
                // Build body
                tbody.innerHTML = '';
                data.roles.forEach(role => {
                    let rowHtml = `<tr><td class="p-sm"><strong>${role.name}</strong></td>`;
                    const rolePerms = data.role_permissions[role.id] || [];
                    
                    data.permissions.forEach(p => {
                        const isChecked = rolePerms.includes(p.id) ? 'checked' : '';
                        const disabled = (role.name === 'Admin' && p.name === 'manage_roles') ? 'disabled' : ''; 
                        
                        rowHtml += `<td class="p-sm center">
                            <input type="checkbox" class="role-perm-checkbox" data-role-id="${role.id}" data-perm-id="${p.id}" ${isChecked} ${disabled}>
                        </td>`;
                    });
                    rowHtml += '</tr>';
                    tbody.insertAdjacentHTML('beforeend', rowHtml);
                });
            }
        } catch(e) {
            console.error("Error loading roles", e);
        }
    }

    if (btnSaveRoles) {
        btnSaveRoles.addEventListener('click', async () => {
            const originalText = btnSaveRoles.innerHTML;
            btnSaveRoles.innerHTML = '<span class="material-symbols-outlined loading-spinner">autorenew</span> Saving...';
            btnSaveRoles.disabled = true;

            try {
                const rolesMap = {};
                document.querySelectorAll('.role-perm-checkbox').forEach(cb => {
                    const rId = cb.getAttribute('data-role-id');
                    const pId = parseInt(cb.getAttribute('data-perm-id'));
                    if (!rolesMap[rId]) rolesMap[rId] = [];
                    if (cb.checked || cb.disabled) { 
                        rolesMap[rId].push(pId);
                    }
                });

                for (const [rId, pIds] of Object.entries(rolesMap)) {
                    await apiFetch('api/roles.php?action=update', 'POST', { role_id: rId, permission_ids: [...new Set(pIds)] });
                }
                
                Toast.show('Roles updated successfully', 'success');
            } catch(e) {
                Toast.show('Failed to update roles', 'error');
            }
            
            btnSaveRoles.innerHTML = originalText;
            btnSaveRoles.disabled = false;
        });
    }

    // Add User Modal
    const btnAddUser = document.getElementById('btn-add-user');
    const addUserModal = document.getElementById('add-user-modal');
    const btnCloseAddUser = document.getElementById('btn-close-add-user');
    const addUserForm = document.getElementById('add-user-form');
    const addUserRoleSelect = document.getElementById('add-user-role');

    if (btnAddUser) {
        btnAddUser.addEventListener('click', () => {
            addUserRoleSelect.innerHTML = `<option value="">(No Role)</option>` + rolesData.map(r => 
                `<option value="${r.id}">${r.name}</option>`
            ).join('');
            document.getElementById('add-user-username').value = '';
            document.getElementById('add-user-display').value = '';
            document.getElementById('add-user-password').value = '';
            addUserModal.classList.remove('hidden');
        });
    }

    if (btnCloseAddUser) {
        btnCloseAddUser.addEventListener('click', () => {
            addUserModal.classList.add('hidden');
        });
    }

    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('add-user-username').value;
            const display_name = document.getElementById('add-user-display').value;
            const password = document.getElementById('add-user-password').value;
            const role_id = addUserRoleSelect.value;
            
            try {
                const result = await apiFetch('api/users.php?action=add_user', 'POST', {
                    username, display_name, password, role_id
                });
                if (result.success) {
                    Toast.show('User added successfully', 'success');
                    addUserModal.classList.add('hidden');
                    loadUsers();
                } else {
                    Toast.show(result.error || 'Failed to add user', 'error');
                }
            } catch (err) {
                Toast.show('An error occurred', 'error');
            }
        });
    }

    // Admin Change User Password Modal
    const adminChangePasswordModal = document.getElementById('admin-change-password-modal');
    const btnCloseAdminChangePassword = document.getElementById('btn-close-admin-change-password');
    const adminChangePasswordForm = document.getElementById('admin-change-password-form');

    if (btnCloseAdminChangePassword) {
        btnCloseAdminChangePassword.addEventListener('click', () => {
            adminChangePasswordModal.classList.add('hidden');
        });
    }

    if (adminChangePasswordForm) {
        adminChangePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user_id = document.getElementById('change-password-user-id').value;
            const new_password = document.getElementById('admin-new-password').value;
            const confirm_password = document.getElementById('admin-confirm-password').value;

            if (new_password !== confirm_password) {
                Toast.show('Passwords do not match', 'error');
                return;
            }

            try {
                const result = await apiFetch('api/users.php?action=change_user_password', 'POST', {
                    user_id, new_password
                });
                if (result.success) {
                    Toast.show('Password updated successfully', 'success');
                    adminChangePasswordModal.classList.add('hidden');
                } else {
                    Toast.show(result.error || 'Failed to update password', 'error');
                }
            } catch (err) {
                Toast.show('An error occurred', 'error');
            }
        });
    }

    // expose loadUsers and loadRolesMatrix for the checkAuth scope workaround if needed
    window.loadUsers = loadUsers;
    window.loadRolesMatrix = loadRolesMatrix;

    checkAuth();
});

// Add spin animation to document for the autorenew icon
const style = document.createElement('style');
style.textContent = `
    @keyframes spin { 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(style);




// js/programme_admin.js
document.addEventListener('DOMContentLoaded', () => {
    let progConfig = { uniforms: [], activity_types: [], classifications: [], parade_nights: [], ranks: [], staff: [] };

    const btnSave = document.getElementById('btn-save-programme');
    const renameDialog = createProgrammeRenameDialog({
        dialogEl: document.getElementById('programme-rename-dialog'),
        apiFetchFn: apiFetch
    });

    /**
     * Persists the current programme configuration to the backend.
     */
    async function saveConfig() {
        await apiFetch('api/programme.php?action=config', 'POST', progConfig);
    }

    /**
     * Formats and displays a success Toast after saving a rename/promotion.
     *
     * @param {string} label - The new display label.
     * @param {boolean} updateUpcoming - Whether upcoming parade nights were requested to update.
     * @param {number} updatedNights - Count of updated upcoming parade nights.
     */
    function showRenameSuccessToast(label, updateUpcoming, updatedNights) {
        if (updateUpcoming && updatedNights > 0) {
            const nightWord = updatedNights === 1 ? 'night' : 'nights';
            Toast.show(`Updated to "${label}" and updated ${updatedNights} upcoming parade ${nightWord}.`, 'success');
        } else {
            Toast.show(`Updated to "${label}".`, 'success');
        }
    }

    /**
     * Confirms a config-backed item rename via dialog, saves programme_config, and optionally
     * propagates the rename to upcoming parade nights. Reverts local state if saving fails.
     *
     * @param {Object} params
     * @returns {Promise<boolean>} True if saved, false if cancelled or failed.
     */
    async function confirmAndApplyConfigRename({
        title,
        entityType,
        oldDisplay,
        newDisplay,
        oldRank = '',
        newRank = '',
        swatchColor = '',
        applyLocal,
        revertLocal,
        rerender
    }) {
        const { confirmed, updateUpcoming } = await renameDialog.confirmRename({
            title,
            entityType,
            oldDisplay,
            newDisplay,
            oldRank,
            newRank,
            swatchColor
        });

        if (!confirmed) return false;

        applyLocal();
        if (rerender) rerender();

        try {
            await saveConfig();
            let updatedNights = 0;
            if (updateUpcoming) {
                const prop = await apiFetch('api/programme.php?action=rename_references', 'POST', {
                    type: entityType,
                    old_value: oldDisplay,
                    new_value: newDisplay
                });
                updatedNights = Number(prop?.updated_nights || 0);
            }
            showRenameSuccessToast(newDisplay, updateUpcoming, updatedNights);
            return true;
        } catch (e) {
            console.error('Failed to save programme edit', e);
            revertLocal();
            if (rerender) rerender();
            return false;
        }
    }

    // --- Uniforms ---
    function renderUniforms() {
        renderList('uniforms-list', progConfig.uniforms, {
            renderInner: (u) => `
                <div class="edit-color color-swatch" style="background-color: ${escapeHtml(u.color)};"></div>
                ${renderEditableTextButton(u.name, {
                    className: 'edit-text',
                    title: 'Click to rename uniform',
                    ariaLabel: `Rename uniform ${u.name}`
                })}
            `,
            bindEvents: (div, u) => {
                bindEditableTextButton(div, '.edit-text', {
                    inputLabel: `Rename uniform ${u.name}`,
                    onCommit: async (newVal) => {
                        const oldName = u.name;
                        await confirmAndApplyConfigRename({
                            title: 'Rename Uniform',
                            entityType: 'uniform',
                            oldDisplay: oldName,
                            newDisplay: newVal,
                            swatchColor: u.color,
                            applyLocal: () => { u.name = newVal; },
                            revertLocal: () => { u.name = oldName; },
                            rerender: renderUniforms
                        });
                    }
                });
                editableColorBinding(div, '.edit-color', (newVal) => { u.color = newVal; renderUniforms(); });
            },
            onRemove: (i) => { progConfig.uniforms.splice(i, 1); renderUniforms(); },
            onReorder: (newArr) => { progConfig.uniforms = newArr; renderUniforms(); }
        });
    }

    document.getElementById('btn-add-uniform').addEventListener('click', () => {
        const name = document.getElementById('new-uniform-name').value.trim();
        const color = document.getElementById('new-uniform-color').value;
        if (name) {
            if (!progConfig.uniforms) progConfig.uniforms = [];
            progConfig.uniforms.push({ name, color });
            document.getElementById('new-uniform-name').value = '';
            renderUniforms();
        }
    });

    // --- Activities ---
    function renderActivityTypes() {
        renderList('activity-list', progConfig.activity_types, {
            renderInner: (a) => `
                <div class="edit-color color-swatch" style="background-color: ${escapeHtml(a.color)};"></div>
                ${renderEditableTextButton(a.name, {
                    className: 'edit-text',
                    title: 'Click to rename activity type',
                    ariaLabel: `Rename activity type ${a.name}`
                })}
            `,
            bindEvents: (div, a) => {
                bindEditableTextButton(div, '.edit-text', {
                    inputLabel: `Rename activity type ${a.name}`,
                    onCommit: async (newVal) => {
                        const oldName = a.name;
                        await confirmAndApplyConfigRename({
                            title: 'Rename Activity Type',
                            entityType: 'activity_type',
                            oldDisplay: oldName,
                            newDisplay: newVal,
                            swatchColor: a.color,
                            applyLocal: () => { a.name = newVal; },
                            revertLocal: () => { a.name = oldName; },
                            rerender: renderActivityTypes
                        });
                    }
                });
                editableColorBinding(div, '.edit-color', (newVal) => { a.color = newVal; renderActivityTypes(); });
            },
            onRemove: (i) => { progConfig.activity_types.splice(i, 1); renderActivityTypes(); },
            onReorder: (newArr) => { progConfig.activity_types = newArr; renderActivityTypes(); }
        });
    }

    document.getElementById('btn-add-activity').addEventListener('click', () => {
        const name = document.getElementById('new-activity-name').value.trim();
        const color = document.getElementById('new-activity-color').value;
        if (name) {
            if (!progConfig.activity_types) progConfig.activity_types = [];
            progConfig.activity_types.push({ name, color });
            document.getElementById('new-activity-name').value = '';
            renderActivityTypes();
        }
    });

    // --- Classifications ---
    function renderClassifications() {
        renderList('classifications-list', progConfig.classifications, {
            renderInner: (c) => renderEditableTextButton(c, {
                className: 'edit-text',
                title: 'Click to rename classification',
                ariaLabel: `Rename classification ${c}`
            }),
            bindEvents: (div, c, i) => {
                bindEditableTextButton(div, '.edit-text', {
                    inputLabel: `Rename classification ${c}`,
                    onCommit: async (newVal) => {
                        const duplicate = progConfig.classifications.some((existing, idx) => idx !== i && existing === newVal);
                        if (duplicate) {
                            Toast.show(`Classification "${newVal}" already exists.`, 'error');
                            return;
                        }
                        const oldName = progConfig.classifications[i];
                        await confirmAndApplyConfigRename({
                            title: 'Rename Classification',
                            entityType: 'classification',
                            oldDisplay: oldName,
                            newDisplay: newVal,
                            applyLocal: () => { progConfig.classifications[i] = newVal; },
                            revertLocal: () => { progConfig.classifications[i] = oldName; },
                            rerender: renderClassifications
                        });
                    }
                });
            },
            onRemove: (i) => { progConfig.classifications.splice(i, 1); renderClassifications(); },
            onReorder: (newArr) => { progConfig.classifications = newArr; renderClassifications(); }
        });
    }

    document.getElementById('btn-add-classification').addEventListener('click', () => {
        const cls = document.getElementById('new-classification-name').value.trim();
        if (cls) {
            if (!progConfig.classifications) progConfig.classifications = [];
            progConfig.classifications.push(cls);
            document.getElementById('new-classification-name').value = '';
            renderClassifications();
        }
    });

    // --- Parade Nights ---
    function renderParadeNights() {
        const container = document.getElementById('parade-nights-list');
        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.gap = 'var(--space-sm)';

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (!progConfig.parade_nights) progConfig.parade_nights = [];

        days.forEach(day => {
            const isActive = progConfig.parade_nights.includes(day);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn';
            btn.style.borderRadius = '50px';
            btn.style.padding = '0.5rem 1rem';
            btn.style.transition = 'all 0.2s ease';

            if (isActive) {
                btn.style.background = 'var(--color-primary)';
                btn.style.color = '#fff';
                btn.style.border = '1px solid var(--color-primary)';
            } else {
                btn.style.background = '#f0f0f0';
                btn.style.color = 'var(--color-text)';
                btn.style.border = '1px solid #ccc';
            }

            btn.innerHTML = `<span style="font-weight: 500;">${day}</span>`;

            btn.addEventListener('click', async () => {
                const previousDays = [...progConfig.parade_nights];
                if (progConfig.parade_nights.includes(day)) {
                    progConfig.parade_nights = progConfig.parade_nights.filter(d => d !== day);
                } else {
                    progConfig.parade_nights.push(day);
                }

                // Sort array to keep chronological order
                progConfig.parade_nights.sort((a, b) => days.indexOf(a) - days.indexOf(b));
                renderParadeNights();

                try {
                    await saveConfig();
                } catch (e) {
                    progConfig.parade_nights = previousDays;
                    renderParadeNights();
                }
            });

            container.appendChild(btn);
        });
    }

    // --- Main ---
    async function loadConfig() {
        try {
            const data = await apiFetch('api/programme.php?action=config');
            if (data) progConfig = data;
        } catch (e) {
            console.error('Failed to load programme config');
        }
        renderUniforms();
        renderActivityTypes();
        renderClassifications();
        renderParadeNights();

        // Instantiate Staff Manager
        new PersonnelManager({
            containerId: 'staff-manager-container',
            title: 'Manage Staff',
            ranks: (progConfig.ranks && progConfig.ranks.length > 0) ? progConfig.ranks : DEFAULT_STAFF_RANKS,
            renderListFn: renderList,
            loadFn: async () => progConfig.staff || [],
            addFn: async (name, rank) => {
                if (!progConfig.staff) progConfig.staff = [];
                progConfig.staff.push({ name, rank });
            },
            editFn: async (item, name, rank) => {
                const oldName = item.name;
                const oldRank = item.rank;
                const oldDisplay = formatPersonnelName(oldRank, oldName);
                const newDisplay = formatPersonnelName(rank, name);
                if (oldDisplay === newDisplay) return false;

                return confirmAndApplyConfigRename({
                    title: 'Update Staff Member',
                    entityType: 'staff',
                    oldDisplay,
                    newDisplay,
                    oldRank,
                    newRank: rank,
                    applyLocal: () => {
                        item.name = name;
                        item.rank = rank;
                    },
                    revertLocal: () => {
                        item.name = oldName;
                        item.rank = oldRank;
                    }
                });
            },
            deleteFn: async (item, i) => {
                progConfig.staff.splice(i, 1);
            },
            reorderFn: async (newArr) => {
                progConfig.staff = newArr;
            }
        });

        // Instantiate NCO Manager
        new PersonnelManager({
            containerId: 'nco-manager-container',
            title: 'Manage Duty NCOs',
            ranks: ['Cpl', 'Sgt', 'FS', 'CWO'],
            renderListFn: renderList,
            loadFn: async () => await apiFetch('api/ncos.php'),
            addFn: async (name, rank) => {
                await apiFetch('api/ncos.php', 'POST', { name, rank });
            },
            editFn: async (item, name, rank) => {
                const oldDisplay = formatPersonnelName(item.rank, item.name);
                const newDisplay = formatPersonnelName(rank, name);
                if (oldDisplay === newDisplay) return false;

                const { confirmed, updateUpcoming } = await renameDialog.confirmRename({
                    title: 'Update NCO',
                    entityType: 'nco',
                    oldDisplay,
                    newDisplay,
                    oldRank: item.rank,
                    newRank: rank
                });

                if (!confirmed) return false;

                const res = await apiFetch('api/ncos.php', 'PUT', {
                    id: item.id,
                    name,
                    rank,
                    update_upcoming: updateUpcoming
                });
                showRenameSuccessToast(newDisplay, updateUpcoming, Number(res?.updated_nights || 0));
                return true;
            },
            deleteFn: async (item) => {
                await apiFetch('api/ncos.php', 'DELETE', { id: item.id });
            },
            reorderFn: async (newArr) => {
                const orderedIds = newArr.map(nco => nco.id);
                await apiFetch('api/ncos.php?action=reorder', 'POST', { ordered_ids: orderedIds });
            }
        });
    }

    btnSave.addEventListener('click', async () => {
        const originalText = btnSave.innerHTML;
        btnSave.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 2s linear infinite;">autorenew</span> Saving...';
        btnSave.disabled = true;

        try {
            await saveConfig();

            btnSave.innerHTML = '<span class="material-symbols-outlined mr-sm">check</span> Saved!';
            btnSave.style.background = 'rgba(0, 200, 100, 0.6)';
            setTimeout(() => {
                btnSave.innerHTML = originalText;
                btnSave.style.background = '';
                btnSave.disabled = false;
            }, 2000);
        } catch (e) {
            console.error(e);
            btnSave.innerHTML = 'Error saving';
            setTimeout(() => {
                btnSave.innerHTML = originalText;
                btnSave.disabled = false;
            }, 2000);
        }
    });

    const checkLoginInterval = setInterval(() => {
        const adminSection = document.getElementById('admin-section');
        if (adminSection && !adminSection.classList.contains('hidden')) {
            clearInterval(checkLoginInterval);
            loadConfig();
        }
    }, 500);

});