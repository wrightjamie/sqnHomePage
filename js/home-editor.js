// js/home-editor.js

function initEditorUI() {
  const toggleBtn = document.getElementById('btn-edit-mode');
  if (toggleBtn) {
      toggleBtn.onclick = () => {
          isEditMode = true;
          document.body.classList.add('edit-mode-active');
          updateApp();
          toggleEditMode(true);
      };
  }

  Auth.onLogout(() => window.location.reload());
  Auth.onLogin(() => window.location.reload());

  const nextBgBtn = document.getElementById('btn-next-bg');
  if (nextBgBtn) {
    if (CONFIG.backgrounds && CONFIG.backgrounds.length > 1) {
      nextBgBtn.classList.remove('hidden');
      nextBgBtn.onclick = () => {
        applyBackground();
        if (bgTimer && CONFIG.bgInterval > 0) {
          clearInterval(bgTimer);
          bgTimer = setInterval(applyBackground, CONFIG.bgInterval * 60000);
        }
      };
    } else {
      nextBgBtn.classList.add('hidden');
    }
  }
}

function toggleEditMode(show) {
  const toggleBtn = document.getElementById('btn-edit-mode');
  const loginTrigger = document.getElementById('btn-login-trigger');
  const logoutBtn = document.getElementById('btn-logout');
  const adminBtn = document.getElementById('link-admin');
  
  const nextBgBtn = document.getElementById('btn-next-bg');
  const hasMultipleBgs = CONFIG.backgrounds && CONFIG.backgrounds.length > 1;
  
  if (show) {
    if(toggleBtn) toggleBtn.style.display = 'none';
    if(loginTrigger) loginTrigger.style.display = 'none';
    if(logoutBtn) logoutBtn.style.display = 'none';
    if(adminBtn) adminBtn.style.display = 'none';
    if(nextBgBtn) nextBgBtn.style.display = 'none';
    
    buildEditorDOM();
    bindEditorSettings();
    bindGalleryModal();
    renderBgList();
    
  } else if (sidebarEl) {
    if(toggleBtn) toggleBtn.style.display = '';
    if(loginTrigger) loginTrigger.style.display = '';
    if(logoutBtn) logoutBtn.style.display = '';
    if(adminBtn) adminBtn.style.display = '';
    
    if(nextBgBtn && hasMultipleBgs) nextBgBtn.style.display = 'flex';
    sidebarEl.remove();
    sidebarEl = null;
  }
}

function buildEditorDOM() {
  sidebarEl = document.createElement('div');
  sidebarEl.className = 'editor-sidebar glass-panel';
  sidebarEl.innerHTML = `
    <div class="flex-space-between-center mb-xs">
      <h3 class="m-0">Dashboard Settings</h3>
      <button id="close-editor-btn" class="btn-close-editor" title="Close Editor"><i class="ph ph-x"></i></button>
    </div>
    
    <div id="tab-settings" class="sidebar-tab-content active">
      <div class="settings-form settings-form-wrapper">
        <div class="form-group flex-shrink-0">
          <label>Page Title</label>
          <input type="text" id="setting-title" value="${CONFIG.title || ''}" />
        </div>
        <div class="form-group flex-shrink-0">
          <label>Logo URL</label>
          <input type="text" id="setting-logo" value="${CONFIG.logoUrl || ''}" placeholder="uploads/roundel.svg" />
        </div>
        <div class="form-group flex-shrink-0">
          <label>Max Width</label>
          <input type="text" id="setting-width" value="${CONFIG.maxWidth || '1400px'}" />
        </div>
        <div class="form-group flex-shrink-0">
          <label>Background Cycle (mins)</label>
          <input type="number" id="setting-bg-int" value="${CONFIG.bgInterval || 0}" min="0" />
        </div>
        <div class="form-group flex-grow-1-col">
          <div class="flex-space-between-center mb-xs flex-shrink-0">
            <label class="m-0">Background Images</label>
            <button id="add-bg-btn" type="button" class="btn btn-primary btn-sm"><span class="material-symbols-outlined icon-sm">add</span> Add from Gallery</button>
          </div>
          <div id="bg-list-container" class="bg-list-grid"></div>
        </div>
      </div>
      
      <div class="mt-sm">
        <button id="save-config-btn" class="btn btn-primary w-100" type="button"><span class="material-symbols-outlined">save</span> Save Configuration</button>
      </div>
    </div>
  `;
  document.body.appendChild(sidebarEl);
  
  document.getElementById('close-editor-btn').onclick = () => {
    isEditMode = false;
    document.body.classList.remove('edit-mode-active');
    toggleEditMode(false);
    updateApp();
  };
}

function renderBgList() {
  const container = document.getElementById('bg-list-container');
  if (!container) return;
  container.innerHTML = '';
  (CONFIG.backgrounds || []).forEach((bgUrl, i) => {
    const item = document.createElement('div');
    item.style.position = 'relative';
    item.style.width = '100%';
    item.style.paddingTop = '56.25%'; // 16:9 aspect ratio
    item.style.borderRadius = '4px';
    item.style.overflow = 'hidden';
    item.style.backgroundImage = `url('${bgUrl}')`;
    item.style.backgroundSize = 'cover';
    item.style.backgroundPosition = 'center';
    item.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
    
    const delBtn = document.createElement('button');
    delBtn.innerHTML = '<i class="ph ph-x"></i>';
    delBtn.style.position = 'absolute';
    delBtn.style.top = '4px';
    delBtn.style.right = '4px';
    delBtn.style.background = 'rgba(0,0,0,0.7)';
    delBtn.style.border = 'none';
    delBtn.style.color = 'white';
    delBtn.style.cursor = 'pointer';
    delBtn.style.borderRadius = '50%';
    delBtn.style.width = '24px';
    delBtn.style.height = '24px';
    delBtn.style.display = 'flex';
    delBtn.style.alignItems = 'center';
    delBtn.style.justifyContent = 'center';
    delBtn.title = 'Remove Background';
    
    delBtn.onclick = () => {
      CONFIG.backgrounds.splice(i, 1);
      renderBgList();
      updateApp();
    };
    
    item.appendChild(delBtn);
    container.appendChild(item);
  });
}

function bindEditorSettings() {
  const updateConfigSetting = (key, val) => {
    CONFIG[key] = val;
    updateApp();
  };

  document.getElementById('setting-title').oninput = (e) => updateConfigSetting('title', e.target.value);
  document.getElementById('setting-logo').oninput = (e) => updateConfigSetting('logoUrl', e.target.value);
  document.getElementById('setting-width').oninput = (e) => updateConfigSetting('maxWidth', e.target.value);
  document.getElementById('setting-bg-int').onchange = (e) => updateConfigSetting('bgInterval', parseFloat(e.target.value) || 0);

  document.getElementById('save-config-btn').onclick = async () => {
    const btn = document.getElementById('save-config-btn');
    const origHtml = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving...';
    
    try {
        await apiFetch('api/home.php?action=config', 'POST', CONFIG);
        btn.innerHTML = '<i class="ph ph-check"></i> Saved!';
        btn.style.background = 'rgba(0, 200, 100, 0.6)';
    } catch (err) {
        btn.innerHTML = '<i class="ph ph-warning"></i> Error';
        btn.style.background = 'rgba(200, 0, 0, 0.6)';
        console.error(err);
    }
    
    setTimeout(() => {
        btn.innerHTML = origHtml;
        btn.style.background = 'rgba(0, 100, 200, 0.6)';
    }, 3000);
  };
}

function bindGalleryModal() {
  const galleryModal = document.getElementById('gallery-modal');
  
  document.getElementById('add-bg-btn').onclick = () => {
      galleryModal.classList.remove('hidden');
      loadGallery(1); // Load first page of gallery
  };
  
  document.getElementById('btn-close-gallery').onclick = () => {
      galleryModal.classList.add('hidden');
  };
  
  document.getElementById('btn-upload-new').onclick = () => {
      document.getElementById('gallery-file-input').click();
  };
  
  document.getElementById('gallery-file-input').onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      try {
          const res = await fetch('api/images.php?action=upload', {
              method: 'POST',
              body: formData
          });
          const data = await res.json();
          if (data.success) {
              loadGallery(1);
          } else {
              alert(data.error || 'Upload failed');
          }
      } catch (err) {
          alert(err.message || 'Upload failed');
      }
  };
  
  const loadGallery = async (page) => {
      try {
          const data = await apiFetch(`api/images.php?action=list&page=${page}`);
          const grid = document.getElementById('gallery-grid');
          grid.innerHTML = data.images.map(img => `
              <div class="gallery-item gallery-item-wrapper" onclick="selectGalleryImage('${img.url}')">
                  <img src="${img.thumbnail_url || img.url}" alt="${img.title || ''}" class="gallery-item-img">
              </div>
          `).join('');
          
          const pag = new Pagination('gallery-pagination', loadGallery);
          pag.render(data.current_page, data.total_pages);
      } catch(e) {
          console.error("Gallery load error", e);
      }
  };
  
  window.selectGalleryImage = (url) => {
      if (!CONFIG.backgrounds) CONFIG.backgrounds = [];
      CONFIG.backgrounds.push(url);
      renderBgList();
      updateApp();
      galleryModal.classList.add('hidden');
  };
}

function createToolbar(label, onDelete, onAdd, onMoveUp, onMoveDown, isCol = false) {
  const tb = document.createElement('div');
  const classNameSuffix = label.toLowerCase().replace(' ', '-');
  tb.className = `edit-toolbar toolbar-${classNameSuffix}`;
  tb.innerHTML = `<span>${label}</span>`;
  
  const btnGroup = document.createElement('div');
  btnGroup.className = 'toolbar-btn-group';

  if (onMoveUp) {
    const btn = document.createElement('button');
    btn.innerHTML = isCol ? '<i class="ph ph-caret-left"></i>' : '<i class="ph ph-caret-up"></i>';
    btn.onclick = (e) => { e.stopPropagation(); onMoveUp(); };
    btnGroup.appendChild(btn);
  }
  if (onMoveDown) {
    const btn = document.createElement('button');
    btn.innerHTML = isCol ? '<i class="ph ph-caret-right"></i>' : '<i class="ph ph-caret-down"></i>';
    btn.onclick = (e) => { e.stopPropagation(); onMoveDown(); };
    btnGroup.appendChild(btn);
  }
  if (onAdd) {
    const btn = document.createElement('button');
    btn.innerHTML = '<i class="ph ph-plus"></i>';
    btn.title = label === 'Row' ? 'Add Column' : (label === 'Column' ? 'Add Widget' : 'Add Item');
    btn.onclick = (e) => { e.stopPropagation(); onAdd(); };
    btnGroup.appendChild(btn);
  }
  if (onDelete) {
    const btn = document.createElement('button');
    btn.innerHTML = '<i class="ph ph-trash"></i>';
    btn.title = "Delete";
    btn.onclick = (e) => { e.stopPropagation(); onDelete(); };
    btnGroup.appendChild(btn);
  }
  
  tb.appendChild(btnGroup);
  return tb;
}
