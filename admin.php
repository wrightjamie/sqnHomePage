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
    <link rel="icon" href="uploads/roundel.svg" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet">
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/pages/admin.css">
</head>
<body>
    <div class="admin-container">
        <h1>Display Board Admin</h1>
        <a href="index.php">Back to Display Board</a> | <a href="home.php">Back to Home</a>
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
                <h2 class="m-0">Dashboard</h2>
                <button class="btn w-auto" id="btn-logout" title="Logout"><span class="material-symbols-outlined">logout</span> Logout</button>
            </div>
            
            <div class="tabs">
                <button class="tab-btn active" data-target="tab-slides">Slide Sets</button>
                <button class="tab-btn" data-target="tab-images">Image Management</button>
                <button class="tab-btn" data-target="tab-programme">Programme Settings</button>
                <button class="tab-btn" data-target="tab-settings" id="tab-btn-settings">Settings</button>
                <button class="tab-btn hidden" data-target="tab-users" id="tab-btn-users">Users</button>
            </div>

            <div id="tab-slides" class="tab-content active">
                <form id="create-set-form" class="input-group input-group-adjacent">
                <button class="btn flex-shrink-0 w-auto" type="button" id="icon-picker-btn" popovertarget="icon-picker">
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

                <input type="text" id="new-set-name" class="flex-grow-1" placeholder="New Slide Set Name" required>
                <button class="btn w-auto flex-shrink-0" type="submit" title="Create Set"><span class="material-symbols-outlined">add_circle</span> Create</button>
            </form>

            <div class="admin-header-row">
                <h3 class="m-0">Active Slide Sets</h3>
                <button class="btn w-auto" type="button" id="btn-reorder-sets" title="Reorder Sets"><span class="material-symbols-outlined">format_list_numbered</span> Reorder</button>
            </div>
            <div id="sets-list"></div>
            

            </div> <!-- End tab-slides -->

            <div id="tab-images" class="tab-content hidden">
                <div class="flex-row justify-between align-center mb-md">
                    <h3>Image Gallery</h3>
                    <div class="flex-row gap-sm">
                        <button class="btn btn-primary w-auto m-0" type="button" id="btn-open-gallery-upload-modal" title="Upload New Image">
                            <span class="material-symbols-outlined">upload</span> Upload Image
                        </button>
                        <button class="btn btn-primary w-auto m-0" id="btn-regen-thumbs" title="Generate missing thumbnails">
                            <span class="material-symbols-outlined">autorenew</span> Regenerate Thumbnails
                        </button>
                    </div>
                </div>
                
                <div class="input-group mb-sm">
                    <input type="text" id="admin-gallery-search" class="flex-grow-1" placeholder="Search by filename, title, or description...">
                    <button class="btn btn-primary w-auto" id="btn-admin-gallery-search" type="button" >Search</button>
                </div>
                
                <div class="mb-lg">
                    <strong class="text-sm text-muted mb-xs d-block">Filter by Tag:</strong>
                    <div id="admin-gallery-tag-filter" class="admin-gallery-tag-filter">
                        <!-- Tags inserted here -->
                    </div>
                </div>
                
                <div id="admin-gallery-grid" class="admin-gallery-grid">
                    <!-- Admin Images injected here -->
                </div>
                
                <div id="admin-gallery-pagination" class="flex-center gap-sm mt-md mb-lg">
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
                    <h3 class="m-0">Programme Settings</h3>
                    <button class="btn btn-primary w-auto m-0" id="btn-save-programme" title="Save Settings">
                        <span class="material-symbols-outlined">save</span> Save Settings
                    </button>
                </div>
                
                <div class="tabs mb-lg">
                    <button class="sub-tab-btn active" data-subtarget="subtab-uniforms">Uniforms</button>
                    <button class="sub-tab-btn" data-subtarget="subtab-activities">Activity Types</button>
                    <button class="sub-tab-btn" data-subtarget="subtab-classifications">Classifications</button>
                    <button class="sub-tab-btn" data-subtarget="subtab-parades">Parade Nights</button>
                    <button class="sub-tab-btn" data-subtarget="subtab-staff">Staff</button>
                    <button class="sub-tab-btn" data-subtarget="subtab-ncos">NCOs</button>
                </div>

                <div id="subtab-uniforms" class="sub-tab-content">
                    <div id="uniforms-list" class="mb-sm"></div>
                    <div class="input-group input-group-adjacent">
                        <input type="color" id="new-uniform-color" value="#002F5F" list="brand-colors" class="admin-color-picker">
                        <input type="text" id="new-uniform-name" placeholder="Uniform Name" class="flex-grow-1 admin-input-btn-h">
                        <button class="btn btn-icon admin-input-btn-h" type="button" id="btn-add-uniform"><span class="material-symbols-outlined">add</span></button>
                    </div>
                </div>

                <div id="subtab-activities" class="sub-tab-content hidden">
                    <div id="activity-list" class="mb-sm"></div>
                    <div class="input-group input-group-adjacent">
                        <input type="color" id="new-activity-color" value="#879637" list="brand-colors" class="admin-color-picker">
                        <input type="text" id="new-activity-name" placeholder="Activity Name" class="flex-grow-1 admin-input-btn-h">
                        <button class="btn btn-icon admin-input-btn-h" type="button" id="btn-add-activity"><span class="material-symbols-outlined">add</span></button>
                    </div>
                </div>
                
                <div id="subtab-classifications" class="sub-tab-content hidden">
                    <div id="classifications-list" class="mb-sm"></div>
                    <div class="input-group input-group-adjacent">
                        <input type="text" id="new-classification-name" placeholder="Classification (e.g. Leading)" class="flex-grow-1">
                        <button class="btn btn-icon w-auto" type="button" id="btn-add-classification"><span class="material-symbols-outlined">add</span></button>
                    </div>
                </div>
                
                <div id="subtab-parades" class="sub-tab-content hidden">
                    <p class="text-sm text-muted mb-sm">Select the days your squadron parades.</p>
                    <div id="parade-nights-list" class="mb-sm admin-gallery-grid"></div>
                </div>

                <div id="subtab-staff" class="sub-tab-content hidden">
                    <div id="staff-manager-container"></div>
                </div>

                <!-- NCO Sub-Tab -->
                <div id="subtab-ncos" class="sub-tab-content hidden">
                    <div id="nco-manager-container"></div>
                </div>
            </div> <!-- End tab-programme -->

            <!-- Settings Tab -->
            <div id="tab-settings" class="tab-content hidden">
                <div class="mb-lg">
                    <h3 class="mb-sm">Display Board Settings</h3>
                    <div class="set-item mb-md flex-col items-start">
                        <label for="global-sidebar-text" class="mb-xs font-bold">Sidebar Text</label>
                        <input type="text" id="global-sidebar-text" class="mb-md w-full max-w-sm" placeholder="2459 Squadron">
                        
                        <label for="global-slide-speed" class="mb-xs font-bold">Slide Duration (seconds)</label>
                        <input type="number" id="global-slide-speed" class="mb-md w-full max-w-sm" min="1" max="60" value="10">
                        
                        <button class="btn btn-primary" type="button" id="btn-save-global-settings">Save Display Settings</button>
                    </div>
                </div>
                
                <div class="mb-lg">
                    <h3 class="mb-sm text-danger">Change Admin Password</h3>
                    <div class="set-item flex-col items-start">
                        <label for="pwd-current" class="mb-xs font-bold">Current Password</label>
                        <input type="password" id="pwd-current" class="mb-md w-full max-w-sm" required>
                        
                        <label for="pwd-new" class="mb-xs font-bold">New Password</label>
                        <input type="password" id="pwd-new" class="mb-md w-full max-w-sm" required>
                        
                        <label for="pwd-confirm" class="mb-xs font-bold">Confirm New Password</label>
                        <input type="password" id="pwd-confirm" class="mb-md w-full max-w-sm" required>
                        
                        <div id="pwd-msg" class="mb-sm font-bold"></div>
                        <button class="btn btn-primary" type="button" id="btn-change-password">Update Password</button>
                    </div>
                </div>
            </div>

            <!-- Users Tab -->
            <div id="tab-users" class="tab-content hidden">
                <div class="tabs mb-lg">
                    <button class="sub-tab-btn active" data-subtarget="subtab-user-list">Manage Users</button>
                    <button class="sub-tab-btn hidden" data-subtarget="subtab-role-list" id="subtab-btn-roles">Manage Roles</button>
                </div>
                
                <div id="subtab-user-list" class="sub-tab-content">
                    <div class="mb-lg">
                        <div class="flex-row justify-between align-center mb-sm">
                            <h3 class="m-0">User Management</h3>
                            <button class="btn btn-primary w-auto m-0" id="btn-add-user" title="Add User">
                                <span class="material-symbols-outlined">add</span> Add User
                            </button>
                        </div>
                        <div class="admin-table-container">
                            <table class="w-100 admin-table">
                                <thead>
                                    <tr  >
                                        <th class="p-sm">ID</th>
                                        <th class="p-sm">Username</th>
                                        <th class="p-sm">Display Name</th>
                                        <th class="p-sm">Status</th>
                                        <th class="p-sm">Role</th>
                                        <th class="p-sm">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="users-table-body">
                                    <!-- Users injected here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div id="subtab-role-list" class="sub-tab-content hidden">
                    <div class="flex-row justify-between align-center mb-md">
                        <h3 class="m-0">Role Capabilities</h3>
                        <button class="btn btn-primary w-auto m-0" id="btn-save-roles" title="Save Roles">
                            <span class="material-symbols-outlined">save</span> Save Roles
                        </button>
                    </div>
                    <div class="admin-table-container">
                        <table class="w-100 admin-table">
                            <thead>
                                <tr id="roles-table-head"  >
                                    <!-- Dynamic headers -->
                                </tr>
                            </thead>
                            <tbody id="roles-table-body">
                                <!-- Roles injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    </div>
    
    <!-- Image Upload Modal -->
    <div id="image-upload-modal" class="modal hidden">
        <div class="modal-content max-w-sm">
            <h2>Upload New Image</h2>
            <form id="upload-form">
                <input type="file" id="upload-file" accept="image/*" class="mb-md" required>
                <img id="upload-image-preview" class="hidden admin-img-preview-lg" src="">
                
                <label for="upload-title" class="mb-xs font-bold d-block">Title</label>
                <input type="text" id="upload-title" placeholder="Image Title" class="w-full mb-md">
                
                <label for="upload-description" class="mb-xs font-bold d-block">Description</label>
                <textarea id="upload-description" rows="3" placeholder="Description" class="w-full mb-md" ></textarea>
                
                <label class="mb-xs font-bold d-block">Tags</label>
                <div >
                    <div id="upload-tags-container" class="tag-input-container">
                        <input type="text" id="upload-tag-input" placeholder="Add tag..." class="flex-grow-1 tag-input-field">
                    </div>
                    <div id="upload-tag-autocomplete" class="hidden tag-autocomplete-dropdown">
                    </div>
                </div>
                <p class="text-sm text-muted mt-xs mb-lg">Press Space to add a tag.</p>
                
                <div class="flex-row justify-end gap-sm">
                    <button type="button" class="btn btn-secondary" id="btn-close-upload">Cancel</button>
                    <button type="submit" class="btn btn-primary"><span class="material-symbols-outlined">upload</span> Upload</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Image Metadata Modal -->
    <div id="image-metadata-modal" class="modal hidden">
        <div class="modal-content max-w-sm">
            <h2>Edit Image Metadata</h2>
            <img id="metadata-image-preview" src="" class="admin-img-preview-lg">
            
            <form id="metadata-form">
                <input type="hidden" id="metadata-image-id">
                
                <label for="metadata-title" class="mb-xs font-bold d-block">Title</label>
                <input type="text" id="metadata-title" placeholder="Image Title" class="w-full mb-md">
                
                <label for="metadata-description" class="mb-xs font-bold d-block">Description</label>
                <textarea id="metadata-description" rows="3" placeholder="Description" class="w-full mb-md" ></textarea>
                
                <label class="mb-xs font-bold d-block">Tags</label>
                <div >
                    <div id="tags-container" class="tag-input-container">
                        <!-- Tags will go here -->
                        <input type="text" id="tag-input" placeholder="Add tag..." class="flex-grow-1 tag-input-field">
                    </div>
                    <div id="tag-autocomplete" class="hidden tag-autocomplete-dropdown">
                        <!-- Autocomplete options -->
                    </div>
                </div>
                <p class="text-sm text-muted mt-xs mb-lg">Press Space to add a tag.</p>
                
                <div class="flex-row justify-end gap-sm">
                    <button class="btn btn-secondary" type="button" id="btn-close-metadata">Cancel</button>
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

    <!-- Add User Modal -->
    <div id="add-user-modal" class="modal hidden">
        <div class="modal-content max-w-sm">
            <h2>Add New User</h2>
            <form id="add-user-form">
                <label for="add-user-username" class="mb-xs font-bold d-block">Username</label>
                <input type="text" id="add-user-username" placeholder="Username" class="w-full mb-md" required>
                
                <label for="add-user-display" class="mb-xs font-bold d-block">Display Name</label>
                <input type="text" id="add-user-display" placeholder="Display Name" class="w-full mb-md">

                <label for="add-user-password" class="mb-xs font-bold d-block">Password</label>
                <input type="password" id="add-user-password" placeholder="Password" class="w-full mb-md" required>
                
                <label for="add-user-role" class="mb-xs font-bold d-block">Role</label>
                <select id="add-user-role" class="w-full mb-md">
                    <!-- Options injected here -->
                </select>

                <div class="flex-row justify-end gap-sm">
                    <button class="btn btn-secondary" type="button" id="btn-close-add-user">Cancel</button>
                    <button class="btn btn-primary" type="submit">Add User</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Admin Change User Password Modal -->
    <div id="admin-change-password-modal" class="modal hidden">
        <div class="modal-content max-w-sm">
            <h2>Change User Password</h2>
            <p id="change-password-username-display" class="mb-md font-bold"></p>
            <form id="admin-change-password-form">
                <input type="hidden" id="change-password-user-id">
                
                <label for="admin-new-password" class="mb-xs font-bold d-block">New Password</label>
                <input type="password" id="admin-new-password" placeholder="New Password" class="w-full mb-md" required>
                
                <label for="admin-confirm-password" class="mb-xs font-bold d-block">Confirm Password</label>
                <input type="password" id="admin-confirm-password" placeholder="Confirm Password" class="w-full mb-md" required>
                
                <div class="flex-row justify-end gap-sm">
                    <button class="btn btn-secondary" type="button" id="btn-close-admin-change-password">Cancel</button>
                    <button class="btn btn-primary" type="submit">Update Password</button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>
    <script src="js/utils.js?v=<?= time() ?>"></script>
    <script src="js/api.js?v=<?= time() ?>"></script>
    <script src="js/admin.js?v=<?= time() ?>"></script>
    <script src="js/programme_admin.js?v=<?= time() ?>"></script>
</body>
</html>
