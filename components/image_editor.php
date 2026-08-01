<div id="unified-image-editor-modal" class="modal hidden">
    <div class="modal-content modal-lg">
        <h2 id="uie-modal-title">Edit Image</h2>
        
        <!-- File Selection State -->
        <div id="uie-upload-view" class="hidden uie-upload-state">
            <span class="material-symbols-outlined mb-sm">upload_file</span>
            <p class="mb-md text-muted">Click below to select an image from your device</p>
            <input type="file" id="uie-file-input" class="hidden" accept="image/*">
            <button id="uie-btn-select-file" class="btn btn-primary" type="button">Browse Files</button>
        </div>

        <!-- Edit State -->
        <div id="uie-edit-view" class="hidden uie-edit-state" style="display: flex; flex-wrap: wrap;">
            <!-- Top: Preview & Focus -->
            <div class="uie-preview-section" style="max-width: 60%;">
                <p class="mb-sm text-sm text-muted">Click on the image to set its central focus point. This prevents important details from being cropped out on the display board.</p>
                <div class="focus-preview-container">
                    <div id="uie-focus-container" style="position: relative; display: inline-block;">
                        <img id="uie-preview-img" src="" alt="Preview" style="max-width: 100%; max-height: 50vh;">
                        <div id="uie-focus-reticle" class="focus-reticle"></div>
                    </div>
                </div>
                <div class="mt-xs">
                    <span id="uie-focus-coords" class="text-sm font-bold">Focus: 50%, 50%</span>
                </div>
            </div>
            
            <!-- Bottom: Metadata -->
            <div class="uie-metadata-section mt-md">
                <input type="hidden" id="uie-image-id">
                <input type="hidden" id="uie-image-url">
                <input type="hidden" id="uie-image-thumb-url">
                
                <label for="uie-title-input" class="mb-xs font-bold d-block">Title</label>
                <input type="text" id="uie-title-input" class="w-full mb-md form-control" placeholder="Image Title">
                
                <label for="uie-desc-input" class="mb-xs font-bold d-block">Description</label>
                <textarea id="uie-desc-input" class="w-full mb-md form-control" rows="3" placeholder="Description"></textarea>
                
                <label class="mb-xs font-bold d-block">Tags</label>
                <div style="position:relative;">
                    <div id="uie-tags-container" class="tag-input-container">
                        <input type="text" id="uie-tag-input" class="w-full tag-input-field form-control" placeholder="Add tag...">
                    </div>
                    <div id="uie-tag-autocomplete" class="hidden tag-autocomplete-dropdown"></div>
                </div>
                <p class="text-sm text-muted mt-xs mb-lg">Press Space or Enter to add a tag.</p>
            </div>
        </div>
        
        <div class="flex-row justify-end gap-sm mt-md">
            <button id="uie-btn-cancel" class="btn btn-secondary" type="button">Cancel</button>
            <button id="uie-btn-save" class="btn btn-primary" type="button">Save Image</button>
        </div>
    </div>
</div>
