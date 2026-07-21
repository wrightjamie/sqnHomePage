// Configuration
const DISPLAY_CONFIG = {
    DEFAULT_INTERVAL_MS: 10000,
    INITIAL_LOAD_DELAY_MS: 50,
    PROGRAMME_REVERT_TIMEOUT_MS: 30000
};

let currentSlides = [];
let currentIndex = 0;
let slideInterval = null;
let isPaused = false;
let editMode = false;
let currentSetId = null;
let INTERVAL_MS = DISPLAY_CONFIG.DEFAULT_INTERVAL_MS;

// DOM Elements
const viewer = document.getElementById('slide-viewer');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnPausePlay = document.getElementById('btn-pause-play');
const menuTriggerIcon = document.querySelector('.expandable-menu-trigger span');
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

function renderDummySlide() {
    return `
        <div class="slide" id="slide-dummy">
            <h1>Add New Slide</h1>
            <div class="dummy-slide-actions" style="display: flex; gap: var(--space-md); justify-content: center; flex-wrap: wrap; margin-top: 3rem;">
                <button class="dummy-slide-btn" onclick="window.createNewSlide('text')">
                    <span class="material-symbols-outlined">description</span>
                    <span>Text Slide</span>
                </button>
                <button class="dummy-slide-btn" onclick="window.createNewSlide('image')">
                    <span class="material-symbols-outlined">image</span>
                    <span>Image Slide</span>
                </button>
                <button class="dummy-slide-btn" onclick="window.createNewSlide('programme')">
                    <span class="material-symbols-outlined">calendar_today</span>
                    <span>Programme Slide</span>
                </button>
                <button class="dummy-slide-btn" onclick="window.createNewSlide('qr')">
                    <span class="material-symbols-outlined">qr_code</span>
                    <span>QR Code</span>
                </button>
            </div>
        </div>`;
}

function renderSlideTitle(slide, data) {
    let titleHtml = data.title ? `<h1>${data.title}</h1>` : '';
    if (editMode) {
        titleHtml = `
            <div class="editable-container" onclick="startEdit(${slide.id}, 'title')">
                ${titleHtml || '<h1 class="slide-placeholder">[No Title]</h1>'}
                <span class="material-symbols-outlined edit-marker">edit</span>
            </div>`;
    }
    return titleHtml;
}

function renderSlideToolbar(slide) {
    if (!editMode) return '';
    return `
        <div class="edit-toolbar">
            <button class="btn-secondary" onclick="openReorderModal()" title="Reorder Slides"><span class="material-symbols-outlined">format_list_numbered</span></button>
            <button class="btn-primary" onclick="deleteSlide(${slide.id})" title="Delete Slide"><span class="material-symbols-outlined">delete</span></button>
        </div>`;
}

function renderTextSlide(slide, data, titleHtml) {
    let bodyHtml = `<div>${data.body || ''}</div>`;
    if (editMode) {
        bodyHtml = `
            <div class="editable-container" onclick="startEdit(${slide.id}, 'body')">
                ${bodyHtml || '<div class="slide-placeholder">[No Content]</div>'}
                <span class="material-symbols-outlined edit-marker">edit</span>
            </div>`;
    }
    return `
        <div class="slide-content">
            ${titleHtml}
            ${bodyHtml}
        </div>`;
}

function renderImageSlide(slide, data, titleHtml) {
    let descriptionHtml = '';
    if (data.description || editMode) {
        let innerDesc = data.description || (editMode ? 'Click to add a description...' : '');
        if (innerDesc) {
            if (editMode) {
                descriptionHtml = `<div class="editable-container slide-description-banner editable-desc" onclick="startEdit(${slide.id}, 'description')">
                    ${innerDesc}
                    <span class="material-symbols-outlined edit-marker">edit</span>
                </div>`;
            } else {
                descriptionHtml = `<div class="slide-description-banner">
                    ${innerDesc}
                </div>`;
            }
        }
    }

    let imgHtml = `
        <div class="slide-image-container">
            <img src="${data.imageUrl || ''}" alt="${data.title || 'Slide Image'}" style="object-position: ${data.focusX ?? 50}% ${data.focusY ?? 50}%;">
            ${descriptionHtml}
        </div>`;
    
    let imageActionHtml = '';
    if (editMode) {
        imageActionHtml = `
            <div class="editable-container editable-image-action flex-center" onclick="startEdit(${slide.id}, 'image')">
                ${imgHtml}
                <span class="material-symbols-outlined edit-marker">image</span>
            </div>`;
    } else {
        imageActionHtml = `<div class="image-action-container">${imgHtml}</div>`;
    }
    
    return `
        <div class="slide-content slide-content-image">
            <div class="gallery-slide-bg" style="background-image: url('${data.imageUrl || ''}'); background-position: ${data.focusX ?? 50}% ${data.focusY ?? 50}%;"></div>
            ${titleHtml}
            ${imageActionHtml}
        </div>`;
}

function renderProgrammeSlide(slide, data, titleHtml) {
    return `
        <div class="slide-content slide-content-programme">
            ${titleHtml}
            <div class="programme-slide-container" id="prog-container-${slide.id}" data-slide-id="${slide.id}" data-mode="${data.mode || 'next'}" data-date="${data.specificDate || ''}" data-orig-mode="${data.mode || 'next'}" data-orig-date="${data.specificDate || ''}">
                <div class="programme-loading-container"><span class="material-symbols-outlined programme-loading-spinner">autorenew</span></div>
            </div>
        </div>`;
}

function renderQRSlide(slide, data, titleHtml) {
    let descriptionHtml = '';
    if (data.description || editMode) {
        let innerDesc = data.description || (editMode ? 'Click to add a description...' : '');
        if (innerDesc) {
            if (editMode) {
                descriptionHtml = `<div class="editable-container slide-description-banner editable-desc mt-sm" onclick="startEdit(${slide.id}, 'description')">
                    ${innerDesc}
                    <span class="material-symbols-outlined edit-marker">edit</span>
                </div>`;
            } else {
                descriptionHtml = `<div class="slide-description-banner mt-sm">
                    ${innerDesc}
                </div>`;
            }
        }
    }

    const qrData = data.qrData || window.location.href;
    const styles = getComputedStyle(document.documentElement);
    const fgColor = styles.getPropertyValue('--text-light').trim() || '#FFFFFF';
    let qrSvg = '';
    try {
        const qr = new QRCode({
            content: qrData,
            padding: 4,
            width: 300,
            height: 300,
            color: fgColor,
            background: 'transparent',
            join: true
        });
        qrSvg = qr.svg();
    } catch (e) {
        console.error("QR Code Error:", e);
        qrSvg = '<div class="slide-placeholder">[Invalid QR Code Data]</div>';
    }

    let qrHtml = `
        <div class="slide-qr-container flex-col align-center mt-lg mb-lg">
            <div class="qr-svg-wrapper flex-center">
                ${qrSvg}
            </div>
            ${descriptionHtml}
        </div>`;
    
    let qrActionHtml = '';
    if (editMode) {
        qrActionHtml = `
            <div class="editable-container editable-image-action flex-center" onclick="startEdit(${slide.id}, 'qrData')">
                ${qrHtml}
                <span class="material-symbols-outlined edit-marker">qr_code</span>
            </div>`;
    } else {
        qrActionHtml = `<div class="image-action-container flex-center">${qrHtml}</div>`;
    }
    
    return `
        <div class="slide-content slide-content-qr flex-col align-center text-center">
            ${titleHtml}
            ${qrActionHtml}
        </div>`;
}

function renderSlide(slide) {
    if (slide.isDummy) {
        return renderDummySlide();
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

    try {
        const data = JSON.parse(slide.content);
        const titleHtml = renderSlideTitle(slide, data);
        let content = '';

        if (slide.type === 'text') {
            content = renderTextSlide(slide, data, titleHtml);
        } else if (slide.type === 'image') {
            content = renderImageSlide(slide, data, titleHtml);
        } else if (slide.type === 'programme') {
            content = renderProgrammeSlide(slide, data, titleHtml);
        } else if (slide.type === 'qr') {
            content = renderQRSlide(slide, data, titleHtml);
        }

        const toolbarHtml = renderSlideToolbar(slide);

        return `
            <div class="slide" id="slide-${slide.id}">
                ${toolbarHtml}
                ${content}
            </div>
        `;
    } catch(e) {
        return `<div class="slide" id="slide-${slide.id}"><h1>Error parsing slide</h1></div>`;
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
    setTimeout(loadProgrammeSlidesData, DISPLAY_CONFIG.INITIAL_LOAD_DELAY_MS);

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
        if (menuTriggerIcon) menuTriggerIcon.textContent = 'slideshow';
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
        if (menuTriggerIcon) menuTriggerIcon.textContent = 'play_circle';
    } else {
        startCarousel();
    }
}

btnNext.addEventListener('click', nextSlide);
btnPrev.addEventListener('click', prevSlide);
btnPausePlay.addEventListener('click', togglePause);

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    
    if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
    } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
    } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
    }
});

const btnLoginTrigger = document.getElementById('btn-login-trigger');
const linkAdmin = document.getElementById('link-admin');

if (btnEditMode) {
    btnEditMode.addEventListener('click', () => {
        if (!editMode) {
            enterEditMode();
        } else {
            exitEditMode();
        }
        btnEditMode.blur();
    });
}

// Load slides on start
loadActiveSet();


// --- Edit Mode Logic ---

function enterEditMode() {
    editMode = true;
    if (slideInterval) clearInterval(slideInterval);
    btnEditMode.innerHTML = '<span class="material-symbols-outlined">edit_off</span> View';
    btnEditMode.title = "Exit Edit Mode";
    
    // Switch pause icon to paused state for visual feedback
    btnPausePlay.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
    btnPausePlay.style.opacity = '0.3'; // disabled look
    btnPausePlay.style.pointerEvents = 'none';

    renderAllSlides();
}

function exitEditMode() {
    editMode = false;
    
    btnEditMode.innerHTML = '<span class="material-symbols-outlined">edit</span> Edit';
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
    
    if (field === 'image') {
        openGalleryForSlide(slideId);
        return;
    }

    currentlyEditing = { id: slideId, field: field };
    
    const slide = currentSlides.find(s => s.id == slideId);
    const data = JSON.parse(slide.content);
    const value = data[field] || '';
    
    const container = event.currentTarget;
    
    let inputHtml = '';
    if (field === 'title' || field === 'qrData') {
        inputHtml = `<input type="text" id="inline-edit-input" class="inline-edit-text" value="${value.replace(/"/g, '&quot;')}" autofocus onkeydown="if(event.key === 'Enter') { saveEdit(event); }">`;
    } else if (field === 'description') {
        inputHtml = `<textarea id="inline-edit-input" class="inline-edit-textarea" autofocus>${value}</textarea>`;
    } else {
        inputHtml = `<div id="inline-edit-editor" class="inline-edit-div">${value}</div>`;
    }
    
    container.innerHTML = `
        <div class="inline-edit-wrapper">
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
        <div class="set-item reorder-item reorder-item-flex-start" draggable="true" data-id="${s.id}">
            <span class="material-symbols-outlined drag-handle mr-sm">drag_indicator</span>
            <span class="material-symbols-outlined mr-sm icon-muted" title="${s.type}">${typeIcon}</span>
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
            <div class="gallery-img-container position-relative">
                <img src="${img.thumb_url}" class="gallery-img-item" title="${img.filename}" onclick="selectGalleryImage('${img.url}', ${img.focus_x || 50}, ${img.focus_y || 50})">
                <button class="focus-target-btn" onclick="openFocusSelector('${img.id}')" title="Set Focus Point">
                    <span class="material-symbols-outlined font-size-20">center_focus_strong</span>
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
        Toast.show(resultData.error || 'Upload failed', 'error');
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
                container.innerHTML = `<div class="prog-empty-msg"><h2>No Programme Found</h2><p>For date: ${data ? data.date : 'Unknown'}</p></div>`;
            }
        } catch (e) {
            console.error("loadProgrammeSlidesData error:", e);
            container.innerHTML = `<div class="prog-error-msg"><h2>Error loading programme</h2></div>`;
        }
    }
}

// Function to change the displayed date dynamically without saving to db
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
        }, DISPLAY_CONFIG.PROGRAMME_REVERT_TIMEOUT_MS);
    }
};

function renderProgrammeNight(container, data) {
    const night = data.night;
    const dateStr = data.date;
    const prevDate = data.prev_date;
    const nextDate = data.next_date;
    const monthNotes = data.month_comments || [];

    const slideId = container.getAttribute('data-slide-id');
    const d = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateFormatted = d.toLocaleDateString(undefined, options);
    
    let editActionHtml = '';
    if (typeof editMode !== 'undefined' && editMode) {
        editActionHtml = `<button class="btn-primary ml-md" onclick="openProgrammeSettings(${slideId})" title="Slide Settings"><span class="material-symbols-outlined">settings</span></button>`;
    }

    let prevBtnHtml = prevDate ? `<button onclick="window.shiftProgrammeSlideDate(this, '${prevDate}')" class="prog-nav-btn prog-nav-left" title="Previous Parade Night"><span class="material-symbols-outlined">chevron_left</span></button>` : '';
    let nextBtnHtml = nextDate ? `<button onclick="window.shiftProgrammeSlideDate(this, '${nextDate}')" class="prog-nav-btn prog-nav-right" title="Next Parade Night"><span class="material-symbols-outlined">chevron_right</span></button>` : '';

    let html = `<div class="prog-slide-header">
        <div class="flex-align-center">
            ${prevBtnHtml}
            ${nextBtnHtml}
            <h2 class="prog-slide-date-title">${dateFormatted}</h2>
        </div>
        <div>
            ${editActionHtml}
        </div>
    </div>`;
    
    html += `<div class="prog-slide-body">`;
    
    // Uniform & Notes side by side or stacked
    html += `<div class="prog-info-cards">`;
    
    if (night.uniform) {
        html += `
        <div class="prog-info-card prog-uniform-card">
            <h3><span class="material-symbols-outlined vertical-align-middle">checkroom</span> Uniform</h3>
            <div class="prog-uniform-text">${night.uniform}</div>
        </div>`;
    }
    
    if ((night.notes && night.notes.length > 0) || (monthNotes && monthNotes.length > 0)) {
        let notesHtml = '';
        if (night.notes && night.notes.length > 0) {
            notesHtml += night.notes.map(n => typeof n === "string" ? n.trim() : n).filter(n => n).map(n => `<li>${n}</li>`).join("");
        }
        if (monthNotes && monthNotes.length > 0) {
            if (notesHtml) notesHtml += `<hr class="prog-notes-divider">`;
            notesHtml += monthNotes.map(n => typeof n === "string" ? n.trim() : n).filter(n => n).map(n => `<li class="italic">${n}</li>`).join("");
        }

        if (notesHtml) {
            html += `
            <div class="prog-info-card prog-notes-card">
                <h3><span class="material-symbols-outlined vertical-align-middle">info</span> Notes</h3>
                <ul class="prog-notes-list">${notesHtml}</ul>
            </div>`;
        }
    }

    // Tonight's Duties
    if (night.duty_nco || night.duty_cadet) {
        html += `
        <div class="prog-info-card prog-duties-card">
            <h3><span class="material-symbols-outlined vertical-align-middle">assignment_ind</span> Duties</h3>
            <div class="prog-duties-grid">
                ${night.duty_nco ? `<div class="prog-duty-item"><span class="prog-duty-label">Duty NCO:</span> <strong>${night.duty_nco}</strong></div>` : ""}
                ${night.duty_cadet ? `<div class="prog-duty-item"><span class="prog-duty-label">Duty Cadet:</span> <strong>${night.duty_cadet}</strong></div>` : ""}
            </div>
        </div>`;
    }
    html += `</div>`;
    
    // Activities
    if (night.activities && night.activities.length > 0) {
        html += `
        <div class="prog-table-wrapper">
            <table class="prog-table">
                <thead>
                    <tr>
                        <th>Classification</th>
                        <th>Activity</th>
                        <th>Instructor</th>
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
                        <td class="class-col">${cls}</td>
                        <td class="act-col">
                            ${act.activity_type ? `<span class="prog-act-type-tag">${act.activity_type}</span>` : ''}
                            ${act.name}
                        </td>
                        <td class="inst-col">${act.instructor || '-'}</td>
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
    

    // Duties rendering removed from bottom to avoid duplication
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
            <div class="modal-content prog-settings-modal">
                <h2>Programme Slide Settings</h2>
                <input type="hidden" id="prog-slide-id">
                
                <label class="prog-form-label">Date Mode</label>
                <select id="prog-slide-mode" class="prog-form-input">
                    <option value="next">Next Parade Night</option>
                    <option value="today">Today</option>
                    <option value="specific">Specific Date</option>
                </select>
                
                <div id="prog-slide-date-container" class="hidden">
                    <label class="prog-form-label">Specific Date</label>
                    <input type="date" id="prog-slide-date" class="prog-form-input">
                </div>
                
                <div class="flex-justify-end">
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
