let isEditMode = false;
let sidebarEl = null;
let CONFIG = {};

function parseSimpleMarkdown(text) {
  if (!text) return '';
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  const lines = html.split('\n');
  let inList = false;
  let parsedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.trim().startsWith('- ')) {
      if (!inList) {
        parsedLines.push('<ul class="notes-list">');
        inList = true;
      }
      parsedLines.push(`<li>${line.trim().substring(2)}</li>`);
    } else {
      if (inList) {
        parsedLines.push('</ul>');
        inList = false;
      }
      parsedLines.push(line);
    }
  }
  if (inList) {
    parsedLines.push('</ul>');
  }
  
  return parsedLines.join('\n');
}

let bgIndex = 0;
let bgTimer = null;

function applyBackground() {
  if (CONFIG.backgrounds && CONFIG.backgrounds.length > 0) {
    document.body.style.backgroundImage = `url('${CONFIG.backgrounds[bgIndex]}')`;
    bgIndex = (bgIndex + 1) % CONFIG.backgrounds.length;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
      CONFIG = await apiFetch('api/home.php?action=config');
      initApp(CONFIG);
      initEditorUI(); // Always initialize UI
  } catch(e) {
      console.error('Failed to load config');
  }
});

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

  const loginTrigger = document.getElementById('btn-login-trigger');
  if (loginTrigger) {
      loginTrigger.onclick = () => Auth.showModal();
      
      const logoutBtn = document.getElementById('btn-logout');
      if (logoutBtn) {
        logoutBtn.onclick = () => Auth.logout();
      }
      Auth.onLogout(() => window.location.reload());
      Auth.onLogin(() => window.location.reload());
  }

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
    if(toggleBtn) toggleBtn.style.display = 'flex';
    if(loginTrigger && !window.IS_LOGGED_IN) loginTrigger.style.display = 'flex';
    if(logoutBtn && window.IS_LOGGED_IN) logoutBtn.style.display = 'flex';
    if(adminBtn && window.IS_LOGGED_IN) adminBtn.style.display = 'flex';
    
    if(nextBgBtn && hasMultipleBgs) nextBgBtn.style.display = 'flex';
    sidebarEl.remove();
    sidebarEl = null;
  }
}

function buildEditorDOM() {
  sidebarEl = document.createElement('div');
  sidebarEl.className = 'editor-sidebar glass-panel';
  sidebarEl.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
      <h3 style="margin: 0;">Dashboard Settings</h3>
      <button id="close-editor-btn" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;" title="Close Editor"><i class="ph ph-x"></i></button>
    </div>
    
    <div id="tab-settings" class="sidebar-tab-content active" style="display: flex; flex-direction: column; height: calc(100% - 2.5rem);">
      <div class="settings-form" style="margin-top: 1rem; flex: 1; overflow-y: hidden; display: flex; flex-direction: column;">
        <div class="form-group" style="flex-shrink: 0;">
          <label>Page Title</label>
          <input type="text" id="setting-title" value="${CONFIG.title || ''}" />
        </div>
        <div class="form-group" style="flex-shrink: 0;">
          <label>Logo URL</label>
          <input type="text" id="setting-logo" value="${CONFIG.logoUrl || ''}" placeholder="uploads/roundel.svg" />
        </div>
        <div class="form-group" style="flex-shrink: 0;">
          <label>Max Width</label>
          <input type="text" id="setting-width" value="${CONFIG.maxWidth || '1400px'}" />
        </div>
        <div class="form-group" style="flex-shrink: 0;">
          <label>Background Cycle (mins)</label>
          <input type="number" id="setting-bg-int" value="${CONFIG.bgInterval || 0}" min="0" />
        </div>
        <div class="form-group" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-shrink: 0;">
            <label style="margin: 0;">Background Images</label>
            <button id="add-bg-btn" type="button" class="btn btn-primary" style="width: auto; margin: 0; padding: 0.25rem 0.5rem; font-size: 0.85rem;"><span class="material-symbols-outlined" style="font-size: 1rem;">add</span> Add from Gallery</button>
          </div>
          <div id="bg-list-container" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 0.625rem; flex: 1; overflow-y: auto; padding-right: 0.5rem;"></div>
        </div>
      </div>
      
      <div style="margin-top: 1rem;">
        <button id="save-config-btn" class="btn btn-primary" type="button" style="width: 100%;"><span class="material-symbols-outlined">save</span> Save Configuration</button>
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
              <div class="gallery-item" style="position:relative; cursor:pointer;" onclick="selectGalleryImage('${img.url}')">
                  <img src="${img.thumbnail_url || img.url}" alt="${img.title || ''}" style="width:100%; height:7.5rem; object-fit:cover; border-radius:0.25rem; box-shadow:0 0.125rem 0.25rem rgba(0,0,0,0.2);">
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

function updateApp() {
  initApp(CONFIG);
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

function initApp(config) {
  if (config.backgrounds && config.backgrounds.length > 0) {
    applyBackground();
    clearInterval(bgTimer);
    if (config.bgInterval > 0) {
      bgTimer = setInterval(applyBackground, config.bgInterval * 60000);
    }
  }

  document.documentElement.style.setProperty('--max-container-width', config.maxWidth || '1400px');
  document.title = config.title || "Homepage";

  const appRoot = document.getElementById('app-root');
  appRoot.innerHTML = ''; 

  if (config.layout && Array.isArray(config.layout)) {
    config.layout.forEach((node, index) => {
      appRoot.appendChild(renderNode(node, config.layout, index));
    });
  }

  if (isEditMode) {
    const addRowBtn = document.createElement('button');
    addRowBtn.className = 'add-row-btn glass-panel';
    addRowBtn.innerHTML = '<i class="ph ph-list-plus" style="font-size: 1.4rem;"></i> Add New Row';
    addRowBtn.onclick = () => {
      config.layout.push({ type: 'row', children: [] });
      updateApp();
    };
    appRoot.appendChild(addRowBtn);
  }
}

function renderNode(node, parentArray, index) {
  switch (node.type) {
    case 'row':
      return renderRow(node, parentArray, index);
    case 'column':
      return renderColumn(node, parentArray, index);
    case 'grid':
    case 'links':
      return renderGrid(node, parentArray, index);
    case 'widget':
      return renderWidget(node, parentArray, index);
    default:
      console.warn(`Unknown node type: ${node.type}`);
      return document.createElement('div');
  }
}

function renderRow(node, parentArray, index) {
  const el = document.createElement('div');
  el.className = 'row';
  
  if (isEditMode) {
    el.classList.add('edit-outline');
    const moveUp = index > 0 ? () => { [parentArray[index - 1], parentArray[index]] = [parentArray[index], parentArray[index - 1]]; updateApp(); } : null;
    const moveDown = index < parentArray.length - 1 ? () => { [parentArray[index], parentArray[index + 1]] = [parentArray[index + 1], parentArray[index]]; updateApp(); } : null;
    
    el.appendChild(createToolbar('Row', () => {
      if(confirm('Delete entire row?')) { parentArray.splice(index, 1); updateApp(); }
    }, () => {
      if(!node.children) node.children = [];
      node.children.push({ type: 'column', children: [] });
      updateApp();
    }, moveUp, moveDown));
  }

  if (node.children) {
    let gridCols = [];
    node.children.forEach((child, i) => {
      let width = child.width || '1fr';
      if (width.includes('/')) {
         const parts = width.split('/');
         width = `${parts[0].trim()}fr`; 
      } else if (!isNaN(width)) {
         width = `${width}fr`;
      }
      gridCols.push(width);
      el.appendChild(renderNode(child, node.children, i));
    });
    el.style.display = 'grid';
    el.style.gridTemplateColumns = gridCols.join(' ');
  }
  return el;
}

function renderColumn(node, parentArray, index) {
  const el = document.createElement('div');
  el.className = 'column';
  // Widths are now handled by the parent row's grid-template-columns
  if (isEditMode) {
    el.classList.add('edit-outline');
    const moveUp = index > 0 ? () => { [parentArray[index - 1], parentArray[index]] = [parentArray[index], parentArray[index - 1]]; updateApp(); } : null;
    const moveDown = index < parentArray.length - 1 ? () => { [parentArray[index], parentArray[index + 1]] = [parentArray[index + 1], parentArray[index]]; updateApp(); } : null;
    
    const tb = createToolbar('Column', () => {
      if(confirm('Delete column?')) { parentArray.splice(index, 1); updateApp(); }
    }, () => {
      const type = prompt("Add what? (type 'links', 'weather', 'time', 'notes', 'rss', 'title', or 'search')");
      if(type === 'links' || type === 'grid') {
        if(!node.children) node.children = [];
        node.children.push({ type: 'links', title: '', columns: 3, links: [] });
        updateApp();
      } else if (type === 'weather') {
        if(!node.children) node.children = [];
        node.children.push({ type: 'widget', widgetType: 'weather', locationName: 'London', latitude: 51.5, longitude: -0.1 });
        updateApp();
      } else if (type === 'time') {
        if(!node.children) node.children = [];
        node.children.push({ type: 'widget', widgetType: 'time' });
        updateApp();
      } else if (type === 'notes') {
        if(!node.children) node.children = [];
        node.children.push({ type: 'widget', widgetType: 'notes', title: 'Noticeboard', content: '' });
        updateApp();
      } else if (type === 'rss') {
        if(!node.children) node.children = [];
        node.children.push({ type: 'widget', widgetType: 'rss', title: 'BBC News', feedUrl: 'http://feeds.bbci.co.uk/news/uk/rss.xml', maxItems: 5 });
        updateApp();
      } else if (type === 'title') {
        if(!node.children) node.children = [];
        node.children.push({ type: 'widget', widgetType: 'title' });
        updateApp();
      } else if (type === 'search') {
        if(!node.children) node.children = [];
        node.children.push({ type: 'widget', widgetType: 'search' });
        updateApp();
      }
    }, moveUp, moveDown, true);
    
    const widthBtn = document.createElement('button');
    widthBtn.innerHTML = '<i class="ph ph-arrows-out-line-horizontal"></i>';
    widthBtn.title = "Set Column Width";
    widthBtn.onclick = (e) => {
      e.stopPropagation();
      const w = prompt("Enter width fraction (e.g. '1/3') or weight (e.g. '2'):", node.width || "1");
      if (w !== null) {
        if (w.trim() === '' || w.trim() === '1') delete node.width;
        else node.width = w.trim();
        updateApp();
      }
    };
    tb.querySelector('.toolbar-btn-group').prepend(widthBtn);
    
    el.appendChild(tb);
  }

  if (node.children) {
    node.children.forEach((child, i) => el.appendChild(renderNode(child, node.children, i)));
  }
  return el;
}

function renderGrid(node, parentArray, index) {
  const section = document.createElement('div');
  section.className = 'grid-section glass-panel';

  if (isEditMode) {
    section.classList.add('edit-outline');
    section.appendChild(createToolbar('Widget', () => {
      if(confirm('Delete links section?')) { parentArray.splice(index, 1); updateApp(); }
    }));
  }

  if (node.title || isEditMode) {
    const titleContainer = document.createElement('div');
    const titleEl = document.createElement('h2');
    titleEl.className = 'grid-title';
    titleEl.textContent = node.title || (isEditMode ? "(No Title)" : "");
    if (!node.title && isEditMode) {
      titleEl.style.color = "rgba(255,255,255,0.3)";
      titleEl.style.fontStyle = "italic";
    }
    
    if (isEditMode) {
      const editTitleBtn = document.createElement('button');
      editTitleBtn.className = 'inline-edit-btn';
      editTitleBtn.innerHTML = '<i class="ph ph-pencil"></i>';
      editTitleBtn.onclick = () => {
        const newTitle = prompt("Links Title (leave blank to hide):", node.title || "");
        if(newTitle !== null) { node.title = newTitle; updateApp(); }
      };
      titleEl.appendChild(editTitleBtn);
    }
    titleContainer.appendChild(titleEl);
    section.appendChild(titleContainer);
  }

  const container = document.createElement('div');
  container.className = 'grid-container';
  container.style.gridTemplateColumns = `repeat(auto-fit, minmax(220px, 1fr))`;

  const renderLinksOnly = () => {
    container.innerHTML = '';
    if (node.links) {
      node.links.forEach((link, i) => {
        const a = document.createElement('a');
        a.className = 'link-card glass-panel';
        
        const iconDiv = document.createElement('div');
        iconDiv.className = 'link-icon';
        const icon = document.createElement('i');
        icon.className = `ph ph-${link.icon || 'link'}`;
        iconDiv.appendChild(icon);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'link-content';
        const titleDiv = document.createElement('div');
        titleDiv.className = 'link-title';
        titleDiv.textContent = link.title;
        contentDiv.appendChild(titleDiv);

        a.appendChild(iconDiv);
        a.appendChild(contentDiv);

        if (isEditMode) {
          a.href = '#';
          a.classList.add('edit-link-mode');
          a.onclick = (e) => {
            e.preventDefault();
            const t = prompt("Link Title:", link.title);
            if(t !== null) link.title = t;
            const u = prompt("URL:", link.url);
            if(u !== null) link.url = u;
            const ic = prompt("Icon Name (e.g. 'globe'):", link.icon);
            if(ic !== null) link.icon = ic;
            updateApp();
          };
          
          const controls = document.createElement('div');
          controls.className = 'link-controls';
          
          const moveLeftBtn = document.createElement('button');
          moveLeftBtn.className = 'link-ctrl-btn';
          moveLeftBtn.innerHTML = '<i class="ph ph-caret-left"></i>';
          moveLeftBtn.disabled = i === 0;
          if(i===0) moveLeftBtn.style.opacity = '0.3';
          moveLeftBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            if (i > 0) {
              const temp = node.links[i];
              node.links[i] = node.links[i-1];
              node.links[i-1] = temp;
              renderLinksOnly();
              apiFetch('api/home.php?action=config', 'POST', CONFIG).catch(console.error);
            }
          };

          const moveRightBtn = document.createElement('button');
          moveRightBtn.className = 'link-ctrl-btn';
          moveRightBtn.innerHTML = '<i class="ph ph-caret-right"></i>';
          moveRightBtn.disabled = i === node.links.length - 1;
          if(i === node.links.length - 1) moveRightBtn.style.opacity = '0.3';
          moveRightBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            if (i < node.links.length - 1) {
              const temp = node.links[i];
              node.links[i] = node.links[i+1];
              node.links[i+1] = temp;
              renderLinksOnly();
              apiFetch('api/home.php?action=config', 'POST', CONFIG).catch(console.error);
            }
          };

          const delBtn = document.createElement('button');
          delBtn.className = 'link-ctrl-btn delete';
          delBtn.innerHTML = '<i class="ph ph-trash"></i>';
          delBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if(confirm('Delete link?')) { node.links.splice(i, 1); updateApp(); }
          };

          controls.appendChild(moveLeftBtn);
          controls.appendChild(moveRightBtn);
          controls.appendChild(delBtn);

          a.appendChild(controls);
        } else {
          if (link.url === '#') {
            a.href = '#';
            a.addEventListener('click', (e) => e.preventDefault());
          } else {
            a.href = link.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
          }
        }
        
        container.appendChild(a);
      });
    }

    if (isEditMode) {
      const addLinkBtn = document.createElement('button');
      addLinkBtn.className = 'link-card glass-panel add-link-btn';
      addLinkBtn.innerHTML = `
        <div class="link-icon"><i class="ph ph-plus"></i></div>
        <div class="link-content">
          <div class="link-title">Add Link</div>
        </div>
      `;
      addLinkBtn.onclick = () => {
        if(!node.links) node.links = [];
        node.links.push({ title: 'New Link', url: '#', icon: 'link' });
        updateApp();
      };
      container.appendChild(addLinkBtn);
    }
  };

  renderLinksOnly();

  section.appendChild(container);
  return section;
}

function renderWidget(node, parentArray, index) {
  const panel = document.createElement('div');
  panel.className = 'glass-panel';
  
  if (isEditMode) {
    panel.classList.add('edit-outline');
    const tb = createToolbar('Widget', () => {
      if(confirm('Delete widget?')) { parentArray.splice(index, 1); updateApp(); }
    });
    panel.appendChild(tb);
  }

  if (node.widgetType === 'title') {
    renderTitleContent(panel, node);
  } else if (node.widgetType === 'time') {
    renderTimeContent(panel, node);
  } else if (node.widgetType === 'weather') {
    renderWeatherContent(panel, node);
  } else if (node.widgetType === 'search') {
    renderSearchContent(panel, node);
  } else if (node.widgetType === 'notes') {
    renderNotesContent(panel, node);
  } else if (node.widgetType === 'rss') {
    renderRssContent(panel, node);
  }

  return panel;
}

function renderTitleContent(panel, node) {
  panel.classList.add('widget-title');
  panel.classList.remove('glass-panel'); 
  
  let logoHTML = '';
  if (CONFIG.logoUrl) {
    logoHTML = `<img src="${CONFIG.logoUrl}" class="raf-roundel" alt="Logo" style="width: 3.5rem; height: 3.5rem;">`;
  }
  
  const h1 = document.createElement('h1');
  h1.textContent = CONFIG.title || "Homepage";
  
  if (isEditMode) {
    const editTitleBtn = document.createElement('button');
    editTitleBtn.className = 'inline-edit-btn';
    editTitleBtn.innerHTML = '<i class="ph ph-pencil"></i>';
    editTitleBtn.onclick = () => {
      const newTitle = prompt("Enter new page title:", CONFIG.title);
      if (newTitle) { CONFIG.title = newTitle; updateApp(); }
    };
    h1.appendChild(editTitleBtn);
  }

  panel.insertAdjacentHTML('beforeend', logoHTML);
  panel.appendChild(h1);
}

function renderTimeContent(panel, node) {
  panel.classList.add('widget-time');
  
  const timeEl = document.createElement('div');
  timeEl.className = 'time-display';
  
  const dateEl = document.createElement('div');
  dateEl.className = 'date-display';

  const updateTime = () => {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    dateEl.textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  updateTime();
  if(!isEditMode) setInterval(updateTime, 1000);

  panel.appendChild(timeEl);
  panel.appendChild(dateEl);
}

function renderWeatherContent(panel, node) {
  panel.classList.add('widget-weather');
  
  const currentEl = document.createElement('div');
  currentEl.className = 'weather-current';
  
  const forecastEl = document.createElement('div');
  forecastEl.className = 'weather-forecast';
  
  panel.appendChild(currentEl);
  panel.appendChild(forecastEl);

  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${node.latitude}&longitude=${node.longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;

  const bindWeatherEditBtn = () => {
    if (isEditMode) {
      const btn = currentEl.querySelector('.weather-edit-btn');
      if (btn) {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const loc = prompt("Enter City/Location Name:", node.locationName);
          if (!loc || loc === node.locationName) return;
          
          btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
          try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1`);
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
              node.locationName = geoData.results[0].name;
              node.latitude = geoData.results[0].latitude;
              node.longitude = geoData.results[0].longitude;
              updateApp();
            } else {
              alert("Location not found! Please try a different name.");
              updateApp();
            }
          } catch(err) {
            alert("Error searching for location.");
            updateApp();
          }
        };
      }
      const minusBtn = currentEl.querySelector('.weather-minus-btn');
      if (minusBtn) {
        minusBtn.onclick = (e) => {
          e.stopPropagation();
          if (node.forecastDays === undefined) node.forecastDays = 4;
          if (node.forecastDays > 0) { node.forecastDays--; updateApp(); }
        };
      }
      
      const plusBtn = currentEl.querySelector('.weather-plus-btn');
      if (plusBtn) {
        plusBtn.onclick = (e) => {
          e.stopPropagation();
          if (node.forecastDays === undefined) node.forecastDays = 4;
          if (node.forecastDays < 5) { node.forecastDays++; updateApp(); }
        };
      }
    }
  };

  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error("API Error");
      const cw = data.current_weather;
      const codeMap = {
        0: { desc: 'Clear sky', icon: 'sun' },
        1: { desc: 'Mainly clear', icon: 'cloud-sun' },
        2: { desc: 'Partly cloudy', icon: 'cloud-sun' },
        3: { desc: 'Overcast', icon: 'cloud' },
        45: { desc: 'Fog', icon: 'cloud-fog' },
        48: { desc: 'Depositing rime fog', icon: 'cloud-fog' },
        51: { desc: 'Light drizzle', icon: 'cloud-rain' },
        53: { desc: 'Moderate drizzle', icon: 'cloud-rain' },
        55: { desc: 'Dense drizzle', icon: 'cloud-rain' },
        61: { desc: 'Slight rain', icon: 'cloud-rain' },
        63: { desc: 'Moderate rain', icon: 'cloud-rain' },
        65: { desc: 'Heavy rain', icon: 'cloud-rain' },
        71: { desc: 'Slight snow fall', icon: 'cloud-snow' },
        73: { desc: 'Moderate snow fall', icon: 'cloud-snow' },
        75: { desc: 'Heavy snow fall', icon: 'cloud-snow' },
        95: { desc: 'Thunderstorm', icon: 'cloud-lightning' }
      };

      const info = codeMap[cw.weathercode] || { desc: 'Unknown', icon: 'cloud' };

      currentEl.innerHTML = `
        <div class="weather-temp">
          <i class="ph ph-${info.icon}"></i> ${Math.round(cw.temperature)}°C
        </div>
        <div class="weather-desc">${info.desc}</div>
        <div class="weather-location" style="display: flex; align-items: center; justify-content: center; gap: 0.25rem;">
          ${node.locationName.toUpperCase()}
          ${isEditMode ? `
            <button class="inline-edit-btn weather-edit-btn" style="display: flex;" title="Edit Location"><i class="ph ph-pencil-simple"></i></button>
            <button class="inline-edit-btn weather-minus-btn" style="display: flex;" title="Fewer Days"><i class="ph ph-minus"></i></button>
            <button class="inline-edit-btn weather-plus-btn" style="display: flex;" title="More Days"><i class="ph ph-plus"></i></button>
          ` : ''}
        </div>
      `;
      bindWeatherEditBtn();

      const daily = data.daily;
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

      const daysToRender = node.forecastDays !== undefined ? node.forecastDays : 4;
      for (let i = 1; i <= daysToRender; i++) {
        if (!daily || !daily.time || !daily.time[i]) break;
        const date = new Date(daily.time[i]);
        const dayName = days[date.getDay()];
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const fMap = codeMap[daily.weathercode[i]] || { icon: 'cloud' };

        const dayEl = document.createElement('div');
        dayEl.className = 'forecast-day';
        dayEl.innerHTML = `
            <span class="day-name">${dayName}</span>
            <i class="ph ph-${fMap.icon}"></i>
            <span class="temps">${maxTemp}° / ${minTemp}°</span>
          `;
        forecastEl.appendChild(dayEl);
      }
    })
    .catch(err => {
      currentEl.innerHTML = `<div style="padding: 1rem;">Weather unavailable</div>`;
      if (isEditMode) {
        currentEl.innerHTML += `<div style="display:flex;justify-content:center;"><button class="inline-edit-btn weather-edit-btn" style="margin-left: 0.5rem;"><i class="ph ph-pencil"></i></button></div>`;
        bindWeatherEditBtn();
      }
    });
}

function renderSearchContent(panel, node) {
  panel.classList.add('widget-search');
  panel.classList.remove('glass-panel'); 
  panel.style.background = 'none';
  panel.style.border = 'none';
  panel.style.boxShadow = 'none';
  
  panel.innerHTML = `
    <div class="search-box" style="position: relative; width: 100%;">
      <i class="ph ph-magnifying-glass search-icon"></i>
      <input type="text" id="search-input-${node.id || Math.random().toString(36).substr(2,9)}" class="search-input" placeholder="Search Google..." />
    </div>
  `;
  
  if (!isEditMode) {
    setTimeout(() => {
      const inp = panel.querySelector('input');
      if(inp) {
        inp.addEventListener('keypress', (e) => {
          if(e.key === 'Enter' && inp.value.trim()) {
            window.open('https://www.google.com/search?q=' + encodeURIComponent(inp.value.trim()), '_blank');
            inp.value = '';
          }
        });
      }
    }, 100);
  }
}

function renderNotesContent(panel, node) {
  panel.classList.add('widget-notes');
  panel.style.padding = '1.5rem';
  
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '1rem';
  header.style.borderBottom = '0.0625rem solid rgba(255,255,255,0.1)';
  header.style.paddingBottom = '0.5rem';
  
  const title = document.createElement('h3');
  title.style.margin = '0';
  title.style.fontSize = '1.1rem';
  title.style.display = 'flex';
  title.style.alignItems = 'center';
  title.style.gap = '0.5rem';
  title.innerHTML = `<i class="ph ph-notepad"></i> ${node.title || 'Notes'}`;
  
  if (isEditMode) {
    const editTitleBtn = document.createElement('button');
    editTitleBtn.className = 'inline-edit-btn';
    editTitleBtn.innerHTML = '<i class="ph ph-pencil"></i>';
    editTitleBtn.onclick = () => {
      const newTitle = prompt("Notes Title:", node.title || "Notes");
      if(newTitle !== null) { node.title = newTitle; updateApp(); }
    };
    title.appendChild(editTitleBtn);
  }
  
  header.appendChild(title);
  panel.appendChild(header);

  const ta = document.createElement('textarea');
  ta.value = node.content || '';
  ta.placeholder = 'Type your notes here... (Auto-saves)';
  ta.style.width = '100%';
  ta.style.height = 'calc(100% - 3rem)';
  ta.style.minHeight = '150px';
  ta.style.background = 'none';
  ta.style.border = 'none';
  ta.style.color = 'white';
  ta.style.resize = 'none';
  ta.style.fontFamily = 'inherit';
  ta.style.fontSize = '0.95rem';
  ta.style.lineHeight = '1.5';
  ta.style.outline = 'none';
  
  ta.addEventListener('input', (e) => {
    node.content = e.target.value;
  });
  
  ta.addEventListener('blur', () => {
    if (!isEditMode) updateApp(); 
  });

  if (isEditMode) {
    ta.style.background = 'rgba(0,0,0,0.2)';
    ta.style.padding = '0.5rem';
    ta.style.borderRadius = '0.25rem';
  }

  panel.appendChild(ta);
}

function renderRssContent(panel, node) {
  panel.classList.add('widget-rss');
  panel.style.padding = '1.5rem';
  
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '1rem';
  header.style.borderBottom = '0.0625rem solid rgba(255,255,255,0.1)';
  header.style.paddingBottom = '0.5rem';
  
  const title = document.createElement('h3');
  title.style.margin = '0';
  title.style.fontSize = '1.1rem';
  title.style.display = 'flex';
  title.style.alignItems = 'center';
  title.style.gap = '0.5rem';
  title.innerHTML = `<i class="ph ph-rss"></i> ${node.title || 'News Feed'}`;
  
  if (isEditMode) {
    const editTitleBtn = document.createElement('button');
    editTitleBtn.className = 'inline-edit-btn';
    editTitleBtn.innerHTML = '<i class="ph ph-pencil"></i>';
    editTitleBtn.onclick = () => {
      const newTitle = prompt("Feed Title:", node.title || "News Feed");
      if(newTitle !== null) { node.title = newTitle; updateApp(); }
    };
    title.appendChild(editTitleBtn);
  }
  
  header.appendChild(title);

  if (isEditMode) {
    const editUrlBtn = document.createElement('button');
    editUrlBtn.className = 'inline-edit-btn';
    editUrlBtn.style.opacity = '1';
    editUrlBtn.innerHTML = '<i class="ph ph-link"></i> Change Feed URL';
    editUrlBtn.onclick = () => {
      const newUrl = prompt("RSS Feed URL:", node.feedUrl || "");
      if(newUrl !== null) { node.feedUrl = newUrl; updateApp(); }
    };
    header.appendChild(editUrlBtn);
  }

  panel.appendChild(header);

  const feedContainer = document.createElement('div');
  feedContainer.className = 'rss-feed-container';
  feedContainer.style.overflowY = 'auto';
  feedContainer.style.height = 'calc(100% - 3rem)';
  feedContainer.style.display = 'flex';
  feedContainer.style.flexDirection = 'column';
  feedContainer.style.gap = '0.75rem';
  panel.appendChild(feedContainer);

  if (!node.feedUrl) {
    feedContainer.innerHTML = '<div style="opacity:0.5; font-style:italic;">No feed URL configured. Edit widget to add one.</div>';
    return;
  }

  feedContainer.innerHTML = '<div style="opacity:0.5;"><i class="ph ph-spinner ph-spin"></i> Loading feed...</div>';

  const r2d2Url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(node.feedUrl)}`;
  fetch(r2d2Url)
    .then(res => res.json())
    .then(data => {
      if(data.status !== 'ok') throw new Error('Feed error');
      
      feedContainer.innerHTML = '';
      const items = data.items.slice(0, 5);
      if(items.length === 0) {
        feedContainer.innerHTML = '<div style="opacity:0.5;">No items found.</div>';
        return;
      }
      
      items.forEach(item => {
        const a = document.createElement('a');
        a.href = isEditMode ? '#' : item.link;
        if(!isEditMode) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        }
        a.style.display = 'block';
        a.style.textDecoration = 'none';
        a.style.color = 'white';
        a.style.background = 'rgba(0,0,0,0.2)';
        a.style.padding = '0.75rem';
        a.style.borderRadius = '0.25rem';
        a.style.transition = 'background 0.2s';
        a.onmouseover = () => a.style.background = 'rgba(0,0,0,0.4)';
        a.onmouseout = () => a.style.background = 'rgba(0,0,0,0.2)';
        
        const dt = new Date(item.pubDate);
        const dateStr = dt.toLocaleDateString('en-GB', {day:'numeric', month:'short'});
        
        a.innerHTML = `
          <div style="font-weight: 500; margin-bottom: 0.25rem; font-size: 0.95rem; line-height: 1.3;">${item.title}</div>
          <div style="font-size: 0.75rem; color: var(--raf-light-blue);">${dateStr}</div>
        `;
        feedContainer.appendChild(a);
      });
    })
    .catch(err => {
      feedContainer.innerHTML = '<div style="color: #ffaa00;"><i class="ph ph-warning"></i> Could not load feed.</div>';
    });
}
