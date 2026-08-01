import { apiFetch } from '../api.js';
import { Toast } from '../components/Toast.js';

/**
 * ImageEditor - Unified UI for uploading and editing images.
 * Depends on components/image_editor.php being included in the DOM.
 */
export class ImageEditor {
    static init() {
        if (this.initialized) return;
        this.modal = document.getElementById('unified-image-editor-modal');
        if (!this.modal) {
            console.error('ImageEditor modal not found in DOM.');
            return;
        }

        this.titleText = document.getElementById('uie-modal-title');
        this.uploadView = document.getElementById('uie-upload-view');
        this.editView = document.getElementById('uie-edit-view');
        
        this.fileInput = document.getElementById('uie-file-input');
        this.btnSelectFile = document.getElementById('uie-btn-select-file');
        
        this.previewImg = document.getElementById('uie-preview-img');
        this.focusContainer = document.getElementById('uie-focus-container');
        this.focusReticle = document.getElementById('uie-focus-reticle');
        this.focusCoords = document.getElementById('uie-focus-coords');
        
        this.inputId = document.getElementById('uie-image-id');
        this.inputUrl = document.getElementById('uie-image-url');
        this.inputThumbUrl = document.getElementById('uie-image-thumb-url');
        this.inputTitle = document.getElementById('uie-title-input');
        this.inputDesc = document.getElementById('uie-desc-input');
        this.tagsContainer = document.getElementById('uie-tags-container');
        this.tagInput = document.getElementById('uie-tag-input');
        this.tagAutocomplete = document.getElementById('uie-tag-autocomplete');
        
        this.btnCancel = document.getElementById('uie-btn-cancel');
        this.btnSave = document.getElementById('uie-btn-save');

        this.currentTags = [];
        this.currentFocusX = 50;
        this.currentFocusY = 50;
        
        this.onAcceptCallback = null;

        this.bindEvents();
        this.initialized = true;
    }

    static bindEvents() {
        this.btnSelectFile.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        this.btnCancel.addEventListener('click', () => this.close());
        this.btnSave.addEventListener('click', () => this.save());

        // Focus reticle logic
        this.focusContainer.addEventListener('click', (e) => {
            const rect = this.focusContainer.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
            
            this.currentFocusX = Math.round((x / rect.width) * 100);
            this.currentFocusY = Math.round((y / rect.height) * 100);
            
            this.updateFocusReticle();
        });

        // Tags logic
        this.tagInput.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                const val = this.tagInput.value.trim().toLowerCase();
                if (val && !this.currentTags.includes(val)) {
                    this.addTag(val);
                }
                this.tagInput.value = '';
                this.tagAutocomplete.classList.add('hidden');
            }
        });
        
        // Use existing tag autocomplete API
        this.tagInput.addEventListener('input', async () => {
            const val = this.tagInput.value.trim().toLowerCase();
            if (val.length < 1) {
                this.tagAutocomplete.classList.add('hidden');
                return;
            }
            try {
                const data = await apiFetch('api/images.php?action=get_tags');
                if (data.tags) {
                    const matches = data.tags.filter(t => t.toLowerCase().includes(val) && !this.currentTags.includes(t.toLowerCase()));
                    if (matches.length > 0) {
                        this.tagAutocomplete.innerHTML = matches.map(t => `<div class="tag-autocomplete-item p-xs cursor-pointer hover-bg-gray">${t}</div>`).join('');
                        this.tagAutocomplete.classList.remove('hidden');
                        this.tagAutocomplete.querySelectorAll('.tag-autocomplete-item').forEach(item => {
                            item.addEventListener('click', () => {
                                this.addTag(item.textContent.trim());
                                this.tagInput.value = '';
                                this.tagAutocomplete.classList.add('hidden');
                            });
                        });
                    } else {
                        this.tagAutocomplete.classList.add('hidden');
                    }
                }
            } catch (e) {
                console.error('Failed to fetch tags for autocomplete', e);
            }
        });
        
        // Hide autocomplete on click outside
        document.addEventListener('click', (e) => {
            if (!this.tagInput.contains(e.target) && !this.tagAutocomplete.contains(e.target)) {
                this.tagAutocomplete.classList.add('hidden');
            }
        });
    }

    static updateFocusReticle() {
        this.focusReticle.style.left = `${this.currentFocusX}%`;
        this.focusReticle.style.top = `${this.currentFocusY}%`;
        this.focusCoords.textContent = `Focus: ${this.currentFocusX}%, ${this.currentFocusY}%`;
    }

    static renderTags() {
        // Remove existing tag chips (but keep the input)
        this.tagsContainer.querySelectorAll('.tag-chip').forEach(el => el.remove());
        
        this.currentTags.forEach(tag => {
            const chip = document.createElement('div');
            chip.className = 'tag-chip';
            chip.innerHTML = `${tag} <span class="tag-chip-remove material-symbols-outlined text-sm ml-xs cursor-pointer">close</span>`;
            chip.querySelector('.tag-chip-remove').addEventListener('click', () => {
                this.currentTags = this.currentTags.filter(t => t !== tag);
                this.renderTags();
            });
            this.tagsContainer.insertBefore(chip, this.tagInput);
        });
    }

    static addTag(tag) {
        if (!this.currentTags.includes(tag)) {
            this.currentTags.push(tag);
            this.renderTags();
        }
    }

    static async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image_file', file);
        
        try {
            // Default upload sets some basic metadata
            formData.append('title', file.name.split('.')[0]);
            const res = await apiFetch('api/images.php?action=upload', 'POST', formData);
            if (res && res.url) {
                // Fetch the newly uploaded image details from the list (to get ID)
                // Upload currently only returns url. Let's fetch the latest image.
                const listData = await apiFetch('api/images.php?action=list&limit=1');
                if (listData && listData.images && listData.images.length > 0) {
                    const newImage = listData.images[0];
                    this.loadEditState(newImage);
                }
            }
        } catch (err) {
            console.error('Upload failed:', err);
            if (Toast) Toast.show('Upload failed', 'error');
            else alert('Upload failed');
        }
        this.fileInput.value = '';
    }

    static loadEditState(imgData) {
        this.uploadView.classList.add('hidden');
        this.editView.classList.remove('hidden');
        
        this.inputId.value = imgData.id || '';
        this.inputUrl.value = imgData.url || '';
        this.inputThumbUrl.value = imgData.thumb_url || '';
        this.inputTitle.value = imgData.title || '';
        this.inputDesc.value = imgData.description || '';
        
        this.currentTags = Array.isArray(imgData.tags) ? [...imgData.tags] : [];
        this.renderTags();
        
        this.currentFocusX = imgData.focus_x || 50;
        this.currentFocusY = imgData.focus_y || 50;
        this.updateFocusReticle();
        
        this.previewImg.src = imgData.url;
    }

    /**
     * Opens the editor in Upload Mode.
     * @param {Object} options - Configuration options.
     * @param {Function} options.onAccept - Called with image data when user saves/accepts.
     * @param {string} options.buttonText - Text for the primary action button.
     */
    static openNew(options = {}) {
        this.init();
        this.onAcceptCallback = options.onAccept || null;
        
        this.titleText.textContent = "Upload New Image";
        this.btnSave.textContent = options.buttonText || "Save Image";
        
        this.editView.classList.add('hidden');
        this.uploadView.classList.remove('hidden');
        
        this.modal.classList.remove('hidden');
    }

    /**
     * Opens the editor in Edit Mode for an existing image.
     * @param {Object} imgData - Existing image data object.
     * @param {Object} options - Configuration options.
     * @param {Function} options.onAccept - Called with updated image data when user saves/accepts.
     * @param {string} options.buttonText - Text for the primary action button.
     */
    static edit(imgData, options = {}) {
        this.init();
        this.onAcceptCallback = options.onAccept || null;
        
        this.titleText.textContent = "Edit Image";
        this.btnSave.textContent = options.buttonText || "Save Changes";
        
        this.loadEditState(imgData);
        this.modal.classList.remove('hidden');
    }

    static async save() {
        const id = this.inputId.value;
        // If we are in upload view and haven't uploaded yet, we can't save.
        if (!id) {
            this.close();
            return;
        }

        const payload = {
            id: id,
            title: this.inputTitle.value.trim(),
            description: this.inputDesc.value.trim(),
            tags: this.currentTags,
            focus_x: this.currentFocusX,
            focus_y: this.currentFocusY
        };

        try {
            await apiFetch('api/images.php?action=update_metadata', 'POST', payload);
            
            // Build the final image data object to pass back
            const updatedImage = {
                id: id,
                url: this.inputUrl.value,
                thumb_url: this.inputThumbUrl.value,
                title: payload.title,
                description: payload.description,
                tags: payload.tags,
                focus_x: payload.focus_x,
                focus_y: payload.focus_y
            };

            if (this.onAcceptCallback) {
                this.onAcceptCallback(updatedImage);
            }
            this.close();
        } catch (e) {
            console.error('Failed to save image', e);
            if (Toast) Toast.show('Failed to save image', 'error');
            else alert('Failed to save image');
        }
    }

    static close() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            this.onAcceptCallback = null;
        }
    }
}

// Make it globally available so inline scripts or modules can use it easily without explicit imports if needed.
window.ImageEditor = ImageEditor;
