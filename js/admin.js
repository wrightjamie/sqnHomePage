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
    const slideSetSelect = document.getElementById('slide-set-select');
    
    const createSlideForm = document.getElementById('create-slide-form');
    const slideType = document.getElementById('slide-type');
    const slideImageUrl = document.getElementById('slide-image-url');
    const slidesList = document.getElementById('slides-list');

    const toolbarOptions = [
        ['bold', 'italic'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'bullet' }]
    ];
    let quill;
    if (document.getElementById('slide-body-editor')) {
        quill = new Quill('#slide-body-editor', {
            theme: 'snow',
            modules: { toolbar: toolbarOptions }
        });
    }

    // Toggle slide input fields based on type
    slideType.addEventListener('change', () => {
        document.getElementById('slide-body-container').classList.add('hidden');
        document.getElementById('image-upload-group').classList.add('hidden');
        const qrFields = document.getElementById('qr-fields');
        if (qrFields) qrFields.classList.add('hidden');

        if (slideType.value === 'image') {
            document.getElementById('image-upload-group').classList.remove('hidden');
        } else if (slideType.value === 'qr') {
            if (qrFields) qrFields.classList.remove('hidden');
        } else {
            document.getElementById('slide-body-container').classList.remove('hidden');
        }
    });

    let currentUserPermissions = [];

    async function checkAuth() {
        try {
            const data = await fetch('api/auth.php?action=status');
            const res = await data.json();
            if (res.data && res.data.logged_in) {
                currentUserPermissions = res.data.permissions || [];
                loginSection.classList.add('hidden');
                adminSection.classList.remove('hidden');
                loadSets();
                if (window.checkUrlTab) window.checkUrlTab();

                if (currentUserPermissions.includes('manage_users')) {
                    document.getElementById('tab-btn-users').style.display = 'inline-block';
                    loadUsers();
                } else {
                    document.getElementById('tab-btn-users').style.display = 'none';
                }

                if (currentUserPermissions.includes('manage_roles')) {
                    document.getElementById('subtab-btn-roles').style.display = 'inline-block';
                    if (typeof loadRolesMatrix === 'function') loadRolesMatrix();
                } else {
                    const rolesTab = document.getElementById('subtab-btn-roles');
                    if (rolesTab) rolesTab.style.display = 'none';
                }
            } else {
                loginSection.classList.remove('hidden');
                adminSection.classList.add('hidden');
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
        slideSetSelect.innerHTML = '<option value="">Select a Set...</option>';

        if (data.success && data.sets) {
            data.sets.forEach(set => {
                // Add to list
                const div = document.createElement('div');
                div.className = 'set-item';
                div.innerHTML = `
                    <span><span class="material-symbols-outlined list-icon">${set.icon || 'folder'}</span><strong>${set.name}</strong> ${set.is_active ? '(ACTIVE)' : ''}</span>
                    <button class="btn" onclick="setActiveSet(${set.id})" title="Set Active"><span class="material-symbols-outlined">check_circle</span></button>
                `;
                setsList.appendChild(div);

                // Add to select
                const option = document.createElement('option');
                option.value = set.id;
                option.textContent = set.name;
                slideSetSelect.appendChild(option);
            });
        }
    }

    // Set Active Set (exposed to window for onclick)
    window.setActiveSet = async (id) => {
        await apiFetch('api/slides.php?action=set_active', 'POST', {set_id: id});
        loadSets();
    };

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

    // Load Slides for selected set
    slideSetSelect.addEventListener('change', async () => {
        const setId = slideSetSelect.value;
        if (!setId) {
            slidesList.innerHTML = '';
            return;
        }
        
        const data = await apiFetch(`api/slides.php?action=list_slides&set_id=${setId}`);
        
        slidesList.innerHTML = '';
        if (data.success && data.slides) {
            data.slides.forEach((slide, index) => {
                let content = JSON.parse(slide.content);
                const div = document.createElement('div');
                div.className = 'slide-item reorder-item';
                div.dataset.id = slide.id;
                div.draggable = true;
                div.style.cursor = 'grab';
                const typeIcon = slide.type === 'image' ? 'image' : 'article';
                div.innerHTML = `
                    <span>
                        <span class="material-symbols-outlined drag-handle">drag_indicator</span>
                        <span class="material-symbols-outlined list-icon">${typeIcon}</span> ${content.title || 'No Title'}
                    </span>
                    <div class="btn-group">
                        <button class="btn" onclick="editSlide(${slide.id})" title="Edit"><span class="material-symbols-outlined">edit</span></button>
                        <button class="btn" onclick="deleteSlide(${slide.id})" title="Delete"><span class="material-symbols-outlined">delete</span></button>
                    </div>
                `;
                slidesList.appendChild(div);
            });
            window.currentSetSlides = data.slides;
            setupDragAndDrop(slidesList, async (newOrder) => {
                await apiFetch('api/slides.php?action=reorder_slides', 'POST', {ordered_ids: newOrder});
                slideSetSelect.dispatchEvent(new Event('change'));
            });
        }
    });

    window.deleteSlide = async (id) => {
        if(confirm("Are you sure?")) {
            await apiFetch(`api/slides.php?action=delete_slide&id=${id}`, 'DELETE');
            // trigger change event to reload
            slideSetSelect.dispatchEvent(new Event('change'));
        }
    }

    window.editSlide = (id) => {
        if (!window.currentSetSlides) return;
        const slide = window.currentSetSlides.find(s => s.id === id);
        if (!slide) return;
        
        document.getElementById('edit-slide-id').value = slide.id;
        document.getElementById('slide-type').value = slide.type;
        const content = JSON.parse(slide.content);
        document.getElementById('slide-title').value = content.title || '';
        if (quill) quill.root.innerHTML = content.body || '';
        document.getElementById('slide-image-url').value = content.imageUrl || '';
        
        if (slide.type === 'image' && content.imageUrl) {
            document.getElementById('current-image-preview').src = content.imageUrl;
            document.getElementById('current-image-preview').classList.remove('hidden');
            document.getElementById('slide-image-description').value = content.description || '';
        } else {
            document.getElementById('current-image-preview').classList.add('hidden');
            document.getElementById('slide-image-description').value = '';
        }
        document.getElementById('slide-image-file').value = '';

        if (slide.type === 'qr') {
            document.getElementById('slide-qr-data').value = content.qrData || '';
            document.getElementById('slide-qr-description').value = content.description || '';
        } else {
            document.getElementById('slide-qr-data').value = '';
            document.getElementById('slide-qr-description').value = '';
        }
        
        slideType.dispatchEvent(new Event('change'));
        
        document.getElementById('submit-slide-btn').innerHTML = '<span class="material-symbols-outlined">save</span> Update Slide';
        document.getElementById('cancel-edit-btn').classList.remove('hidden');
        document.getElementById('create-slide-form').scrollIntoView({behavior: 'smooth'});
    };

    function resetSlideForm() {
        document.getElementById('edit-slide-id').value = '';
        document.getElementById('slide-title').value = '';
        if (quill) quill.root.innerHTML = '';
        document.getElementById('slide-image-url').value = '';
        document.getElementById('slide-image-file').value = '';
        document.getElementById('slide-image-description').value = '';
        document.getElementById('current-image-preview').classList.add('hidden');
        document.getElementById('current-image-preview').src = '';
        document.getElementById('slide-qr-data').value = '';
        document.getElementById('slide-qr-description').value = '';
        document.getElementById('submit-slide-btn').innerHTML = '<span class="material-symbols-outlined">add_box</span> Add Slide';
        document.getElementById('cancel-edit-btn').classList.add('hidden');
    }
    
    document.getElementById('cancel-edit-btn').addEventListener('click', resetSlideForm);

    // Create / Update Slide
    createSlideForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const setId = slideSetSelect.value;
        if (!setId) return Toast.show("Select a set first", 'error');

        const type = slideType.value;
        const title = document.getElementById('slide-title').value;
        const body = quill ? quill.root.innerHTML : '';
        const editId = document.getElementById('edit-slide-id').value;
        const action = editId ? 'update_slide' : 'create_slide';
        
        const formData = new FormData();
        formData.append('slide_set_id', setId);
        formData.append('type', type);
        formData.append('title', title);
        if (type === 'text') {
            formData.append('body', body);
        } else if (type === 'image') {
            const fileInput = document.getElementById('slide-image-file');
            if (fileInput && fileInput.files.length > 0) {
                formData.append('image_file', fileInput.files[0]);
            }
            const existingUrl = document.getElementById('slide-image-url').value;
            if (existingUrl) {
                formData.append('existing_image_url', existingUrl);
            }
            const description = document.getElementById('slide-image-description').value;
            formData.append('description', description);
        } else if (type === 'qr') {
            const qrData = document.getElementById('slide-qr-data').value;
            const qrDescription = document.getElementById('slide-qr-description').value;
            formData.append('qr_data', qrData);
            formData.append('description', qrDescription);
        }
        if (editId) formData.append('slide_id', editId);

        await apiFetch(`api/slides.php?action=${action}`, 'POST', formData);

        resetSlideForm();
        
        // refresh list
        slideSetSelect.dispatchEvent(new Event('change'));
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
                <button class="admin-edit-overlay-btn" onclick="openMetadataModal(${img.id})" title="Edit Metadata">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="admin-delete-overlay" onclick="deleteAdminImage('${img.filename}')" title="Delete Image">
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
            <div class="filter-tag ${currentAdminTagFilter.length === 0 ? 'active' : ''}" onclick="setAdminTagFilter('')">All Tags</div>
            ${allAvailableTags.map(t => `<div class="filter-tag ${currentAdminTagFilter.includes(t) ? 'active' : ''}" onclick="setAdminTagFilter('${t}')">${t}</div>`).join('')}
        `;
    }
    
    window.setAdminTagFilter = (tag) => {
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
    
    window.openMetadataModal = (id) => {
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
    
    document.getElementById('btn-close-metadata').addEventListener('click', () => {
        metadataModal.classList.add('hidden');
    });
    
    metadataForm.addEventListener('submit', async (e) => {
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
            pill.innerHTML = `${tag} <span class="remove-tag" onclick="removeTag('${tag}')">&times;</span>`;
            tagsContainer.insertBefore(pill, tagInput);
        });
    }
    
    window.removeTag = (tagToRemove) => {
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
            tagAutocomplete.innerHTML = matches.map(t => `<div class="autocomplete-item" onclick="selectAutocompleteTag('${t}')">${t}</div>`).join('');
            tagAutocomplete.classList.remove('hidden');
        } else {
            tagAutocomplete.classList.add('hidden');
        }
    });
    
    window.selectAutocompleteTag = (tag) => {
        if (!currentTags.includes(tag)) {
            currentTags.push(tag);
        }
        tagInput.value = '';
        renderTags();
        tagAutocomplete.classList.add('hidden');
        tagInput.focus();
    };
    
    // Close autocomplete on click outside
    document.addEventListener('click', (e) => {
        if (!tagInput.contains(e.target) && !tagAutocomplete.contains(e.target)) {
            tagAutocomplete.classList.add('hidden');
        }
    });
    
    window.deleteAdminImage = async (filename) => {
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
            tagEl.innerHTML = `${tag} <span class="tag-remove" onclick="removeUploadTag(${idx})">&times;</span>`;
            uploadTagsContainer.insertBefore(tagEl, uploadTagInput);
        });
    }

    window.removeUploadTag = (idx) => {
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
            uploadTagAutocomplete.innerHTML = matches.map(t => `<div class="autocomplete-item" onclick="selectUploadAutocompleteTag('${t}')">${t}</div>`).join('');
            uploadTagAutocomplete.classList.remove('hidden');
        } else {
            uploadTagAutocomplete.classList.add('hidden');
        }
    });

    window.selectUploadAutocompleteTag = (tag) => {
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
            } else {
                msg.textContent = result?.error || 'Failed to change password.';
                msg.style.color = 'red';
            }
        } catch (e) {
            msg.textContent = 'An error occurred (check console/network).';
            msg.style.color = 'red';
        }
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    });

    loadGlobalSettings();

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
                        <select class="form-control admin-select-status" data-id="${user.id}" style="width: auto;">
                            ${statusOptions}
                        </select>
                    </td>
                    <td class="p-sm">
                        <select class="form-control admin-select-role" data-id="${user.id}" style="width: auto;">
                            ${roleOptions}
                        </select>
                    </td>
                    <td class="p-sm">
                        <button class="btn btn-primary btn-delete-user" data-id="${user.id}" title="Delete User">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
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
                    headHtml += `<th class="p-sm" style="text-align: center;">${p.name}</th>`;
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
                        
                        rowHtml += `<td class="p-sm" style="text-align: center;">
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


