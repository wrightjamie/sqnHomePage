// js/app.js
let currentSlides = [];
let currentIndex = 0;
let slideInterval = null;
let isPaused = false;
let editMode = false;
let currentSetId = null;
let INTERVAL_MS = 10000;

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

function closeAllModals() {
    [loginModal, galleryModal, reorderModal].forEach(m => {
        if (m) m.classList.add('hidden');
    });
}


// --- Edit Mode & Authentication ---

// --- Slide Rendering ---

function renderSlide(slide) {
    // Dummy Slide
    if (slide.isDummy) {
        return `
            <div class="slide flex-col flex-center" id="slide-dummy">
                <h1>Add New Slide</h1>
                <div style="display:flex; gap:1.25rem;">
                    <button class="dummy-slide-btn" onclick="window.createNewSlide('text')"><span class="material-symbols-outlined">description</span> Text Slide</button>
                    <button class="dummy-slide-btn" onclick="window.createNewSlide('image')"><span class="material-symbols-outlined">image</span> Image Slide</button>
                    <button class="dummy-slide-btn" onclick="window.createNewSlide('programme')"><span class="material-symbols-outlined">calendar_today</span> Programme Slide</button>
                </div>
            </div>`;
    }

    // Attach createNewSlide to window if missing
    if (!window.createNewSlide) {
        window.createNewSlide = async function(type) {
            let data = {};
            if (type === 'programme') {
                data = { mode: 'next', title: 'Training Programme' };
            }
            await createSlide(type, data);
        };
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
            
            let imageActionHtml = '';
            if (editMode) {
                imageActionHtml = `
                    <div class="editable-container flex-center" style="flex:1; margin-top:0.625rem;" onclick="openGalleryForSlide(${slide.id})">
                        ${imgHtml}
                        <span class="material-symbols-outlined edit-marker">image</span>
                    </div>`;
            } else {
                imageActionHtml = imgHtml;
            }
            content = `
                <div class="slide-content" style="padding:0; overflow:hidden;">
                    <div class="gallery-slide-bg" style="background-image: url('${data.imageUrl || ''}'); background-position: ${data.focusX || 50}% ${data.focusY || 50}%;"></div>
                    ${titleHtml}
                    ${imageActionHtml}
                </div>`;
        } else if (slide.type === 'programme') {
            content = `
                <div class="slide-content" style="padding:2rem;">
                    ${titleHtml}
                    <div class="programme-slide-container" id="prog-container-${slide.id}" data-slide-id="${slide.id}" data-mode="${data.mode || 'next'}" data-date="${data.specificDate || ''}" data-orig-mode="${data.mode || 'next'}" data-orig-date="${data.specificDate || ''}">
                        <div style="display:flex; justify-content:center; align-items:center; height:100%;"><span class="material-symbols-outlined" style="animation: spin 2s linear infinite; font-size:3rem; color: #fff;">autorenew</span></div>
                    </div>
                </div>`;
        }

        let toolbarHtml = '';
        if (editMode) {
            toolbarHtml = `
            <div class="edit-toolbar">
                <button class="btn-secondary" onclick="openReorderModal()" title="Reorder Slides"><span class="material-symbols-outlined">format_list_numbered</span></button>
                <button class="btn-primary" onclick="deleteSlide(${slide.id})" title="Delete Slide"><span class="material-symbols-outlined">delete</span></button>
            </div>`;
        }

        return `
            <div class="slide flex-col" id="slide-${slide.id}">
                ${toolbarHtml}
                ${content}
            </div>
        `;
    } catch(e) {
        return `<div class="slide flex-col" id="slide-${slide.id}"><h1>Error parsing slide</h1></div>`;
    }
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
    
    // Now trigger async programme fetch
    setTimeout(loadProgrammeSlidesData, 50);

    if (slidesToRender.length > 0) {
        // Ensure index is valid
        if (currentIndex >= slidesToRender.length) currentIndex = 0;
        showSlide(currentIndex);
    }
    
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

btnLogout.addEventListener('click', () => {
    Auth.logout();
});

// Load slides on start
checkAuthStatus();
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
        const typeIcon = s.type === 'image' ? 'image' : (s.type === 'text' ? 'article' : 'feed');
        return `
        <div class="set-item reorder-item" draggable="true" data-id="${s.id}" style="justify-content: flex-start;">
            <span class="material-symbols-outlined drag-handle mr-sm">drag_indicator</span>
            <span class="material-symbols-outlined mr-sm" title="${s.type}" style="color: #888; font-size: 1.125rem;">${typeIcon}</span>
            <span>${title}</span>
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
    if (data && data.images) {
        galleryImagesCache = data.images;
        grid.innerHTML = data.images.map(img => `
            <div class="gallery-img-container" style="position: relative;">
                <img src="${img.thumb_url}" class="gallery-img-item" title="${img.filename}" onclick="selectGalleryImage('${img.url}', ${img.focus_x || 50}, ${img.focus_y || 50})">
                <button class="focus-target-btn" onclick="openFocusSelector('${img.id}')" title="Set Focus Point">
                    <span class="material-symbols-outlined" style="font-size: 20px;">center_focus_strong</span>
                </button>
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
        galleryModal.classList.add('hidden');
        galleryTargetSlideId = null;
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

// Initial load
checkAuthStatus();

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

// --- Global Config ---
async function loadGlobalConfig() {
    try {
        const data = await apiFetch('api/settings.php?action=global_config');
        if (data) {
            if (data.sidebarText) {
                const sidebarEl = document.querySelector('.swoosh-sidebar-text');
                if (sidebarEl) sidebarEl.textContent = data.sidebarText;
            }
            if (data.slideSpeed) {
                INTERVAL_MS = parseInt(data.slideSpeed, 10) * 1000;
                resetInterval();
            }
        }
    } catch (e) {
        console.error('Error loading global config', e);
    }
}

// Initialize global config on load
loadGlobalConfig();

// --- Programme Slide Logic ---
async function loadProgrammeSlidesData() {
    const containers = document.querySelectorAll('.programme-slide-container');
    if (containers.length === 0) return;
    
    for (const container of containers) {
        const mode = container.getAttribute('data-mode');
        const specificDate = container.getAttribute('data-date');
        
        let url = `api/programme.php?action=night&mode=${mode}`;
        if (mode === 'specific' && specificDate) {
            url += `&date=${specificDate}`;
        }
        
        try {
            const data = await apiFetch(url);
            if (data && data.night) {
                renderProgrammeNight(container, data);
            } else {
                container.innerHTML = `<div style="text-align:center; margin-top:2rem;"><h2>No Programme Found</h2><p>For date: ${data ? data.date : 'Unknown'}</p></div>`;
            }
        } catch (e) {
            container.innerHTML = `<div style="text-align:center; color:red; margin-top:2rem;"><h2>Error loading programme</h2></div>`;
        }
    }
}

function renderProgrammeNight(container, data) {
    const night = data.night;
    const dateStr = data.date;
    const prevDate = data.prev_date;
    const nextDate = data.next_date;
    const monthNotes = data.month_notes || [];

    const slideId = container.getAttribute('data-slide-id');
    const d = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateFormatted = d.toLocaleDateString(undefined, options);
    
    let editActionHtml = '';
    if (typeof editMode !== 'undefined' && editMode) {
        editActionHtml = `<button class="btn-primary" style="margin-left:1rem;" onclick="openProgrammeSettings(${slideId})" title="Slide Settings"><span class="material-symbols-outlined">settings</span></button>`;
    }
    
    // Function to change the displayed date dynamically without saving to db
    if (!window.shiftProgrammeSlideDate) {
        window.shiftProgrammeSlideDate = function(btn, targetDate) {
            const c = btn.closest('.programme-slide-container');
            if (c) {
                c.setAttribute('data-mode', 'specific');
                c.setAttribute('data-date', targetDate);
                window.loadProgrammeSlidesData();
                
                // Pause slideshow if not already paused
                if (typeof isPaused !== 'undefined' && !isPaused) {
                    togglePause();
                    c.autoPaused = true;
                }
                
                if (c.revertTimeout) clearTimeout(c.revertTimeout);
                c.revertTimeout = setTimeout(() => {
                    c.setAttribute('data-mode', c.getAttribute('data-orig-mode'));
                    c.setAttribute('data-date', c.getAttribute('data-orig-date'));
                    window.loadProgrammeSlidesData();
                    
                    // Resume if we auto-paused it
                    if (c.autoPaused) {
                        if (typeof isPaused !== 'undefined' && isPaused) togglePause();
                        c.autoPaused = false;
                    }
                }, 30000); // Revert after 30 seconds
            }
        };
    }

    let prevBtnHtml = prevDate ? `<button onclick="window.shiftProgrammeSlideDate(this, '${prevDate}')" class="btn-secondary" style="background:rgba(255,255,255,0.2); border:none; color:white; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; margin-right:1rem;" title="Previous Parade Night"><span class="material-symbols-outlined">chevron_left</span></button>` : '';
    let nextBtnHtml = nextDate ? `<button onclick="window.shiftProgrammeSlideDate(this, '${nextDate}')" class="btn-secondary" style="background:rgba(255,255,255,0.2); border:none; color:white; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; margin-left:1rem;" title="Next Parade Night"><span class="material-symbols-outlined">chevron_right</span></button>` : '';

    let html = `<div style="margin-bottom:1.5rem; border-bottom:2px solid rgba(255,255,255,0.2); padding-bottom:1rem; display:flex; align-items:center; justify-content:center; position:relative;">
        <div style="display:flex; align-items:center; position:absolute; left:0;">
            ${prevBtnHtml}
            ${nextBtnHtml}
        </div>
        <h2 style="margin:0; font-size:2rem; color:var(--colour-heading); text-align:center;">${dateFormatted}</h2>
        <div style="position:absolute; right:0;">
            ${editActionHtml}
        </div>
    </div>`;
    
    html += `<div style="display:flex; flex-direction:column; gap:1.25rem;">`;
    
    // Uniform & Notes side by side or stacked
    html += `<div style="display:flex; gap:2rem; flex-wrap:wrap;">`;
    
    if (night.uniform) {
        html += `
        <div style="flex:1; min-width:300px; background:rgba(0,0,0,0.4); padding:1rem; border-radius:0.5rem; border-left:4px solid var(--colour-accent);">
            <h3 style="margin-top:0; color:#fff; font-size:1.25rem; margin-bottom:0.5rem;"><span class="material-symbols-outlined" style="vertical-align:middle;">checkroom</span> Uniform</h3>
            <div style="font-size:1.5rem; font-weight:bold; color:var(--colour-accent);">${night.uniform}</div>
        </div>`;
    }
    
    if ((night.notes && night.notes.length > 0) || (monthNotes && monthNotes.length > 0)) {
        let notesHtml = '';
        if (night.notes && night.notes.length > 0) {
            notesHtml += night.notes.filter(n => n.trim()).map(n => `<li style="margin-bottom:0.25rem;">${n}</li>`).join('');
        }
        if (monthNotes && monthNotes.length > 0) {
            if (notesHtml) notesHtml += `<hr style="border-color:rgba(255,255,255,0.2); margin:0.5rem 0;">`;
            notesHtml += monthNotes.filter(n => n.trim()).map(n => `<li style="margin-bottom:0.25rem; font-style:italic;">${n}</li>`).join('');
        }

        if (notesHtml) {
            html += `
            <div style="flex:2; min-width:300px; background:rgba(0,0,0,0.4); padding:1rem; border-radius:0.5rem; border-left:4px solid var(--color-secondary);">
                <h3 style="margin-top:0; color:#fff; font-size:1.25rem; margin-bottom:0.5rem;"><span class="material-symbols-outlined" style="vertical-align:middle;">info</span> Notes</h3>
                <ul style="margin:0; padding-left:1.5rem; font-size:1.1rem; color:#eee;">${notesHtml}</ul>
            </div>`;
        }
    }
    html += `</div>`;
    
    // Activities
    if (night.activities && night.activities.length > 0) {
        html += `
        <div style="background:rgba(255,255,255,0.1); border-radius:0.5rem; overflow:hidden; margin-top:1rem;">
            <table style="width:100%; border-collapse:collapse; color:#fff;">
                <thead>
                    <tr style="background:rgba(0,0,0,0.6); text-align:left;">
                        <th style="padding:1rem; border-bottom:2px solid #555;">Classification</th>
                        <th style="padding:1rem; border-bottom:2px solid #555;">Activity</th>
                        <th style="padding:1rem; border-bottom:2px solid #555;">Instructor</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let rowIndex = 0;
        night.activities.forEach((act) => {
            if (!act.name && !act.instructor) return;
            const classes = act.classifications && act.classifications.length > 0 ? act.classifications : ['All'];
            
            classes.forEach((cls) => {
                const bg = rowIndex % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.3)';
                html += `
                    <tr style="background:${bg};">
                        <td style="padding:1rem; border-bottom:1px solid #444; font-weight:bold; color:#ccc;">${cls}</td>
                        <td style="padding:1rem; border-bottom:1px solid #444; font-size:1.2rem;">
                            ${act.activity_type ? `<span style="font-size:0.8rem; background:var(--colour-heading); padding:0.2rem 0.5rem; border-radius:0.25rem; margin-right:0.5rem; color:#fff;">${act.activity_type}</span>` : ''}
                            ${act.name}
                        </td>
                        <td style="padding:1rem; border-bottom:1px solid #444; color:#ddd;">${act.instructor || '-'}</td>
                    </tr>
                `;
                rowIndex++;
            });
        });
        
        html += `
                </tbody>
            </table>
        </div>`;
    }
    
    html += `</div>`; // end flex column
    container.innerHTML = html;
}

// Setup Programme Slide edit modal
function openProgrammeSettings(slideId) {
    // We can inject a modal or just prompt for now. Let's create a custom modal for this.
    let modal = document.getElementById('prog-settings-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'prog-settings-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:400px; color:black;">
                <h2>Programme Slide Settings</h2>
                <input type="hidden" id="prog-slide-id">
                
                <label style="display:block; margin-bottom:0.25rem; font-weight:bold;">Date Mode</label>
                <select id="prog-slide-mode" style="width:100%; padding:0.5rem; margin-bottom:1rem; border-radius:0.25rem;">
                    <option value="next">Next Parade Night</option>
                    <option value="today">Today</option>
                    <option value="specific">Specific Date</option>
                </select>
                
                <div id="prog-slide-date-container" style="display:none;">
                    <label style="display:block; margin-bottom:0.25rem; font-weight:bold;">Specific Date</label>
                    <input type="date" id="prog-slide-date" style="width:100%; padding:0.5rem; margin-bottom:1rem; border-radius:0.25rem;">
                </div>
                
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button class="btn btn-secondary" onclick="document.getElementById('prog-settings-modal').classList.add('hidden')">Cancel</button>
                    <button class="btn btn-primary" onclick="saveProgrammeSettings()">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('prog-slide-mode').addEventListener('change', (e) => {
            document.getElementById('prog-slide-date-container').style.display = e.target.value === 'specific' ? 'block' : 'none';
        });
    }
    
    const slide = currentSlides.find(s => s.id == slideId);
    const data = JSON.parse(slide.content);
    
    document.getElementById('prog-slide-id').value = slideId;
    document.getElementById('prog-slide-mode').value = data.mode || 'next';
    document.getElementById('prog-slide-date').value = data.specificDate || '';
    
    document.getElementById('prog-slide-date-container').style.display = (data.mode === 'specific') ? 'block' : 'none';
    
    modal.classList.remove('hidden');
}

window.openProgrammeSettings = openProgrammeSettings;

window.saveProgrammeSettings = async function() {
    const slideId = document.getElementById('prog-slide-id').value;
    const mode = document.getElementById('prog-slide-mode').value;
    const specificDate = document.getElementById('prog-slide-date').value;
    
    const slide = currentSlides.find(s => s.id == slideId);
    const data = JSON.parse(slide.content);
    
    data.mode = mode;
    data.specificDate = specificDate;
    
    await updateSlide(slide.id, slide.type, data);
    document.getElementById('prog-settings-modal').classList.add('hidden');
};
