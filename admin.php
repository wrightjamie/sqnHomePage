<?php
// admin.php
require_once 'api/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Sqn Display Board</title>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet">
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/pages/admin.css">
</head>
<body>
    <div class="admin-container">
        <h1>Display Board Admin</h1>
        <a href="index.php">Back to Display Board</a>
        <hr>

        <div id="login-section">
            <h2>Login</h2>
            <form id="login-form">
                <input type="text" id="username" placeholder="Username" required>
                <input type="password" id="password" placeholder="Password" required>
                <button class="btn" type="submit">Login</button>
            </form>
        </div>

        <div id="admin-section" class="hidden">
            <div class="flex-row justify-between align-center mb-md">
                <h2 style="margin:0;">Dashboard</h2>
                <button class="btn" id="btn-logout" style="width:auto; margin:0;" title="Logout"><span class="material-symbols-outlined">logout</span> Logout</button>
            </div>
            
            <div class="tabs">
                <button class="tab-btn active" data-target="tab-slides">Slide Sets</button>
                <button class="tab-btn" data-target="tab-images">Image Management</button>
                <button class="tab-btn" data-target="tab-programme">Programme Settings</button>
                <button class="tab-btn" data-target="tab-users" id="tab-users-btn">User Management</button>
            </div>

            <div id="tab-slides" class="tab-content active">
                <form id="create-set-form" class="input-group">
                <button class="btn" type="button" id="icon-picker-btn" popovertarget="icon-picker" style="width:7.5rem; flex-shrink:0;">
                    <span class="material-symbols-outlined" id="selected-icon-display">folder</span> Icon
                </button>
                
                <div id="icon-picker" popover>
                    <div class="icon-grid">
                        <!-- A selection of ~15 icons -->
                        <?php 
                        $icons = ['folder', 'star', 'flight', 'group', 'event', 'school', 'campaign', 'emoji_events', 'map', 'home', 'work', 'rocket', 'local_fire_department', 'military_tech', 'directions_car', 'explore'];
                        foreach($icons as $index => $icon): 
                        ?>
                        <input type="radio" name="new-set-icon" id="icon-<?php echo $icon; ?>" value="<?php echo $icon; ?>" class="icon-radio" <?php echo $index === 0 ? 'checked' : ''; ?>>
                        <label for="icon-<?php echo $icon; ?>" class="icon-label" title="<?php echo ucfirst(str_replace('_', ' ', $icon)); ?>">
                            <span class="material-symbols-outlined"><?php echo $icon; ?></span>
                        </label>
                        <?php endforeach; ?>
                    </div>
                </div>

                <input type="text" id="new-set-name" placeholder="New Slide Set Name" required style="flex-grow:1;">
                <button class="btn" type="submit" style="width:auto; flex-shrink:0;" title="Create Set"><span class="material-symbols-outlined">add_circle</span> Create</button>
            </form>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.625rem; margin-top: 1.25rem;">
                <h3 style="margin:0;">Active Slide Sets</h3>
                <button class="btn" type="button" id="btn-reorder-sets" style="width:auto; margin:0;" title="Reorder Sets"><span class="material-symbols-outlined">format_list_numbered</span> Reorder</button>
            </div>
            <div id="sets-list"></div>
            
            <hr>
            <h3>Manage Slides</h3>
            <select id="slide-set-select">
                <option value="">Select a Set...</option>
            </select>
            
            <form id="create-slide-form">
                <input type="hidden" id="edit-slide-id" value="">
                <select id="slide-type">
                    <option value="text">Text Slide</option>
                    <option value="image">Image Slide</option>
                </select>
                <input type="text" id="slide-title" placeholder="Slide Title/Header">
                <div id="slide-body-container" class="mb-sm">
                    <div id="slide-body-editor" style="height: 9.375rem; background: white;"></div>
                </div>
                <div id="image-upload-group" class="hidden">
                    <button class="btn btn-primary" type="button" id="btn-open-upload-modal" style="margin-bottom: 0.625rem; width: auto;"><span class="material-symbols-outlined">upload</span> Upload New Image</button>
                    <input type="hidden" id="slide-image-url" value="">
                    <img id="current-image-preview" class="hidden" style="max-height: 6.25rem; margin-top: 0.625rem; border-radius: 0.25rem;">
                </div>
                <div class="flex-row gap-sm">
                    <button class="btn" type="submit" id="submit-slide-btn" title="Save Slide"><span class="material-symbols-outlined">save</span> Save Slide</button>
                    <button class="btn btn-muted" type="button" id="cancel-edit-btn" class="hidden"><span class="material-symbols-outlined">cancel</span> Cancel Edit</button>
                </div>
            </form>
            
            <h3>Slides in selected set</h3>
            <div id="slides-list"></div>
            </div> <!-- End tab-slides -->

            <div id="tab-images" class="tab-content hidden">
                <div class="flex-row justify-between align-center mb-md">
                    <h3>Image Gallery</h3>
                    <div class="flex-row gap-sm">
                        <button class="btn btn-primary" type="button" id="btn-open-gallery-upload-modal"  style="width:auto; margin:0;" title="Upload New Image">
                            <span class="material-symbols-outlined">upload</span> Upload Image
                        </button>
                        <button class="btn btn-primary" id="btn-regen-thumbs" style="width:auto; margin:0;"  title="Generate missing thumbnails">
                            <span class="material-symbols-outlined">autorenew</span> Regenerate Thumbnails
                        </button>
                    </div>
                </div>
                
                <div class="input-group" class="mb-sm">
                    <input type="text" id="admin-gallery-search" placeholder="Search by filename, title, or description..." style="flex-grow: 1;">
                    <button class="btn btn-primary" id="btn-admin-gallery-search" type="button"  style="width: auto; padding: 0 0.9375rem;">Search</button>
                </div>
                
                <div class="mb-lg">
                    <strong style="display:block; margin-bottom:0.3125rem;" class="text-sm text-muted">Filter by Tag:</strong>
                    <div id="admin-gallery-tag-filter" style="display:flex; overflow-x:auto; gap:0.5rem; padding-bottom:0.5rem; scrollbar-width:thin;">
                        <!-- Tags inserted here -->
                    </div>
                </div>
                
                <div id="admin-gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(9.375rem, 1fr)); gap: 0.9375rem; margin-bottom: 0.9375rem;">
                    <!-- Admin Images injected here -->
                </div>
                
                <div id="admin-gallery-pagination" class="flex-center" class="gap-sm mt-md mb-lg">
                    <!-- Pagination goes here -->
                </div>
            </div> <!-- End tab-images -->

            <div id="tab-programme" class="tab-content hidden">
                <datalist id="brand-colors">
                    <!-- Logotype -->
                    <option value="#C60C30">Red</option>
                    <option value="#002F5F">Dark Blue</option>
                    <!-- Nav -->
                    <option value="#496C60">Nav 1</option>
                    <option value="#5482AB">Nav 2</option>
                    <option value="#51626F">Nav 3</option>
                    <!-- Accents -->
                    <option value="#E98300">Orange</option>
                    <option value="#FECB00">Yellow</option>
                    <option value="#0073CF">Bright Blue</option>
                    <!-- Supporting -->
                    <option value="#96A797">Support 1</option>
                    <option value="#879637">Support 2</option>
                    <option value="#90986B">Support 3</option>
                    <option value="#739ABC">Support 4</option>
                    <option value="#5E9CAE">Support 5</option>
                    <option value="#7D9AAA">Support 6</option>
                    <option value="#5E6A71">Support 7</option>
                    <option value="#89687C">Support 8</option>
                    <option value="#773141">Support 9</option>
                </datalist>

                <div class="flex-row justify-between align-center mb-md">
                    <h3 style="margin:0;">Programme Settings</h3>
                    <button class="btn btn-primary" id="btn-save-programme" style="width:auto; margin:0;" title="Save Settings">
                        <span class="material-symbols-outlined">save</span> Save Settings
                    </button>
                </div>
                
                <div class="tabs" class="mb-lg">
                    <button class="sub-tab-btn active" data-subtarget="subtab-uniforms">Uniforms</button>
                    <button class="sub-tab-btn" data-subtarget="subtab-activities">Activity Types</button>
                    <button class="sub-tab-btn" data-subtarget="subtab-classifications">Classifications</button>
                    <button class="sub-tab-btn" data-subtarget="subtab-parades">Parade Nights</button>
                    <button class="sub-tab-btn" data-subtarget="subtab-staff">Staff</button>
                </div>

                <div id="subtab-uniforms" class="sub-tab-content">
                    <div id="uniforms-list" class="mb-sm"></div>
                    <div class="input-group">
                        <input type="color" id="new-uniform-color" value="#002F5F" list="brand-colors" style="width: 3.125rem; padding: 0; height: 2.1875rem; border: 0.0625rem solid #ccc; cursor: pointer;">
                        <input type="text" id="new-uniform-name" placeholder="Uniform Name" style="flex-grow:1; height: 2.1875rem;">
                        <button class="btn" type="button" id="btn-add-uniform" style="width:auto; height: 2.1875rem;"><span class="material-symbols-outlined">add</span></button>
                    </div>
                </div>

                <div id="subtab-activities" class="sub-tab-content hidden">
                    <div id="activity-list" class="mb-sm"></div>
                    <div class="input-group">
                        <input type="color" id="new-activity-color" value="#879637" list="brand-colors" style="width: 3.125rem; padding: 0; height: 2.1875rem; border: 0.0625rem solid #ccc; cursor: pointer;">
                        <input type="text" id="new-activity-name" placeholder="Activity Name" style="flex-grow:1; height: 2.1875rem;">
                        <button class="btn" type="button" id="btn-add-activity" style="width:auto; height: 2.1875rem;"><span class="material-symbols-outlined">add</span></button>
                    </div>
                </div>
                
                <div id="subtab-classifications" class="sub-tab-content hidden">
                    <div id="classifications-list" class="mb-sm"></div>
                    <div class="input-group">
                        <input type="text" id="new-classification-name" placeholder="Classification (e.g. Leading)" style="flex-grow:1;">
                        <button class="btn" type="button" id="btn-add-classification" style="width:auto;"><span class="material-symbols-outlined">add</span></button>
                    </div>
                </div>
                
                <div id="subtab-parades" class="sub-tab-content hidden">
                    <p style="margin-bottom: 0.625rem; color: #666; font-size: 0.875rem;">Select the days your squadron parades.</p>
                    <div id="parade-nights-list" style="margin-bottom: 0.625rem; display: grid; gap: 0.3125rem;"></div>
                </div>

                <div id="subtab-staff" class="sub-tab-content hidden">
                    <div id="staff-list" class="mb-sm"></div>
                    <div class="input-group">
                        <button class="btn" type="button" id="rank-picker-btn" popovertarget="rank-picker" style="width:7.5rem; border-radius: 0.25rem 0 0 0.25rem; padding:0 0.3125rem; display:flex; justify-content:center; align-items:center;">
                            <img src="" id="selected-rank-display" style="width:1.875rem; height:2.8125rem; object-fit:contain; display:none;">
                            <span id="selected-rank-text">Select Rank</span>
                        </button>
                        <input type="hidden" id="new-staff-rank">
                        
                        <div id="rank-picker" popover>
                            <h4 style="margin-top:0;">Select Rank</h4>
                            <div class="icon-grid" id="rank-picker-grid" style="grid-template-columns: repeat(4, 1fr);">
                                <!-- Populated dynamically -->
                            </div>
                        </div>

                        <input type="text" id="new-staff-name" placeholder="Staff Name (e.g. Smith)" style="flex-grow:1; border-radius: 0;">
                        <button class="btn" type="button" id="btn-add-staff" style="width:auto;"><span class="material-symbols-outlined">add</span></button>
                    </div>
                </div>
            </div> <!-- End tab-programme -->

            <!-- Users Tab -->
            <div id="tab-users" class="tab-content hidden">
                <div class="flex-row justify-between align-center mb-md">
                    <h2 class="m-0">User Management</h2>
                    <button class="btn btn-primary" id="btn-add-user"><span class="material-symbols-outlined">person_add</span> Add User</button>
                </div>

                <table class="w-100" id="users-table" style="border-collapse: collapse; background: white; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <thead style="background: var(--raf-nav-2); color: white;">
                        <tr>
                            <th style="padding: 10px; text-align: left;">Username</th>
                            <th style="padding: 10px; text-align: left;">Role</th>
                            <th style="padding: 10px; text-align: left;">Status</th>
                            <th style="padding: 10px; text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-list">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div> <!-- End tab-users -->

        </div>
    </div>

    <!-- User Edit Modal -->
    <div id="user-edit-modal" class="modal hidden">
        <div class="modal-content modal-sm flex-col">
            <h2 id="user-modal-title">Edit User</h2>
            <form id="user-edit-form" class="flex-col gap-sm">
                <input type="hidden" id="edit-user-id">

                <label for="edit-user-name" class="font-bold">Username</label>
                <input type="text" id="edit-user-name" required class="p-sm">

                <div id="user-password-group" class="flex-col gap-xs">
                    <label for="edit-user-pass" class="font-bold">Password</label>
                    <input type="password" id="edit-user-pass" class="p-sm" placeholder="Leave blank to keep current">
                </div>

                <label for="edit-user-role" class="font-bold">Role</label>
                <select id="edit-user-role" class="p-sm" style="width: 100%; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;">
                    <!-- Populated by JS -->
                </select>

                <label for="edit-user-status" class="font-bold">Status</label>
                <select id="edit-user-status" class="p-sm" style="width: 100%; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;">
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="disabled">Disabled</option>
                </select>

                <div class="flex-row gap-sm justify-end mt-md">
                    <button type="button" class="btn btn-secondary" id="btn-cancel-user">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="btn-save-user">Save User</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Image Upload Modal -->
    <div id="image-upload-modal" class="modal hidden">
        <div class="modal-content" style="max-width: 37.5rem;">
            <h2>Upload New Image</h2>
            <form id="upload-form">
                <input type="file" id="upload-file" accept="image/*" class="mb-md" required>
                <img id="upload-image-preview" class="hidden" src="" style="width: 100%; max-height: 12.5rem; object-fit: contain; margin-bottom: 0.9375rem; border-radius: 0.25rem; background: #eee;">
                
                <label for="upload-title" style="display:block; margin-bottom:0.3125rem; font-weight:bold;">Title</label>
                <input type="text" id="upload-title" placeholder="Image Title" style="width:100%; margin-bottom: 0.9375rem;">
                
                <label for="upload-description" style="display:block; margin-bottom:0.3125rem; font-weight:bold;">Description</label>
                <textarea id="upload-description" rows="3" placeholder="Description" style="width:100%; margin-bottom: 0.9375rem; resize:vertical;"></textarea>
                
                <label style="display:block; margin-bottom:0.3125rem; font-weight:bold;">Tags</label>
                <div style="position: relative;">
                    <div id="upload-tags-container" style="display:flex; flex-wrap:wrap; gap:0.3125rem; margin-bottom: 0.3125rem; padding: 0.3125rem; border: 0.0625rem solid #ccc; border-radius: 0.25rem; min-height: 2.625rem; align-items:center;">
                        <input type="text" id="upload-tag-input" placeholder="Add tag..." style="border:none; outline:none; flex-grow:1; min-width:6.25rem; margin:0; padding:0; height:1.875rem;">
                    </div>
                    <div id="upload-tag-autocomplete" class="hidden" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 0.0625rem solid #ccc; border-radius: 0.25rem; max-height: 9.375rem; overflow-y: auto; box-shadow: 0 0.25rem 0.375rem rgba(0,0,0,0.1); z-index: 100;">
                    </div>
                </div>
                <p style="font-size: 0.75rem; color: #666; margin-bottom: 1.25rem; margin-top: 0.3125rem;">Press Space to add a tag.</p>
                
                <div style="display: flex; justify-content: flex-end; gap: 0.625rem;">
                    <button type="button" class="btn" id="btn-close-upload" style="background:#ccc; color:black; border-color:#aaa;">Cancel</button>
                    <button type="submit" class="btn btn-primary"><span class="material-symbols-outlined">upload</span> Upload</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Image Metadata Modal -->
    <div id="image-metadata-modal" class="modal hidden">
        <div class="modal-content" style="max-width: 37.5rem;">
            <h2>Edit Image Metadata</h2>
            <img id="metadata-image-preview" src="" style="width: 100%; max-height: 12.5rem; object-fit: contain; margin-bottom: 0.9375rem; border-radius: 0.25rem; background: #eee;">
            
            <form id="metadata-form">
                <input type="hidden" id="metadata-image-id">
                
                <label for="metadata-title" style="display:block; margin-bottom:0.3125rem; font-weight:bold;">Title</label>
                <input type="text" id="metadata-title" placeholder="Image Title" style="width:100%; margin-bottom: 0.9375rem;">
                
                <label for="metadata-description" style="display:block; margin-bottom:0.3125rem; font-weight:bold;">Description</label>
                <textarea id="metadata-description" rows="3" placeholder="Description" style="width:100%; margin-bottom: 0.9375rem; resize:vertical;"></textarea>
                
                <label style="display:block; margin-bottom:0.3125rem; font-weight:bold;">Tags</label>
                <div style="position: relative;">
                    <div id="tags-container" style="display:flex; flex-wrap:wrap; gap:0.3125rem; margin-bottom: 0.3125rem; padding: 0.3125rem; border: 0.0625rem solid #ccc; border-radius: 0.25rem; min-height: 2.625rem; align-items:center;">
                        <!-- Tags will go here -->
                        <input type="text" id="tag-input" placeholder="Add tag..." style="border:none; outline:none; flex-grow:1; min-width:6.25rem; margin:0; padding:0; height:1.875rem;">
                    </div>
                    <div id="tag-autocomplete" class="hidden" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 0.0625rem solid #ccc; border-radius: 0.25rem; max-height: 9.375rem; overflow-y: auto; box-shadow: 0 0.25rem 0.375rem rgba(0,0,0,0.1); z-index: 100;">
                        <!-- Autocomplete options -->
                    </div>
                </div>
                <p style="font-size: 0.75rem; color: #666; margin-bottom: 1.25rem; margin-top: 0.3125rem;">Press Space to add a tag.</p>
                
                <div style="display:flex; justify-content: flex-end; gap: 0.625rem;">
                    <button class="btn" type="button" id="btn-close-metadata" style="background:#ccc; color:black; border-color:#aaa;">Cancel</button>
                    <button class="btn btn-primary" type="submit" >Save Changes</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Reorder Sets Modal -->
    <div id="reorder-sets-modal" class="modal hidden">
        <div class="modal-content modal-md flex-col">
            <h2>Reorder Sets</h2>
            <p class="text-sm text-muted mb-md">Drag and drop to reorder the sets.</p>
            <div id="reorder-sets-list" class="flex-col gap-xs mb-lg reorder-list-container">
                <!-- Reorder items injected here -->
            </div>
            <div class="flex-row justify-end gap-sm">
                <button class="btn btn-secondary" type="button" id="btn-close-reorder-sets">Cancel</button>
                <button class="btn btn-primary" type="button" id="btn-save-reorder-sets">Save Order</button>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>
    <script src="js/utils.js?v=<?= time() ?>"></script>
    <script src="js/api.js?v=<?= time() ?>"></script>
    <script src="js/escape.js?v=<?= time() ?>"></script>
    <script src="js/admin.js?v=<?= time() ?>"></script>
    <script src="js/programme_admin.js?v=<?= time() ?>"></script>
    <script src="js/users_admin.js?v=<?= time() ?>"></script>
</body>
</html>
