<div id="gallery-modal" class="modal hidden">
    <div class="modal-content modal-lg flex-col">
        <div class="flex-row justify-between align-center mb-md">
            <h2>Image Gallery</h2>
            <div>
                <button id="btn-upload-new" class="btn-primary">Upload New</button>
                <!-- Add Close button here so it's consistent if the view structure changes -->
            </div>
            <input type="file" id="gallery-file-input" class="hidden" accept="image/*">
        </div>
        <div id="gallery-grid-view">
            <div id="gallery-grid" class="gallery-grid">
                <!-- Images injected here -->
            </div>
            <div id="gallery-pagination" class="flex-center gap-sm mt-md">
                <!-- Will be rendered by Pagination component -->
                <button id="btn-gal-prev" class="btn-secondary">Prev</button>
                <span id="gal-page-info">Page 1 of 1</span>
                <button id="btn-gal-next" class="btn-secondary">Next</button>
            </div>
            <div class="text-right mt-md">
                <button id="btn-close-gallery" class="btn-secondary">Close</button>
            </div>
        </div>

        <!-- Focus Selector View (Used mostly by Display Board / index.php) -->
        <div id="focus-selector-view" class="hidden flex-col">
            <h3 class="mb-sm">Set Image Focus Point</h3>
            <p class="mb-md">Click on the image to set its central focus point. This prevents important details from being cropped out on the display board.</p>
            <div id="focus-preview-container" style="position: relative; display: block; margin: 0 auto; width: max-content; max-width: 100%; cursor: crosshair; border: 1px solid var(--color-muted);">
                <img id="focus-preview-img" src="" style="display: block; max-width: 100%; max-height: 50vh; width: auto; height: auto;">
                <div id="focus-reticle" style="position: absolute; width: 20px; height: 20px; border: 2px solid var(--raf-red); border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; box-shadow: 0 0 0 2px white;"></div>
            </div>
            <div class="flex-row justify-between align-center mt-md">
                <span id="focus-coords-text">Focus: 50%, 50%</span>
                <div class="flex-row gap-sm">
                    <button id="btn-focus-back" class="btn-secondary">Cancel</button>
                    <button id="btn-focus-save" class="btn-primary">Save & Select</button>
                </div>
            </div>
        </div>
    </div>
</div>
