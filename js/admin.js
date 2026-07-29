import { apiFetch } from "./api.js";
import { Auth } from "./auth.js";
import { Toast } from "./components/Toast.js";
import { Pagination } from "./components/Pagination.js";
import { setupDragAndDrop } from "./utils/dragDrop.js";


// js/admin.js

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
        if (content) content.classList.remove('hidden');
        
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
        
        document.getElementById('metadata-image-id').value = img.id;
        document.getElementById('metadata-image-preview').src = img.url;
        document.getElementById('metadata-title').value = img.title || '';
        document.getElementById('metadata-description').value = img.description || '';
        
        currentTags = img.tags ? [...img.tags] : [];
        renderTags();
        metadataModal.classList.remove('hidden');
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

    document.getElementById('btn-close-metadata')?.addEventListener('click', () => {
        metadataModal.classList.add('hidden');
    });
    
    metadataForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('metadata-image-id').value;
        const title = document.getElementById('metadata-title').value;
        const description = document.getElementById('metadata-description').value;
        
        const data = await apiFetch('api/images.php?action=update_metadata', 'POST', {id, title, description, tags: currentTags});
        
        if (data.success) {
            metadataModal.classList.add('hidden');
            loadAdminGallery(adminPagination.currentPage);
            loadTags(); // refresh available tags
        }
    });
    
    // Tag Input Logic
    const tagInput = document.getElementById('tag-input');
    const tagsContainer = document.getElementById('tags-container');
    const tagAutocomplete = document.getElementById('tag-autocomplete');
    
    function renderTags() {
        // Remove existing pills, keep the input
        Array.from(tagsContainer.querySelectorAll('.tag-pill')).forEach(e => e.remove());
        currentTags.forEach(tag => {
            const pill = document.createElement('span');
            pill.className = 'tag-pill';
            pill.innerHTML = `${tag} <span class="remove-tag" data-action="removeTag" data-tag="${tag}">&times;</span>`;
            tagsContainer.insertBefore(pill, tagInput);
        });
    }
    
    const removeTag = (tagToRemove) => {
        currentTags = currentTags.filter(t => t !== tagToRemove);
        renderTags();
    };
    
    tagInput.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            const val = tagInput.value.trim().toLowerCase();
            if (val && !currentTags.includes(val)) {
                currentTags.push(val);
                tagInput.value = '';
                renderTags();
                tagAutocomplete.classList.add('hidden');
            }
        } else if (e.key === 'Backspace' && tagInput.value === '' && currentTags.length > 0) {
            currentTags.pop();
            renderTags();
        }
    });
    
    tagInput.addEventListener('input', () => {
        const val = tagInput.value.trim().toLowerCase();
        if (!val) {
            tagAutocomplete.classList.add('hidden');
            return;
        }
        
        const matches = allAvailableTags.filter(t => t.toLowerCase().includes(val) && !currentTags.includes(t));
        if (matches.length > 0) {
            tagAutocomplete.innerHTML = matches.map(t => `<div class="autocomplete-item" data-action="selectTag" data-tag="${t}">${t}</div>`).join('');
            tagAutocomplete.classList.remove('hidden');
        } else {
            tagAutocomplete.classList.add('hidden');
        }
    });
    
    const selectAutocompleteTag = (tag) => {
        if (!currentTags.includes(tag)) {
            currentTags.push(tag);
        }
        tagInput.value = '';
        renderTags();
        tagAutocomplete.classList.add('hidden');
        tagInput.focus();
    };
    
    // Close autocomplete on click outside and handle tag clicks
    document.addEventListener('click', (e) => {
        if (!tagInput.contains(e.target) && !tagAutocomplete.contains(e.target)) {
            tagAutocomplete.classList.add('hidden');
        }
        const target = e.target.closest('[data-action]');
        if (target) {
            const action = target.getAttribute('data-action');
            if (action === 'removeTag') removeTag(target.getAttribute('data-tag'));
            else if (action === 'selectTag') selectAutocompleteTag(target.getAttribute('data-tag'));
            else if (action === 'removeUploadTag') removeUploadTag(parseInt(target.getAttribute('data-idx')));
            else if (action === 'selectUploadTag') selectUploadAutocompleteTag(target.getAttribute('data-tag'));
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
    const uploadModal = document.getElementById('image-upload-modal');
    const uploadForm = document.getElementById('upload-form');
    const btnOpenUploadModal = document.getElementById('btn-open-upload-modal'); // slide form
    const btnOpenGalleryUploadModal = document.getElementById('btn-open-gallery-upload-modal'); // gallery
    const btnCloseUpload = document.getElementById('btn-close-upload');
    const uploadFileInput = document.getElementById('upload-file');
    const uploadPreview = document.getElementById('upload-image-preview');
    
    // Upload tags
    const uploadTagsContainer = document.getElementById('upload-tags-container');
    const uploadTagInput = document.getElementById('upload-tag-input');
    const uploadTagAutocomplete = document.getElementById('upload-tag-autocomplete');
    let uploadTags = [];

    function renderUploadTags() {
        const existingTags = uploadTagsContainer.querySelectorAll('.tag');
        existingTags.forEach(t => t.remove());
        
        uploadTags.forEach((tag, idx) => {
            const tagEl = document.createElement('div');
            tagEl.className = 'tag';
            tagEl.innerHTML = `${tag} <span class="tag-remove" data-action="removeUploadTag" data-idx="${idx}">&times;</span>`;
            uploadTagsContainer.insertBefore(tagEl, uploadTagInput);
        });
    }

    const removeUploadTag = (idx) => {
        uploadTags.splice(idx, 1);
        renderUploadTags();
    };

    uploadTagInput.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            const val = uploadTagInput.value.trim().toLowerCase();
            if (val && !uploadTags.includes(val)) {
                uploadTags.push(val);
                uploadTagInput.value = '';
                renderUploadTags();
                uploadTagAutocomplete.classList.add('hidden');
            }
        } else if (e.key === 'Backspace' && uploadTagInput.value === '' && uploadTags.length > 0) {
            uploadTags.pop();
            renderUploadTags();
        }
    });

    uploadTagInput.addEventListener('input', () => {
        const val = uploadTagInput.value.trim().toLowerCase();
        if (!val) {
            uploadTagAutocomplete.classList.add('hidden');
            return;
        }
        
        const matches = allAvailableTags.filter(t => t.toLowerCase().includes(val) && !uploadTags.includes(t));
        if (matches.length > 0) {
            uploadTagAutocomplete.innerHTML = matches.map(t => `<div class="autocomplete-item" data-action="selectUploadTag" data-tag="${t}">${t}</div>`).join('');
            uploadTagAutocomplete.classList.remove('hidden');
        } else {
            uploadTagAutocomplete.classList.add('hidden');
        }
    });

    const selectUploadAutocompleteTag = (tag) => {
        if (!uploadTags.includes(tag)) {
            uploadTags.push(tag);
        }
        uploadTagInput.value = '';
        renderUploadTags();
        uploadTagAutocomplete.classList.add('hidden');
        uploadTagInput.focus();
    };

    document.addEventListener('click', (e) => {
        if (!uploadTagInput.contains(e.target) && !uploadTagAutocomplete.contains(e.target)) {
            uploadTagAutocomplete.classList.add('hidden');
        }
    });

    function openUploadModal() {
        uploadForm.reset();
        uploadPreview.src = '';
        uploadPreview.classList.add('hidden');
        uploadTags = [];
        renderUploadTags();
        uploadModal.classList.remove('hidden');
    }

    if (btnOpenUploadModal) btnOpenUploadModal.addEventListener('click', openUploadModal);
    if (btnOpenGalleryUploadModal) btnOpenGalleryUploadModal.addEventListener('click', openUploadModal);
    
    btnCloseUpload.addEventListener('click', () => {
        uploadModal.classList.add('hidden');
    });

    uploadFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadPreview.src = URL.createObjectURL(file);
            uploadPreview.classList.remove('hidden');
        } else {
            uploadPreview.src = '';
            uploadPreview.classList.add('hidden');
        }
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="material-symbols-outlined loading-spinner">autorenew</span> Uploading...';
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('image_file', uploadFileInput.files[0]);
        formData.append('title', document.getElementById('upload-title').value);
        formData.append('description', document.getElementById('upload-description').value);
        formData.append('tags', JSON.stringify(uploadTags));

        try {
            const res = await apiFetch('api/images.php?action=upload', 'POST', formData);
            const data = await res.json();
            if (data.success) {
                uploadModal.classList.add('hidden');
                
                // Refresh gallery if on gallery tab
                loadAdminGallery(1);
                
                // Automatically select this in the slide creator
                const slideImageUrl = document.getElementById('slide-image-url');
                const slideImagePreview = document.getElementById('current-image-preview');
                if (slideImageUrl && slideImagePreview) {
                    slideImageUrl.value = data.url;
                    slideImagePreview.src = data.url;
                    slideImagePreview.classList.remove('hidden');
                }
            } else {
                Toast.show('Upload failed: ' + data.message, 'error');
            }
        } catch (err) {
            Toast.show('Upload error', 'error');
        }
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });

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
    
    async function loadMenuOrderSettings() {
        try {
            currentMenuOrder = await apiFetch('api/settings.php?action=menu_order');
            renderMenuOrderManager();
        } catch (e) {
            console.error('Failed to load menu order settings', e);
        }
    }

    function renderMenuOrderManager() {
        const container = document.getElementById('menu-order-manager-container');
        if (!container) return;
        
        container.innerHTML = '';
        currentMenuOrder.forEach((page, index) => {
            const pageNames = {
                'home.php': 'Home',
                'programme.php': 'Programme',
                'index.php': 'Slideshow (Display Board)',
                'documents.php': 'Documents'
            };
            
            const div = document.createElement('div');
            div.className = 'admin-table flex-row justify-between align-center p-sm mb-xs cursor-move bg-card-bg';
            div.style.border = '1px solid var(--border-color)';
            div.style.borderRadius = 'var(--radius-md)';
            div.draggable = true;
            div.dataset.index = index;
            div.dataset.page = page;
            
            div.innerHTML = `
                <div class="flex-row align-center">
                    <span class="material-symbols-outlined mr-sm text-secondary">drag_indicator</span>
                    <span class="font-bold">${pageNames[page] || page}</span>
                </div>
            `;
            
            // Drag events
            div.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index);
                setTimeout(() => div.style.opacity = '0.5', 0);
            });
            div.addEventListener('dragend', () => {
                div.style.opacity = '1';
                document.querySelectorAll('#menu-order-manager-container > div').forEach(el => {
                    el.style.borderTop = '1px solid var(--border-color)';
                    el.style.borderBottom = '1px solid var(--border-color)';
                });
                renderMenuOrderManager(); // Re-render to clear any lingering styles
            });
            div.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                div.style.borderTop = '2px solid var(--accent-color)';
            });
            div.addEventListener('dragleave', () => {
                div.style.borderTop = '1px solid var(--border-color)';
            });
            div.addEventListener('drop', (e) => {
                e.preventDefault();
                div.style.borderTop = '1px solid var(--border-color)';
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = index;
                
                if (fromIndex !== toIndex && !isNaN(fromIndex)) {
                    const item = currentMenuOrder.splice(fromIndex, 1)[0];
                    currentMenuOrder.splice(toIndex, 0, item);
                    renderMenuOrderManager();
                }
            });
            
            container.appendChild(div);
        });
    }

    document.getElementById('btn-save-menu-order')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-save-menu-order');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined loading-spinner">autorenew</span> Saving...';
        btn.disabled = true;

        try {
            await apiFetch('api/settings.php?action=menu_order', 'POST', currentMenuOrder);
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

    // Rank SVGs mapping
    const rankSvgMap = {
        'Cdt': 'cdt.svg', 'Cpl': 'cpl.svg', 'Sgt': 'sgt.svg', 'FSgt': 'fsgt.svg',
        'FS': 'fsgt.svg', 'CWO': 'cwo.svg', 'CI': 'ci.svg', 'Plt Off': 'plt_off.svg',
        'Fg Off': 'fg_off.svg', 'Flt Lt': 'flt_lt.svg', 'Sqn Ldr': 'sqn_ldr.svg',
        'Wg Cdr': 'wg_cdr.svg', 'WO': 'wo.svg'
    };
    function getRankSvg(rank) {
        return rankSvgMap[rank] ? `images/ranks/${rankSvgMap[rank]}` : `images/ranks/cdt.svg`;
    }

    const btnSave = document.getElementById('btn-save-programme');

    // Subtabs logic
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subTabContents = document.querySelectorAll('.sub-tab-content');

    function switchSubTab(targetId) {
        subTabContents.forEach(c => c.classList.add('hidden'));
        subTabBtns.forEach(b => b.classList.remove('active'));
        document.getElementById(targetId).classList.remove('hidden');
        document.querySelector(`.sub-tab-btn[data-subtarget="${targetId}"]`).classList.add('active');

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
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('subtab')) {
        const target = `subtab-${urlParams.get('subtab')}`;
        if (document.getElementById(target)) switchSubTab(target);
    }

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
            div.style.cursor = 'grab';

            // Start common HTML
            let html = `<div class="flex-row align-center flex-1 gap-sm">
                        <span class="material-symbols-outlined drag-handle">drag_indicator</span>`;

            html += config.renderInner(item, i);

            html += `</div>`;

            if (!config.hideRemove) {
                html += `<button class="btn btn-remove btn-remove-item" data-index="${i}" title="Remove"><span class="material-symbols-outlined">delete</span></button>`;
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

    function editableTextBinding(el, selector, onSave) {
        const span = el.querySelector(selector);
        if(!span) return;
        span.style.cursor = 'pointer';
        span.title = 'Click to edit';
        span.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = span.textContent;
            input.style.padding = '2px 5px';
            input.style.fontSize = 'inherit';
            input.style.fontFamily = 'inherit';

            const save = () => {
                if (input.value.trim() && input.value !== span.textContent) {
                    onSave(input.value.trim());
                } else {
                    span.style.display = '';
                    input.remove();
                }
            };

            input.addEventListener('blur', save);
            input.addEventListener('keypress', (e) => { if(e.key === 'Enter') input.blur(); });

            span.style.display = 'none';
            span.parentNode.insertBefore(input, span.nextSibling);
            input.focus();
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

    // --- Uniforms ---
    function renderUniforms() {
        renderList('uniforms-list', progConfig.uniforms, {
            renderInner: (u, i) => `
                <div class="edit-color color-swatch" style="background-color: ${u.color};"></div>
                <span class="edit-text">${u.name}</span>
            `,
            bindEvents: (div, u, i) => {
                editableTextBinding(div, '.edit-text', (newVal) => { u.name = newVal; renderUniforms(); });
                editableColorBinding(div, '.edit-color', (newVal) => { u.color = newVal; renderUniforms(); });
            },
            onRemove: (i) => { progConfig.uniforms.splice(i, 1); renderUniforms(); },
            onReorder: (newArr) => { progConfig.uniforms = newArr; renderUniforms(); }
        });
    }

    document.getElementById('btn-add-uniform').addEventListener('click', () => {
        const name = document.getElementById('new-uniform-name').value.trim();
        const color = document.getElementById('new-uniform-color').value;
        if(name) {
            if(!progConfig.uniforms) progConfig.uniforms = [];
            progConfig.uniforms.push({name, color});
            document.getElementById('new-uniform-name').value = '';
            renderUniforms();
        }
    });

    // --- Activities ---
    function renderActivityTypes() {
        renderList('activity-list', progConfig.activity_types, {
            renderInner: (a, i) => `
                <div class="edit-color color-swatch" style="background-color: ${a.color};"></div>
                <span class="edit-text">${a.name}</span>
            `,
            bindEvents: (div, a, i) => {
                editableTextBinding(div, '.edit-text', (newVal) => { a.name = newVal; renderActivityTypes(); });
                editableColorBinding(div, '.edit-color', (newVal) => { a.color = newVal; renderActivityTypes(); });
            },
            onRemove: (i) => { progConfig.activity_types.splice(i, 1); renderActivityTypes(); },
            onReorder: (newArr) => { progConfig.activity_types = newArr; renderActivityTypes(); }
        });
    }

    document.getElementById('btn-add-activity').addEventListener('click', () => {
        const name = document.getElementById('new-activity-name').value.trim();
        const color = document.getElementById('new-activity-color').value;
        if(name) {
            if(!progConfig.activity_types) progConfig.activity_types = [];
            progConfig.activity_types.push({name, color});
            document.getElementById('new-activity-name').value = '';
            renderActivityTypes();
        }
    });

    // --- Classifications ---
    function renderClassifications() {
        renderList('classifications-list', progConfig.classifications, {
            renderInner: (c, i) => `<span class="edit-text">${c}</span>`,
            bindEvents: (div, c, i) => {
                editableTextBinding(div, '.edit-text', (newVal) => { progConfig.classifications[i] = newVal; renderClassifications(); });
            },
            onRemove: (i) => { progConfig.classifications.splice(i, 1); renderClassifications(); },
            onReorder: (newArr) => { progConfig.classifications = newArr; renderClassifications(); }
        });
    }

    document.getElementById('btn-add-classification').addEventListener('click', () => {
        const cls = document.getElementById('new-classification-name').value.trim();
        if(cls) {
            if(!progConfig.classifications) progConfig.classifications = [];
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

            btn.addEventListener('click', () => {
                if (progConfig.parade_nights.includes(day)) {
                    progConfig.parade_nights = progConfig.parade_nights.filter(d => d !== day);
                } else {
                    progConfig.parade_nights.push(day);
                }

                // Sort array to keep chronological order
                progConfig.parade_nights.sort((a, b) => days.indexOf(a) - days.indexOf(b));

                saveConfig();
                renderParadeNights();
            });

            container.appendChild(btn);
        });
    }

    // --- Staff ---
    class PersonnelManager {
        constructor(config) {
            this.containerId = config.containerId;
            this.title = config.title;
            this.ranks = config.ranks || [];
            this.loadFn = config.loadFn;
            this.addFn = config.addFn;
            this.editFn = config.editFn;
            this.deleteFn = config.deleteFn;
            this.reorderFn = config.reorderFn;
            this.items = [];

            // Unique IDs for popover and inputs
            this.managerId = this.containerId.replace('-container', '');
            this.popoverId = `rank-picker-${this.managerId}`;
            this.btnId = `btn-rank-${this.managerId}`;

            this.renderShell();
            this.load();
        }

        renderShell() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            container.innerHTML = `
                <h4 class="mb-sm text-muted">${this.title}</h4>
                <div id="${this.managerId}-list" class="flex-col gap-xs mb-md admin-list-container"></div>
                <div class="input-group input-group-adjacent" style="position: relative;">
                    <button class="btn admin-input-btn-h w-auto" type="button" id="${this.btnId}" popovertarget="${this.popoverId}" style="anchor-name: --${this.btnId};">
                        <img src="" id="${this.managerId}-rank-display" class="admin-rank-preview hidden">
                        <span id="${this.managerId}-rank-text">Select Rank</span>
                    </button>
                    <input type="hidden" id="${this.managerId}-new-rank">

                    <div id="${this.popoverId}" popover class="rank-picker-popover" style="position-anchor: --${this.btnId};">
                        <h4 class="mt-0">Select Rank</h4>
                        <div class="icon-grid" id="${this.managerId}-rank-grid">
                            <!-- Populated dynamically -->
                        </div>
                    </div>

                    <input type="text" id="${this.managerId}-new-name" placeholder="Name (e.g. Smith)" class="flex-grow-1">
                    <button class="btn btn-icon w-auto" type="button" id="${this.managerId}-btn-add"><span class="material-symbols-outlined">add</span></button>
                </div>
            `;

            this.populateRankPicker();

            const btnAdd = document.getElementById(`${this.managerId}-btn-add`);
            const nameInput = document.getElementById(`${this.managerId}-new-name`);

            const handleAdd = async () => {
                const name = nameInput.value.trim();
                const rank = document.getElementById(`${this.managerId}-new-rank`).value;
                if (name && rank) {
                    await this.addFn(name, rank);
                    nameInput.value = '';
                    document.getElementById(`${this.managerId}-new-rank`).value = '';
                    document.getElementById(`${this.managerId}-rank-text`).style.display = 'inline';
                    document.getElementById(`${this.managerId}-rank-display`).style.display = 'none';
                    this.load();
                } else {
                    if (typeof Toast !== 'undefined') Toast.show('Please select a rank and enter a name.', 'error');
                }
            };

            btnAdd.addEventListener('click', handleAdd);
            nameInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') handleAdd();
            });
        }

        populateRankPicker() {
            const grid = document.getElementById(`${this.managerId}-rank-grid`);
            grid.innerHTML = '';
            this.ranks.forEach(r => {
                const label = document.createElement('label');
                label.style.display = 'flex';
                label.style.flexDirection = 'column';
                label.style.alignItems = 'center';
                label.style.cursor = 'pointer';
                label.style.padding = '5px';
                label.style.border = '1px solid transparent';
                label.style.borderRadius = '4px';

                label.innerHTML = `
                    <input type="radio" name="${this.managerId}_rank_select" value="${r}" class="hidden">
                    <img src="${getRankSvg(r)}" class="rank-svg-lg">
                    <span class="text-sm text-center">${r}</span>
                `;

                label.querySelector('input').addEventListener('change', () => {
                    document.getElementById(`${this.managerId}-new-rank`).value = r;
                    document.getElementById(`${this.managerId}-rank-text`).style.display = 'none';
                    const img = document.getElementById(`${this.managerId}-rank-display`);
                    img.src = getRankSvg(r);
                    img.style.display = 'block';
                    document.getElementById(this.popoverId).hidePopover();
                });

                grid.appendChild(label);
            });
        }

        async load() {
            this.items = await this.loadFn();
            this.renderList();
        }

        renderList() {
            renderList(`${this.managerId}-list`, this.items, {
                renderInner: (item, i) => `
                    <img src="${getRankSvg(item.rank)}" class="rank-svg-sm">
                    <span class="edit-text-rank clickable-rank" title="Click to change rank">${item.rank}</span>
                    <span class="edit-text-name">${item.name}</span>
                `,
                bindEvents: (div, item, i) => {
                    editableTextBinding(div, '.edit-text-name', async (newVal) => {
                        await this.editFn(item, newVal, item.rank);
                        this.load();
                    });
                    editableTextBinding(div, '.edit-text-rank', async (newVal) => {
                        await this.editFn(item, item.name, newVal);
                        this.load();
                    });
                },
                onRemove: async (i) => {
                    const item = this.items[i];
                    if(confirm(`Remove ${item.rank} ${item.name}?`)) {
                        await this.deleteFn(item, i);
                        this.load();
                        if(typeof Toast !== 'undefined') Toast.show('Removed', 'success');
                    }
                },
                onReorder: async (newArr) => {
                    await this.reorderFn(newArr);
                    this.load();
                }
            });
        }
    }

    // --- Main ---
    async function loadConfig() {
        try {
            const data = await apiFetch('api/programme.php?action=config');
            if(data) progConfig = data;
        } catch(e) {
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
            ranks: progConfig.ranks || [],
            loadFn: async () => progConfig.staff || [],
            addFn: async (name, rank) => {
                if(!progConfig.staff) progConfig.staff = [];
                progConfig.staff.push({name, rank});
            },
            editFn: async (item, name, rank) => {
                item.name = name;
                item.rank = rank;
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
            loadFn: async () => await apiFetch('api/ncos.php'),
            addFn: async (name, rank) => {
                await apiFetch('api/ncos.php', 'POST', { name, rank });
            },
            editFn: async (item, name, rank) => {
                await apiFetch('api/ncos.php', 'PUT', { id: item.id, name, rank });
            },
            deleteFn: async (item, i) => {
                await apiFetch('api/ncos.php', 'DELETE', {id: item.id});
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
            await apiFetch('api/programme.php?action=config', 'POST', progConfig);

            btnSave.innerHTML = '<span class="material-symbols-outlined mr-sm">check</span> Saved!';
            btnSave.style.background = 'rgba(0, 200, 100, 0.6)';
            setTimeout(() => {
                btnSave.innerHTML = originalText;
                btnSave.style.background = '';
                btnSave.disabled = false;
            }, 2000);
        } catch(e) {
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
