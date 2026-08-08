import { apiFetch } from "./api.js";
import { Auth } from "./auth.js";
import { Toast } from "./components/Toast.js";
import { Pagination } from "./components/Pagination.js";
import { setupDragAndDrop } from "./utils/dragDrop.js";

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

/**
 * Closes all open modals (login, gallery, reorder) by adding the 'hidden' class.
 */
function closeAllModals() {
    [loginModal, galleryModal, reorderModal].forEach(m => {
        if (m) m.classList.add('hidden');
    });
}


// --- Edit Mode & Authentication ---

// --- Slide Rendering ---

/**
 * Renders an empty state 'dummy' slide when no slides are available, offering creation options.
 *
 * @returns {string} The HTML string for the dummy slide.
 */
function renderDummySlide() {
    return `
        <div class="slide" id="slide-dummy">
            <h1>Add New Slide</h1>
            <div class="dummy-slide-actions" style="display: flex; gap: var(--space-md); justify-content: center; flex-wrap: wrap; margin-top: 3rem;">
                <button class="dummy-slide-btn" data-action="createNewSlide" data-type="text">
                    <span class="material-symbols-outlined">description</span>
                    <span>Text Slide</span>
                </button>
                <button class="dummy-slide-btn" data-action="createNewSlide" data-type="image">
                    <span class="material-symbols-outlined">image</span>
                    <span>Image Slide</span>
                </button>
                <button class="dummy-slide-btn" data-action="createNewSlide" data-type="programme">
                    <span class="material-symbols-outlined">calendar_today</span>
                    <span>Programme Slide</span>
                </button>
                <button class="dummy-slide-btn" data-action="createNewSlide" data-type="qr">
                    <span class="material-symbols-outlined">qr_code</span>
                    <span>QR Code</span>
                </button>
            </div>
        </div>`;
}

/**
 * Renders the title element for a slide, adding inline edit markers if in edit mode.
 *
 * @param {Object} slide - The slide object.
 * @param {Object} data - The parsed configuration data of the slide.
 * @returns {string} The HTML string for the slide title.
 */
function renderSlideTitle(slide, data) {
    let titleHtml = data.title ? `<h1>${data.title}</h1>` : '';
    if (editMode) {
        titleHtml = `
            <div class="editable-container" data-action="startEdit" data-id="${slide.id}" data-field="title">
                ${titleHtml || '<h1 class="slide-placeholder">[No Title]</h1>'}
                <span class="material-symbols-outlined edit-marker">edit</span>
            </div>`;
    }
    return titleHtml;
}

/**
 * Renders the slide management toolbar (reorder, delete) when in edit mode.
 *
 * @param {Object} slide - The slide object.
 * @returns {string} The HTML string for the toolbar, or empty string if not in edit mode.
 */
function renderSlideToolbar(slide) {
    if (!editMode) return '';
    return `
        <div class="edit-toolbar">
            <button class="btn-secondary" data-action="openReorderModal" title="Reorder Slides"><span class="material-symbols-outlined">format_list_numbered</span></button>
            <button class="btn-primary" data-action="deleteSlide" data-id="${slide.id}" title="Delete Slide"><span class="material-symbols-outlined">delete</span></button>
        </div>`;
}

/**
 * Renders a text-type slide.
 *
 * @param {Object} slide - The slide object.
 * @param {Object} data - The parsed configuration data of the slide.
 * @param {string} titleHtml - The pre-rendered HTML for the title.
 * @returns {string} The HTML string for the text slide.
 */
function renderTextSlide(slide, data, titleHtml) {
    let bodyHtml = `<div>${data.body || ''}</div>`;
    if (editMode) {
        bodyHtml = `
            <div class="editable-container" data-action="startEdit" data-id="${slide.id}" data-field="body">
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

/**
 * Renders an image-type slide with art-direction (focus points) and description banners.
 *
 * @param {Object} slide - The slide object.
 * @param {Object} data - The parsed configuration data of the slide.
 * @param {string} titleHtml - The pre-rendered HTML for the title.
 * @returns {string} The HTML string for the image slide.
 */
function renderImageSlide(slide, data, titleHtml) {
    let descriptionHtml = '';
    if (data.description || editMode) {
        let innerDesc = data.description || (editMode ? 'Click to add a description...' : '');
        if (innerDesc) {
            if (editMode) {
                descriptionHtml = `<div class="editable-container slide-description-banner editable-desc" data-action="startEdit" data-id="${slide.id}" data-field="description">
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
            <div class="editable-container editable-image-action flex-center" data-action="startEdit" data-id="${slide.id}" data-field="image">
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

/**
 * Renders a programme-type slide, delegating the actual content rendering to a later asynchronous fetch.
 *
 * @param {Object} slide - The slide object.
 * @param {Object} data - The parsed configuration data of the slide.
 * @param {string} titleHtml - The pre-rendered HTML for the title.
 * @returns {string} The HTML string for the programme slide container.
 */
function renderProgrammeSlide(slide, data, titleHtml) {
    return `
        <div class="slide-content slide-content-programme">
            ${titleHtml}
            <div class="programme-slide-container" id="prog-container-${slide.id}" data-slide-id="${slide.id}" data-mode="${data.mode || 'next'}" data-date="${data.specificDate || ''}" data-orig-mode="${data.mode || 'next'}" data-orig-date="${data.specificDate || ''}">
                <div class="programme-loading-container"><span class="material-symbols-outlined programme-loading-spinner">autorenew</span></div>
            </div>
        </div>`;
}

/**
 * Renders a QR Code slide. Generates an SVG QR Code on the fly based on data.
 *
 * @param {Object} slide - The slide object.
 * @param {Object} data - The parsed configuration data of the slide.
 * @param {string} titleHtml - The pre-rendered HTML for the title.
 * @returns {string} The HTML string for the QR slide.
 */
function renderQRSlide(slide, data, titleHtml) {
    let descriptionHtml = '';
    if (data.description || editMode) {
        let innerDesc = data.description || (editMode ? 'Click to add a description...' : '');
        if (innerDesc) {
            if (editMode) {
                descriptionHtml = `<div class="editable-container slide-description-banner editable-desc mt-sm" data-action="startEdit" data-id="${slide.id}" data-field="description">
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
            <div class="editable-container editable-image-action flex-center" data-action="startEdit" data-id="${slide.id}" data-field="qrData">
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

/**
 * Renders a full slide element, dispatching to specific type renderers based on configuration.
 *
 * @param {Object} slide - The slide object containing `type` and `content`.
 * @returns {string} The HTML string for the complete slide element.
 */
function renderSlide(slide) {
    if (slide.isDummy) {
        return renderDummySlide();
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

/**
 * Loads the currently active slide set(s) from the backend API and initializes the slideshow.
 */
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

/**
 * Renders the top slideshow menu tabs if multiple slide sets are active.
 */
function renderSlideshowMenu() {
    const menu = document.getElementById('slideshow-menu');
    if (allActiveSets.length <= 1) {
        menu.classList.add('hidden');
        return;
    }
    
    menu.classList.remove('hidden');
    menu.innerHTML = allActiveSets.map(set => `
        <button class="slideshow-tab" id="tab-set-${set.id}" data-action="switchToSet" data-id="${set.id}">
            <span class="material-symbols-outlined">${set.icon || 'folder'}</span>
            ${set.name}
        </button>
    `).join('');
}

/**
 * Switches the active slide set and renders its slides.
 *
 * @param {number|string} setId - The ID of the set to switch to.
 * @param {boolean} [preserveIndex=false] - Whether to attempt to maintain the current slide index.
 */
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

/**
 * Renders all slides in the current set to the DOM and sets up the active slide.
 * Appends a dummy slide if edit mode is active.
 */
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

/**
 * Sets the active slide by index, updating DOM classes.
 *
 * @param {number} index - The index of the slide to show.
 */
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

/**
 * Advances to the next slide.
 */
function nextSlide() {
    showSlide(currentIndex + 1);
    if (!isPaused && !editMode) resetInterval();
}
/**
 * Returns to the previous slide.
 */
function prevSlide() {
    showSlide(currentIndex - 1);
    if (!isPaused && !editMode) resetInterval();
}
/**
 * Starts the automatic slideshow carousel if not paused or in edit mode.
 */
function startCarousel() {
    if (slideInterval) clearInterval(slideInterval);
    if (!isPaused && !editMode) {
        slideInterval = setInterval(nextSlide, INTERVAL_MS);
        btnPausePlay.innerHTML = '<span class="material-symbols-outlined">pause</span>';
        if (menuTriggerIcon) menuTriggerIcon.textContent = 'slideshow';
    }
}
/**
 * Resets the slideshow timer interval.
 */
function resetInterval() {
    if (slideInterval) clearInterval(slideInterval);
    if (!isPaused && !editMode) {
        slideInterval = setInterval(nextSlide, INTERVAL_MS);
    }
}
/**
 * Toggles the slideshow pause state and updates UI.
 */
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

/**
 * Enters edit mode for the slideshow.
 */
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

/**
 * Exits edit mode for the slideshow.
 */
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

/**
 * Starts an inline edit session for a specific field on a slide.
 *
 * @param {HTMLElement} container - The container element for the field.
 * @param {number|string} slideId - The ID of the slide being edited.
 * @param {string} field - The field being edited (e.g. 'title', 'body', 'image').
 */
function startEdit(container, slideId, field) {
    if (currentlyEditing) return; // Only edit one thing at a time
    
    if (field === 'image') {
        openGalleryForSlide(slideId);
        return;
    }

    currentlyEditing = { id: slideId, field: field };
    
    const slide = currentSlides.find(s => s.id == slideId);
    const data = JSON.parse(slide.content);
    const value = data[field] || '';
    
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
                <button class="btn-primary" data-action="saveEdit">Save</button>
                <button class="btn-secondary" data-action="cancelEdit">Cancel</button>
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

/**
 * Saves the current inline edit session to the API.
 *
 * @param {Event} e - The DOM event triggering the save.
 */
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

/**
 * Cancels the current inline edit session.
 *
 * @param {Event} e - The DOM event triggering the cancel.
 */
function cancelEdit(e) {
    e.stopPropagation();
    currentlyEditing = null;
    renderAllSlides();
}

/**
 * Creates a new slide via the API.
 *
 * @param {string} type - The slide type ('text', 'image', 'programme', 'qr').
 * @param {Object} data - The initial configuration data for the slide.
 */
async function createSlide(type, data) {
    if (!currentSetId) return;
    const res = await apiFetch('api/slides.php?action=create_slide', 'POST', { slide_set_id: currentSetId, type: type, ...data });
    await loadActiveSet();
    closeAllModals();
}

/**
 * Updates an existing slide via the API.
 *
 * @param {number|string} id - The ID of the slide.
 * @param {string} type - The slide type.
 * @param {Object} contentObj - The new configuration data for the slide.
 */
async function updateSlide(id, type, contentObj) {
    await apiFetch('api/slides.php?action=update_slide', 'POST', { slide_id: id, type: type, ...contentObj });
    await loadActiveSet();
    closeAllModals();
}

/**
 * Deletes a slide via the API after confirmation.
 *
 * @param {number|string} id - The ID of the slide to delete.
 */
async function deleteSlide(id) {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    await apiFetch(`api/slides.php?action=delete_slide&id=${id}`, 'DELETE');
    await loadActiveSet();
}

// --- Reorder Modal ---

/**
 * Opens the slide reordering modal.
 */
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

/**
 * Opens the image gallery modal for selecting an image for a slide.
 *
 * @param {number|string} slideId - The ID of the slide requesting the image.
 */
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
/**
 * Fetches and renders a page of the image gallery.
 */
async function fetchGallery() {
    const data = await apiFetch(`api/images.php?action=list&page=${galleryPage}`);
    
    const grid = document.getElementById('gallery-grid');
    if (data && data.images) {
        galleryImagesCache = data.images;
        grid.innerHTML = data.images.map(img => `
            <div class="gallery-img-container position-relative">
                <img src="${img.thumb_url}" class="gallery-img-item" title="${img.filename}" data-action="selectGalleryImage" data-url="${img.url}" data-focusx="${img.focus_x || 50}" data-focusy="${img.focus_y || 50}">
                <button class="focus-target-btn" data-action="openFocusSelector" data-imgid="${img.id}" title="Set Focus Point">
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
    if (window.ImageEditor) {
        window.ImageEditor.openNew({
            buttonText: 'Accept Image',
            onAccept: async (updatedImg) => {
                await selectGalleryImage(updatedImg.url, updatedImg.focus_x, updatedImg.focus_y);
            }
        });
    }
});

// Touch Swipe Capabilities
let touchStartX = 0;
let touchEndX = 0;

viewer.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
viewer.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, {passive: true});

/**
 * Handles swipe gestures to navigate slides when not in edit mode.
 */
function handleSwipe() {
    if (editMode) return; // Disable swipe in edit mode
    const threshold = 50; 
    if (touchEndX < touchStartX - threshold) nextSlide();
    if (touchEndX > touchStartX + threshold) prevSlide();
}

// Initial load


/**
 * Opens the image editor to allow focusing/editing an image from the gallery.
 *
 * @param {number|string} imgId - The ID of the image to edit.
 */
function openFocusSelector(imgId) {
    const img = galleryImagesCache.find(i => i.id == imgId);
    if (!img) return;
    
    if (window.ImageEditor) {
        window.ImageEditor.edit(img, {
            buttonText: 'Accept Image',
            onAccept: async (updatedImg) => {
                // Update local cache
                const index = galleryImagesCache.findIndex(i => i.id == updatedImg.id);
                if (index !== -1) galleryImagesCache[index] = updatedImg;
                
                await selectGalleryImage(updatedImg.url, updatedImg.focus_x, updatedImg.focus_y);
            }
        });
    }
}

/**
 * Selects an image from the gallery and applies it to the target slide.
 *
 * @param {string} url - The URL of the selected image.
 * @param {number} [focusX=50] - The X coordinate percentage for object-position focus.
 * @param {number} [focusY=50] - The Y coordinate percentage for object-position focus.
 */
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
let PROGRAMME_CONFIG = null;

/**
 * Determines if a given hex color is light (returns true) or dark (returns false) based on luma.
 *
 * @param {string} hex - The hex color string (e.g. '#ffffff').
 * @returns {boolean}
 */
function isLight(hex) {
    if (!hex) return true;
    let c = hex.substring(1);
    let rgb = parseInt(c, 16);
    let r = (rgb >> 16) & 0xff;
    let g = (rgb >>  8) & 0xff;
    let b = (rgb >>  0) & 0xff;
    let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 128;
}

/**
 * Loads the global configuration settings (e.g. slide speed) and programme configuration.
 */
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
        
        const progConfig = await apiFetch('api/programme.php?action=config');
        if (progConfig) {
            PROGRAMME_CONFIG = progConfig;
        }
    } catch (e) {
        console.error('Error loading global config', e);
    }
}

// Initialize global config on load
loadGlobalConfig();

// --- Programme Slide Logic ---
/**
 * Loads and renders data for all active programme slides.
 */
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

/**
 * Changes the displayed date of a programme slide dynamically without saving to the database.
 * Auto-pauses the slideshow and reverts back after a timeout.
 *
 * @param {HTMLElement} btn - The button element triggered to shift the date.
 * @param {string} targetDate - The target ISO date string.
 */
const shiftProgrammeSlideDate = function(btn, targetDate) {
    const c = btn.closest('.programme-slide-container');
    if (c) {
        c.setAttribute('data-mode', 'specific');
        c.setAttribute('data-date', targetDate);
        loadProgrammeSlidesData();
        
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

/**
 * Renders the UI for a single programme night into a container.
 *
 * @param {HTMLElement} container - The programme slide container element.
 * @param {Object} data - The data object containing night details, adjacent dates, and month notes.
 */
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
        editActionHtml = `<button class="btn-primary ml-md" data-action="openProgrammeSettings" data-id="${slideId}" title="Slide Settings"><span class="material-symbols-outlined">settings</span></button>`;
    }

    let prevBtnHtml = prevDate ? `<button data-action="shiftProgrammeSlideDate" data-date="${prevDate}" class="prog-nav-btn prog-nav-left" title="Previous Parade Night"><span class="material-symbols-outlined">chevron_left</span></button>` : '';
    let nextBtnHtml = nextDate ? `<button data-action="shiftProgrammeSlideDate" data-date="${nextDate}" class="prog-nav-btn prog-nav-right" title="Next Parade Night"><span class="material-symbols-outlined">chevron_right</span></button>` : '';

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
        let unifStyleStr = "";
        if (PROGRAMME_CONFIG && PROGRAMME_CONFIG.uniforms) {
            let unifObj = PROGRAMME_CONFIG.uniforms.find(u => u.name === night.uniform);
            if (unifObj && unifObj.color) {
                unifStyleStr = ` style="background-color: ${unifObj.color}; color: ${isLight(unifObj.color) ? '#000' : '#fff'}; display: inline-block; padding: 0.25rem 0.75rem; border-radius: 0.5rem;"`;
            }
        }
        
        html += `
        <div class="prog-info-card prog-uniform-card">
            <h3><span class="material-symbols-outlined vertical-align-middle">checkroom</span> Uniform</h3>
            <div class="prog-uniform-text"><span${unifStyleStr}>${night.uniform}</span></div>
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
                
                let actStyleStr = "";
                if (PROGRAMME_CONFIG && PROGRAMME_CONFIG.activity_types && act.activity_type) {
                    let typeObj = PROGRAMME_CONFIG.activity_types.find(t => t.name === act.activity_type);
                    if (typeObj && typeObj.color) {
                        actStyleStr = ` style="background-color: ${typeObj.color}; color: ${isLight(typeObj.color) ? '#000' : '#fff'};"`;
                    }
                }
                
                html += `
                    <tr style="background:${bg};">
                        <td class="class-col">${cls}</td>
                        <td class="act-col">
                            ${act.activity_type ? `<span class="prog-act-type-tag"${actStyleStr}>${act.activity_type}</span>` : ''}
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
                    <button class="btn btn-secondary" data-action="closeProgrammeSettings">Cancel</button>
                    <button class="btn btn-primary" data-action="saveProgrammeSettings">Save</button>
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

const saveProgrammeSettings = async function() {
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

// Global Event Delegation
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');
    if (action === 'createNewSlide') {
        const type = target.getAttribute('data-type');
        if (type === 'programme') {
            createSlide(type, { mode: 'next', title: 'Training Programme' });
        } else {
            createSlide(type, {});
        }
    } else if (action === 'startEdit') {
        startEdit(target, target.getAttribute('data-id'), target.getAttribute('data-field'));
    } else if (action === 'openReorderModal') {
        openReorderModal();
    } else if (action === 'deleteSlide') {
        deleteSlide(target.getAttribute('data-id'));
    } else if (action === 'switchToSet') {
        switchToSet(target.getAttribute('data-id'));
    } else if (action === 'saveEdit') {
        saveEdit(e);
    } else if (action === 'cancelEdit') {
        cancelEdit(e);
    } else if (action === 'selectGalleryImage') {
        selectGalleryImage(
            target.getAttribute('data-url'),
            parseFloat(target.getAttribute('data-focusx') || 50),
            parseFloat(target.getAttribute('data-focusy') || 50)
        );
    } else if (action === 'openFocusSelector') {
        openFocusSelector(target.getAttribute('data-imgid'));
    } else if (action === 'openProgrammeSettings') {
        openProgrammeSettings(target.getAttribute('data-id'));
    } else if (action === 'shiftProgrammeSlideDate') {
        shiftProgrammeSlideDate(target, target.getAttribute('data-date'));
    } else if (action === 'closeProgrammeSettings') {
        document.getElementById('prog-settings-modal').classList.add('hidden');
    } else if (action === 'saveProgrammeSettings') {
        saveProgrammeSettings();
    }
});
