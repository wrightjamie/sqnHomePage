/**
 * admin.js
 *
 * Core frontend logic for the Administration Panel (`admin.php`).
 * Handles slide set management, slide creation/editing, image uploads,
 * and gallery management. Communicates heavily with `api/slides.php` and `api/images.php`.
 */

// js/admin.js

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
        if (slideType.value === 'image') {
            document.getElementById('slide-body-container').classList.add('hidden');
            document.getElementById('image-upload-group').classList.remove('hidden');
        } else {
            document.getElementById('slide-body-container').classList.remove('hidden');
            document.getElementById('image-upload-group').classList.add('hidden');
        }
    });

    async function checkAuth() {
        const data = await apiFetch('api/auth.php?action=status');
        if (data.logged_in) {
            loginSection.classList.add('hidden');
            adminSection.classList.remove('hidden');
            loadSets();
            if (window.checkUrlTab) window.checkUrlTab();
        } else {
            loginSection.classList.remove('hidden');
            adminSection.classList.add('hidden');
            document.getElementById('username').focus();
        }
    }

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const data = await apiFetch('api/auth.php?action=login', 'POST', {username, password});
        if (data.success) {
            checkAuth();
        } else {
            alert('Login failed: ' + data.message);
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
                    <span><span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 0.3125rem;">${set.icon || 'folder'}</span><strong>${set.name}</strong> ${set.is_active ? '(ACTIVE)' : ''}</span>
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
                        <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 0.3125rem; cursor: grab;">drag_indicator</span>
                        <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 0.3125rem;">${typeIcon}</span> ${content.title || 'No Title'}
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
        } else {
            document.getElementById('current-image-preview').classList.add('hidden');
        }
        document.getElementById('slide-image-file').value = '';
        
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
        document.getElementById('current-image-preview').classList.add('hidden');
        document.getElementById('current-image-preview').src = '';
        document.getElementById('submit-slide-btn').innerHTML = '<span class="material-symbols-outlined">add_box</span> Add Slide';
        document.getElementById('cancel-edit-btn').classList.add('hidden');
    }
    
    document.getElementById('cancel-edit-btn').addEventListener('click', resetSlideForm);

    // Create / Update Slide
    createSlideForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const setId = slideSetSelect.value;
        if (!setId) return Toast.show("Select a set first", "warning");

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
                <div class="reorder-item flex-center" draggable="true" data-id="${s.id}" style="justify-content:flex-start; margin-bottom:0.3125rem; padding:0.625rem; background:#f9f9f9; border:0.0625rem solid #ddd; cursor:grab;">
                    <span class="material-symbols-outlined" style="margin-right:0.625rem; cursor:grab;">drag_indicator</span>
                    <span class="material-symbols-outlined" style="margin-right:0.3125rem;">${s.icon || 'folder'}</span>
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
                <button class="admin-edit-overlay" onclick="openMetadataModal(${img.id})" title="Edit Metadata" style="position:absolute; top:0.3125rem; left:0.3125rem; background:rgba(0,0,0,0.7); color:white; border:none; border-radius:50%; width:1.875rem; height:1.875rem; display:flex; justify-content:center; align-items:center; cursor:pointer;">
                    <span class="material-symbols-outlined" style="font-size:1.125rem;">edit</span>
                </button>
                <button class="admin-delete-overlay" onclick="deleteAdminImage('${img.filename}')" title="Delete Image">
                    <span class="material-symbols-outlined">delete</span>
                </button>
                ${img.tags && img.tags.length > 0 ? `<div style="position:absolute; bottom:0.3125rem; left:0.3125rem; background:rgba(0,0,0,0.6); color:white; font-size:0.625rem; padding:0.125rem 0.3125rem; border-radius:0.1875rem;">${[...img.tags].sort().join(', ')}</div>` : ''}
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
        
        try {
            await apiFetch(`api/images.php?action=delete&filename=${encodeURIComponent(filename)}`);
            Toast.show('Image deleted successfully', 'success');
            loadAdminGallery(adminPagination.currentPage);
        } catch (e) {
            // Error handled by Toast in apiFetch
        }
    };
    
    btnRegenThumbs.addEventListener('click', async () => {
        const originalText = btnRegenThumbs.innerHTML;
        btnRegenThumbs.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 2s linear infinite;">autorenew</span> Working...';
        btnRegenThumbs.disabled = true;
        
        try {
            const data = await apiFetch('api/images.php?action=regenerate_all');
            
            if (data.success) {
                if (data.debug && !data.debug.gd_loaded) {
                    Toast.show('Warning: PHP GD library not loaded. Thumbnails not generated.', 'warning');
                } else {
                    Toast.show(`Successfully generated ${data.count} new thumbnails!`, 'success');
                }
                loadAdminGallery(adminPagination.currentPage); // refresh grid to show new thumbs
            }
        } catch (e) {
            // Toast handles error automatically via apiFetch
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
        submitBtn.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 2s linear infinite;">autorenew</span> Uploading...';
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('image_file', uploadFileInput.files[0]);
        formData.append('title', document.getElementById('upload-title').value);
        formData.append('description', document.getElementById('upload-description').value);
        formData.append('tags', JSON.stringify(uploadTags));

        try {
            const data = await apiFetch('api/images.php?action=upload', 'POST', formData);
            uploadModal.classList.add('hidden');
            Toast.show('Image uploaded successfully', 'success');

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
        } catch (err) {
            // Error handled by Toast in apiFetch
        }
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });

    checkAuth();
});

// Add spin animation to document for the autorenew icon
const style = document.createElement('style');
style.textContent = `
    @keyframes spin { 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(style);


