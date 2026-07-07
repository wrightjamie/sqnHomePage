// js/app.js
let currentSlides = [];
let currentIndex = 0;
let slideInterval = null;
let isPaused = false;
let editMode = false;
let currentSetId = null;
const INTERVAL_MS = 10000;

// DOM Elements
const viewer = document.getElementById('slide-viewer');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnPausePlay = document.getElementById('btn-pause-play');
const btnEditMode = document.getElementById('btn-edit-mode');
const btnLogout = document.getElementById('btn-logout');

// Modal Elements
const loginModal = document.getElementById('login-modal');
const galleryModal = document.getElementById('gallery-modal');
const reorderModal = document.getElementById('reorder-modal');



// --- Edit Mode & Authentication ---

// --- Slide Rendering ---

function renderSlide(slide) {
    // Dummy Slide
    if (slide.isDummy) {
        return `
            <div class="slide flex-col flex-center" id="slide-dummy">
                <h1>Add New Slide</h1>
                <div style="display:flex; gap:1.25rem;">
                    <button class="dummy-slide-btn" onclick="createNewSlide('text')"><span class="material-symbols-outlined">description</span> Text Slide</button>
                    <button class="dummy-slide-btn" onclick="createNewSlide('image')"><span class="material-symbols-outlined">image</span> Image Slide</button>
                </div>
            </div>`;
    }

    let content = '';
    try {
        const data = JSON.parse(slide.content);
        
        let titleHtml = data.title ? `<h1>${data.title}</h1>` : '';
        if (editMode) {
            titleHtml = `
                <div class="editable-container" onclick="startEdit(${slide.id}, 'title')">
                    ${titleHtml || '<h1 style="color:#666">[No Title]</h1>'}
                    <span class="material-symbols-outlined edit-marker">edit</span>
                </div>`;
        }

        if (slide.type === 'text') {
            let bodyHtml = `<div>${data.body || ''}</div>`;
            if (editMode) {
                bodyHtml = `
                    <div class="editable-container" onclick="startEdit(${slide.id}, 'body')">
                        ${bodyHtml || '<div style="color:#666">[No Content]</div>'}
                        <span class="material-symbols-outlined edit-marker">edit</span>
                    </div>`;
            }
            content = `
                <div class="slide-content">
                    ${titleHtml}
                    ${bodyHtml}
                </div>`;
        } else if (slide.type === 'image') {
            let imgHtml = `
                <div class="slide-image-container flex-center">
                    <img src="${data.imageUrl || ''}" alt="${data.title || 'Slide Image'}" style="object-position: ${data.focusX || 50}% ${data.focusY || 50}%;">
                </div>`;
            if (editMode) {
                imgHtml = `
                    <div class="editable-container flex-center" style="flex:1; margin-top:0.625rem;" onclick="openGalleryForSlide(${slide.id})">
                        ${imgHtml}
                        <span class="material-symbols-outlined edit-marker">image</span>
                    </div>`;
            }
            content = `
                <div class="slide-content">
                    ${titleHtml}
                    ${imgHtml}
                </div>`;
        }
    } catch(e) {
        content = '<h1>Error parsing slide</h1>';
    }

    let toolbarHtml = '';
    if (editMode) {
        toolbarHtml = `
            <div class="edit-toolbar">
                <button class="btn-secondary" onclick="openReorderModal()" title="Reorder Slides"><span class="material-symbols-outlined">format_list_numbered</span></button>
                <button class="btn-primary" onclick="deleteSlide(${slide.id})" title="Delete Slide"><span class="material-symbols-outlined">delete</span></button>
            </div>
        `;
    }

    return `<div class="slide flex-col" id="slide-${slide.id}">${toolbarHtml}${content}</div>`;
}

let allActiveSets = [];

async function loadActiveSet() {
    try {
        const response = await fetch('api/slides.php?action=active_set');
        const data = await response.json();
        
        if (data.success && data.data && data.data.sets && data.data.sets.length > 0) {
            allActiveSets = data.data.sets;
            renderSlideshowMenu();
            if (currentSetId && allActiveSets.find(s => s.id == currentSetId)) {
                switchToSet(currentSetId, true);
            } else {
                switchToSet(allActiveSets[0].id);
            }
        } else {
            allActiveSets = [];
            currentSlides = [];
            currentSetId = null;
            document.getElementById('slideshow-menu').classList.add('hidden');
            viewer.innerHTML = '<div class="slide active"><h1>No Active Slides</h1><p>Please log in to admin to set up slides.</p></div>';
        }
    } catch (e) {
        console.error('Error loading slides', e);
    }
}

function renderSlideshowMenu() {
    const menu = document.getElementById('slideshow-menu');
    if (allActiveSets.length <= 1) {
        menu.classList.add('hidden');
        return;
    }
    
    menu.classList.remove('hidden');
    menu.innerHTML = allActiveSets.map(set => `
        <button class="slideshow-tab" id="tab-set-${set.id}" onclick="switchToSet(${set.id})">
            <span class="material-symbols-outlined">${set.icon || 'folder'}</span>
            ${set.name}
        </button>
    `).join('');
}

window.switchToSet = function(setId, preserveIndex = false) {
    const set = allActiveSets.find(s => s.id == setId);
    if (!set) return;
    
    currentSetId = setId;
    currentSlides = set.slides || [];
    
    if (!preserveIndex) {
        currentIndex = 0;
    } else {
        const slidesCount = editMode ? currentSlides.length + 1 : currentSlides.length;
        if (currentIndex >= slidesCount) {
            currentIndex = Math.max(0, slidesCount - 1);
        }
    }
    
    // Update tabs
    document.querySelectorAll('.slideshow-tab').forEach(tab => {
        tab.classList.toggle('active', tab.id === `tab-set-${setId}`);
    });
    
    renderAllSlides();
}

function renderAllSlides() {
    let slidesToRender = [...currentSlides];
    if (editMode) {
        slidesToRender.push({ isDummy: true, id: 'dummy' });
    }
    viewer.innerHTML = slidesToRender.map(renderSlide).join('');
    
    // Ensure index is valid
    if (currentIndex >= slidesToRender.length) currentIndex = 0;
    showSlide(currentIndex);
    
    if (!editMode) {
        startCarousel();
    }
}

function showSlide(index) {
    const slidesCount = editMode ? currentSlides.length + 1 : currentSlides.length;
    if (slidesCount === 0) return;
    
    document.querySelectorAll('.slide').forEach(el => el.classList.remove('active'));
    
    if (index >= slidesCount) currentIndex = 0;
    else if (index < 0) currentIndex = slidesCount - 1;
    else currentIndex = index;

    const id = (editMode && currentIndex === currentSlides.length) ? 'dummy' : currentSlides[currentIndex].id;
    const activeSlide = document.getElementById(`slide-${id}`);
    if (activeSlide) activeSlide.classList.add('active');
}

// --- Carousel Controls ---

function nextSlide() {
    showSlide(currentIndex + 1);
    if (!isPaused && !editMode) resetInterval();
}
function prevSlide() {
    showSlide(currentIndex - 1);
    if (!isPaused && !editMode) resetInterval();
}
function startCarousel() {
    if (slideInterval) clearInterval(slideInterval);
    if (!isPaused && !editMode) {
        slideInterval = setInterval(nextSlide, INTERVAL_MS);
        btnPausePlay.innerHTML = '<span class="material-symbols-outlined">pause</span>';
    }
}
function resetInterval() {
    if (slideInterval) clearInterval(slideInterval);
    if (!isPaused && !editMode) {
        slideInterval = setInterval(nextSlide, INTERVAL_MS);
    }
}
function togglePause() {
    if (editMode) return; // Disable pause/play in edit mode
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(slideInterval);
        btnPausePlay.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
    } else {
        startCarousel();
    }
}

btnNext.addEventListener('click', nextSlide);
btnPrev.addEventListener('click', prevSlide);
btnPausePlay.addEventListener('click', togglePause);

const btnLoginTrigger = document.getElementById('btn-login-trigger');
const linkAdmin = document.getElementById('link-admin');

async function checkAuthStatus() {
    try {
        const data = await Auth.checkStatus();
        if (data.logged_in) {
            setAuthenticatedState();
        } else {
            setUnauthenticatedState();
        }
    } catch (e) {
        setUnauthenticatedState();
    }
}

function setAuthenticatedState() {
    btnLoginTrigger.classList.add('hidden');
    btnEditMode.classList.remove('hidden');
    linkAdmin.classList.remove('hidden');
    btnLogout.classList.remove('hidden');
}

function setUnauthenticatedState() {
    btnLoginTrigger.classList.remove('hidden');
    btnEditMode.classList.add('hidden');
    linkAdmin.classList.add('hidden');
    btnLogout.classList.add('hidden');
}

btnEditMode.addEventListener('click', () => {
    if (!editMode) {
        enterEditMode();
    } else {
        exitEditMode();
    }
});

Auth.onLogin(() => {
    setAuthenticatedState();
});

Auth.onLogout(() => {
    exitEditMode();
    setUnauthenticatedState();
    window.location.reload();
});

btnLoginTrigger.addEventListener('click', () => {
    Auth.showModal();
});

// Load slides on start
loadActiveSet();


// --- Edit Mode Logic ---

function enterEditMode() {
    editMode = true;
    if (slideInterval) clearInterval(slideInterval);
    btnEditMode.innerHTML = '<span class="material-symbols-outlined">edit_off</span>';
    btnEditMode.title = "Exit Edit Mode";
    
    // Switch pause icon to paused state for visual feedback
    btnPausePlay.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
    btnPausePlay.style.opacity = '0.3'; // disabled look
    btnPausePlay.style.pointerEvents = 'none';

    renderAllSlides();
}

function exitEditMode() {
    editMode = false;
    
    btnEditMode.innerHTML = '<span class="material-symbols-outlined">edit</span>';
    btnEditMode.title = "Edit Mode";
    
    btnPausePlay.style.opacity = '1';
    btnPausePlay.style.pointerEvents = 'auto';
    isPaused = false;
    
    renderAllSlides();
    startCarousel();
}

// --- Inline Editing ---

let currentlyEditing = null;

function startEdit(slideId, field) {
    if (currentlyEditing) return; // Only edit one thing at a time
    currentlyEditing = { id: slideId, field: field };
    
    const slide = currentSlides.find(s => s.id == slideId);
    const data = JSON.parse(slide.content);
    const value = data[field] || '';
    
    const container = event.currentTarget;
    
    let inputHtml = '';
    if (field === 'title') {
        inputHtml = `<input type="text" id="inline-edit-input" value="${value.replace(/"/g, '&quot;')}" style="font-size:2rem; width:100%; padding:0.625rem; color:black;" autofocus onkeydown="if(event.key === 'Enter') { saveEdit(event); }">`;
    } else {
        inputHtml = `<div id="inline-edit-editor" style="background:white; color:black;">${value}</div>`;
    }
    
    container.innerHTML = `
        <div style="background: rgba(0,0,0,0.8); padding: 0.9375rem; border-radius: 0.5rem;">
            ${inputHtml}
            <div class="flex-row gap-sm mt-sm">
                <button class="btn-primary" onclick="saveEdit(event)">Save</button>
                <button class="btn-secondary" onclick="cancelEdit(event)">Cancel</button>
            </div>
        </div>
    `;
    container.onclick = null; // Disable click while editing
    
    if (field === 'body') {
        window.inlineQuill = new Quill('#inline-edit-editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic'],
                    [{ 'header': 1 }, { 'header': 2 }],
                    [{ 'list': 'bullet' }]
                ]
            }
        });
        window.inlineQuill.focus();
    } else {
        window.inlineQuill = null;
    }
}

async function saveEdit(e) {
    e.stopPropagation();
    let newValue;
    if (currentlyEditing.field === 'body') {
        newValue = window.inlineQuill ? window.inlineQuill.root.innerHTML : '';
    } else {
        newValue = document.getElementById('inline-edit-input').value;
    }
    const slide = currentSlides.find(s => s.id == currentlyEditing.id);
    const data = JSON.parse(slide.content);
    
    data[currentlyEditing.field] = newValue;
    
    await updateSlide(slide.id, slide.type, data);
    currentlyEditing = null;
}

function cancelEdit(e) {
    e.stopPropagation();
    currentlyEditing = null;
    renderAllSlides();
}

async function createSlide(type, data) {
    if (!currentSetId) return;
    const res = await apiFetch('api/slides.php?action=create_slide', 'POST', { slide_set_id: currentSetId, type: type, ...data });
    await loadActiveSet();
    closeAllModals();
}

async function updateSlide(id, type, contentObj) {
    await apiFetch('api/slides.php?action=update_slide', 'POST', { slide_id: id, type: type, ...contentObj });
    await loadActiveSet();
    closeAllModals();
}

async function deleteSlide(id) {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    await apiFetch(`api/slides.php?action=delete_slide&id=${id}`, 'DELETE');
    await loadActiveSet();
}

// --- Reorder Modal ---

function openReorderModal() {
    const list = document.getElementById('reorder-list');
    list.innerHTML = currentSlides.map(s => {
        const title = JSON.parse(s.content).title || 'Untitled Slide';
        return `
        <div class="set-item reorder-item" draggable="true" data-id="${s.id}">
            <span class="material-symbols-outlined drag-handle mr-sm">drag_indicator</span>
            <span>${title} (${s.type})</span>
        </div>`;
    }).join('');
    
    setupDragAndDrop(list, () => {});
    reorderModal.classList.remove('hidden');
}

document.getElementById('btn-cancel-reorder').addEventListener('click', () => {
    reorderModal.classList.add('hidden');
});

document.getElementById('btn-save-reorder').addEventListener('click', async function saveReorder() {
    const ids = Array.from(document.getElementById('reorder-list').children).map(el => el.getAttribute('data-id'));
    await apiFetch('api/slides.php?action=reorder_slides', 'POST', { ordered_ids: ids });
    document.getElementById('reorder-modal').classList.add('hidden');
    await loadActiveSet();
});

// --- Image Gallery ---

let galleryPage = 1;
let galleryTargetSlideId = null;

async function openGalleryForSlide(slideId) {
    if (!editMode) return;
    if (currentlyEditing) return; // block
    galleryTargetSlideId = slideId;
    galleryPage = 1;
    await fetchGallery();
    galleryModal.classList.remove('hidden');
}

const galleryPagination = new Pagination('gallery-pagination', (page) => {
    galleryPage = page;
    fetchGallery();
});

let galleryImagesCache = [];
async function fetchGallery() {
    const data = await apiFetch(`api/images.php?action=list&page=${galleryPage}`);
    
    const grid = document.getElementById('gallery-grid');
    if (data.success && data.images) {
        galleryImagesCache = data.images;
        grid.innerHTML = data.images.map(img => `
            <div class="gallery-img-container" onclick="openFocusSelector('${img.id}')">
                <img src="${img.thumb_url}" class="gallery-img-item" title="${img.filename}">
            </div>
        `).join('');
    }
    
    galleryPagination.render(data.page, data.pages);
}

document.getElementById('btn-close-gallery').addEventListener('click', () => {
    galleryModal.classList.add('hidden');
    galleryTargetSlideId = null;
});



document.getElementById('btn-upload-new').addEventListener('click', () => {
    document.getElementById('gallery-file-input').click();
});

document.getElementById('gallery-file-input').addEventListener('change', async (e) => {
    if (!e.target.files[0] || !galleryTargetSlideId) return;
    const slide = currentSlides.find(s => s.id == galleryTargetSlideId);
    const data = JSON.parse(slide.content);
    
    const formData = new FormData();
    formData.append('slide_id', slide.id);
    formData.append('type', slide.type);
    formData.append('title', data.title || '');
    formData.append('image_file', e.target.files[0]);
    
    // using fetch for multipart form data without apiFetch wrapper for now
    const res = await fetch('api/slides.php?action=update_slide', {
        method: 'POST',
        body: formData // No JSON, letting browser set multipart/form-data
    });
    const resultData = await res.json();
    if(resultData.success) {
        await loadActiveSet();
        closeAllModals();
    } else {
        alert(resultData.error || 'Upload failed');
    }
});

// Touch Swipe Capabilities
let touchStartX = 0;
let touchEndX = 0;

viewer.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
viewer.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, {passive: true});

function handleSwipe() {
    if (editMode) return; // Disable swipe in edit mode
    const threshold = 50; 
    if (touchEndX < touchStartX - threshold) nextSlide();
    if (touchEndX > touchStartX + threshold) prevSlide();
}

async function checkInitialAuth() {
    Auth.init();
    try {
        const res = await Auth.checkStatus();
        if (res.authenticated) {
            if(btnEditMode) btnEditMode.style.display = 'flex';
            if(btnLogout) btnLogout.style.display = 'flex';
            const linkAdmin = document.getElementById('link-admin');
            if(linkAdmin) linkAdmin.style.display = 'flex';
        }
    } catch(e) {
        console.error('Auth check error', e);
    }
}

// Initial load
checkInitialAuth();
loadActiveSet();

let currentFocusImageId = null;
let currentFocusX = 50;
let currentFocusY = 50;

function openFocusSelector(imgId) {
    const img = galleryImagesCache.find(i => i.id == imgId);
    if (!img) return;
    
    currentFocusImageId = img.id;
    currentFocusX = img.focus_x || 50;
    currentFocusY = img.focus_y || 50;
    
    document.getElementById('gallery-grid-view').classList.add('hidden');
    document.getElementById('focus-selector-view').classList.remove('hidden');
    
    const previewImg = document.getElementById('focus-preview-img');
    previewImg.src = img.url;
    
    document.getElementById('focus-coords-text').textContent = `Focus: ${currentFocusX}%, ${currentFocusY}%`;
    updateFocusReticle();
}

document.getElementById('btn-focus-back').addEventListener('click', () => {
    document.getElementById('focus-selector-view').classList.add('hidden');
    document.getElementById('gallery-grid-view').classList.remove('hidden');
});

document.getElementById('focus-preview-container').addEventListener('click', (e) => {
    const rect = e.target.getBoundingClientRect();
    // Ensure we are calculating relative to the image
    let targetElement = e.target;
    if (targetElement.id !== 'focus-preview-img') {
        targetElement = document.getElementById('focus-preview-img');
    }
    
    // We need the bounding rect of the actual image
    const imgRect = targetElement.getBoundingClientRect();
    
    // Check if click was within the image bounds (in case they clicked the container padding)
    if (e.clientX < imgRect.left || e.clientX > imgRect.right || 
        e.clientY < imgRect.top || e.clientY > imgRect.bottom) {
        return;
    }
    
    const x = e.clientX - imgRect.left;
    const y = e.clientY - imgRect.top;
    
    currentFocusX = Math.round((x / imgRect.width) * 100);
    currentFocusY = Math.round((y / imgRect.height) * 100);
    
    document.getElementById('focus-coords-text').textContent = `Focus: ${currentFocusX}%, ${currentFocusY}%`;
    updateFocusReticle();
});

function updateFocusReticle() {
    const reticle = document.getElementById('focus-reticle');
    reticle.style.left = `${currentFocusX}%`;
    reticle.style.top = `${currentFocusY}%`;
}

document.getElementById('btn-focus-save').addEventListener('click', async () => {
    const img = galleryImagesCache.find(i => i.id == currentFocusImageId);
    if (!img) return;
    
    // Save to DB
    await apiFetch('api/images.php?action=set_focus', 'POST', {
        id: img.id,
        focus_x: currentFocusX,
        focus_y: currentFocusY
    });
    
    // Update local cache
    img.focus_x = currentFocusX;
    img.focus_y = currentFocusY;
    
    // Proceed to select image
    await selectGalleryImage(img.url, currentFocusX, currentFocusY);
    
    // Reset view for next time
    document.getElementById('focus-selector-view').classList.add('hidden');
    document.getElementById('gallery-grid-view').classList.remove('hidden');
});

async function selectGalleryImage(url, focusX = 50, focusY = 50) {
    if (!galleryTargetSlideId) return;
    const slide = currentSlides.find(s => s.id == galleryTargetSlideId);
    const data = JSON.parse(slide.content);
    data.imageUrl = url;
    data.focusX = focusX;
    data.focusY = focusY;
    
    galleryModal.classList.add('hidden');
    await updateSlide(slide.id, slide.type, data);
}
