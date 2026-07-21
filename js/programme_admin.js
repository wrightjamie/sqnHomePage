// js/programme_admin.js
document.addEventListener('DOMContentLoaded', () => {
    let progConfig = { uniforms: [], activity_types: [], classifications: [], parade_nights: [], ranks: [], staff: [] };

    // Rank SVGs mapping
    const rankSvgMap = {
        'Cdt': 'cdt.svg', 'Cpl': 'cpl.svg', 'Sgt': 'sgt.svg', 'FSgt': 'fsgt.svg',
        'FS': 'fsgt.svg', 'CWO': 'cwo.svg', 'CI': 'ci.svg', 'Plt Off': 'plt_off.svg',
        'Fg Off': 'fg_off.svg', 'Flt Lt': 'flt_lt.svg', 'Sqn Ldr': 'sqn_ldr.svg', 
        'Wg Cdr': 'wg_cdr.svg', 'WO': 'wo.svg'
    };
    function getRankSvg(rank) {
        return rankSvgMap[rank] ? `images/ranks/${rankSvgMap[rank]}` : `images/ranks/cdt.svg`;
    }

    const btnSave = document.getElementById('btn-save-programme');
    
    // Subtabs logic
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subTabContents = document.querySelectorAll('.sub-tab-content');

    function switchSubTab(targetId) {
        subTabContents.forEach(c => c.classList.add('hidden'));
        subTabBtns.forEach(b => b.classList.remove('active'));
        document.getElementById(targetId).classList.remove('hidden');
        document.querySelector(`.sub-tab-btn[data-subtarget="${targetId}"]`).classList.add('active');
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('subtab', targetId.replace('subtab-', ''));
        window.history.replaceState({}, '', url);
    }

    subTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchSubTab(btn.getAttribute('data-subtarget'));
        });
    });

    // Load initial subtab from URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('subtab')) {
        const target = `subtab-${urlParams.get('subtab')}`;
        if (document.getElementById(target)) switchSubTab(target);
    }

    // Generic list renderer
    function renderList(containerId, items, config) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        if (!items) return;

        items.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'set-item reorder-item';
            div.draggable = true;
            div.dataset.id = i;
            div.style.cursor = 'grab';

            // Start common HTML
            let html = `<div class="flex-row align-center flex-1 gap-sm">
                        <span class="material-symbols-outlined drag-handle">drag_indicator</span>`;
            
            html += config.renderInner(item, i);
            
            html += `</div>`;
            
            if (!config.hideRemove) {
                html += `<button class="btn btn-remove btn-remove-item" data-index="${i}" title="Remove"><span class="material-symbols-outlined">delete</span></button>`;
            }
            
            div.innerHTML = html;
            
            // Bind edit events
            if (config.bindEvents) config.bindEvents(div, item, i);

            // Bind remove
            if (!config.hideRemove) {
                div.querySelector('.btn-remove').addEventListener('click', () => config.onRemove(i));
            }
            
            container.appendChild(div);
        });

        setupDragAndDrop(container, (newOrder) => {
            config.onReorder(newOrder.map(oldIdx => items[oldIdx]));
        });
    }

    function editableTextBinding(el, selector, onSave) {
        const span = el.querySelector(selector);
        if(!span) return;
        span.style.cursor = 'pointer';
        span.title = 'Click to edit';
        span.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = span.textContent;
            input.style.padding = '2px 5px';
            input.style.fontSize = 'inherit';
            input.style.fontFamily = 'inherit';
            
            const save = () => {
                if (input.value.trim() && input.value !== span.textContent) {
                    onSave(input.value.trim());
                } else {
                    span.style.display = '';
                    input.remove();
                }
            };
            
            input.addEventListener('blur', save);
            input.addEventListener('keypress', (e) => { if(e.key === 'Enter') input.blur(); });
            
            span.style.display = 'none';
            span.parentNode.insertBefore(input, span.nextSibling);
            input.focus();
        });
    }

    function editableColorBinding(el, selector, onSave) {
        const colorBox = el.querySelector(selector);
        if(!colorBox) return;
        
        colorBox.style.cursor = 'pointer';
        colorBox.title = 'Click to edit color';
        colorBox.innerHTML = ''; // clear any existing

        const input = document.createElement('input');
        input.type = 'color';
        input.value = rgbToHex(colorBox.style.backgroundColor);
        input.setAttribute('list', 'brand-colors'); // Include brand colors datalist
        
        // Fill the parent so clicks hit the input natively
        input.style.position = 'absolute';
        input.style.top = '0';
        input.style.left = '0';
        input.style.opacity = '0';
        input.style.width = '100%';
        input.style.height = '100%';
        input.style.border = 'none';
        input.style.padding = '0';
        input.style.margin = '0';
        input.style.cursor = 'pointer';
        
        input.addEventListener('input', () => {
            colorBox.style.backgroundColor = input.value;
        });
        input.addEventListener('change', () => {
            onSave(input.value);
        });
        
        colorBox.appendChild(input);
    }

    function rgbToHex(rgb) {
        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!match) return rgb; // might already be hex
        return "#" + match.slice(1).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
    }

    // --- Uniforms ---
    function renderUniforms() {
        renderList('uniforms-list', progConfig.uniforms, {
            renderInner: (u, i) => `
                <div class="edit-color color-swatch" style="background-color: ${u.color};"></div>
                <span class="edit-text">${u.name}</span>
            `,
            bindEvents: (div, u, i) => {
                editableTextBinding(div, '.edit-text', (newVal) => { u.name = newVal; renderUniforms(); });
                editableColorBinding(div, '.edit-color', (newVal) => { u.color = newVal; renderUniforms(); });
            },
            onRemove: (i) => { progConfig.uniforms.splice(i, 1); renderUniforms(); },
            onReorder: (newArr) => { progConfig.uniforms = newArr; renderUniforms(); }
        });
    }

    document.getElementById('btn-add-uniform').addEventListener('click', () => {
        const name = document.getElementById('new-uniform-name').value.trim();
        const color = document.getElementById('new-uniform-color').value;
        if(name) {
            if(!progConfig.uniforms) progConfig.uniforms = [];
            progConfig.uniforms.push({name, color});
            document.getElementById('new-uniform-name').value = '';
            renderUniforms();
        }
    });

    // --- Activities ---
    function renderActivityTypes() {
        renderList('activity-list', progConfig.activity_types, {
            renderInner: (a, i) => `
                <div class="edit-color color-swatch" style="background-color: ${a.color};"></div>
                <span class="edit-text">${a.name}</span>
            `,
            bindEvents: (div, a, i) => {
                editableTextBinding(div, '.edit-text', (newVal) => { a.name = newVal; renderActivityTypes(); });
                editableColorBinding(div, '.edit-color', (newVal) => { a.color = newVal; renderActivityTypes(); });
            },
            onRemove: (i) => { progConfig.activity_types.splice(i, 1); renderActivityTypes(); },
            onReorder: (newArr) => { progConfig.activity_types = newArr; renderActivityTypes(); }
        });
    }

    document.getElementById('btn-add-activity').addEventListener('click', () => {
        const name = document.getElementById('new-activity-name').value.trim();
        const color = document.getElementById('new-activity-color').value;
        if(name) {
            if(!progConfig.activity_types) progConfig.activity_types = [];
            progConfig.activity_types.push({name, color});
            document.getElementById('new-activity-name').value = '';
            renderActivityTypes();
        }
    });

    // --- Classifications ---
    function renderClassifications() {
        renderList('classifications-list', progConfig.classifications, {
            renderInner: (c, i) => `<span class="edit-text">${c}</span>`,
            bindEvents: (div, c, i) => {
                editableTextBinding(div, '.edit-text', (newVal) => { progConfig.classifications[i] = newVal; renderClassifications(); });
            },
            onRemove: (i) => { progConfig.classifications.splice(i, 1); renderClassifications(); },
            onReorder: (newArr) => { progConfig.classifications = newArr; renderClassifications(); }
        });
    }

    document.getElementById('btn-add-classification').addEventListener('click', () => {
        const cls = document.getElementById('new-classification-name').value.trim();
        if(cls) {
            if(!progConfig.classifications) progConfig.classifications = [];
            progConfig.classifications.push(cls);
            document.getElementById('new-classification-name').value = '';
            renderClassifications();
        }
    });

    // --- Parade Nights ---
    function renderParadeNights() {
        const container = document.getElementById('parade-nights-list');
        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.gap = 'var(--space-sm)';
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (!progConfig.parade_nights) progConfig.parade_nights = [];
        
        days.forEach(day => {
            const isActive = progConfig.parade_nights.includes(day);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn';
            btn.style.borderRadius = '50px';
            btn.style.padding = '0.5rem 1rem';
            btn.style.transition = 'all 0.2s ease';
            
            if (isActive) {
                btn.style.background = 'var(--color-primary)';
                btn.style.color = '#fff';
                btn.style.border = '1px solid var(--color-primary)';
            } else {
                btn.style.background = '#f0f0f0';
                btn.style.color = 'var(--color-text)';
                btn.style.border = '1px solid #ccc';
            }
            
            btn.innerHTML = `<span style="font-weight: 500;">${day}</span>`;
            
            btn.addEventListener('click', () => {
                if (progConfig.parade_nights.includes(day)) {
                    progConfig.parade_nights = progConfig.parade_nights.filter(d => d !== day);
                } else {
                    progConfig.parade_nights.push(day);
                }
                
                // Sort array to keep chronological order
                progConfig.parade_nights.sort((a, b) => days.indexOf(a) - days.indexOf(b));
                
                saveConfig();
                renderParadeNights();
            });
            
            container.appendChild(btn);
        });
    }

    // --- Staff ---
    class PersonnelManager {
        constructor(config) {
            this.containerId = config.containerId;
            this.title = config.title;
            this.ranks = config.ranks || [];
            this.loadFn = config.loadFn;
            this.addFn = config.addFn;
            this.editFn = config.editFn;
            this.deleteFn = config.deleteFn;
            this.reorderFn = config.reorderFn;
            this.items = [];
            
            // Unique IDs for popover and inputs
            this.managerId = this.containerId.replace('-container', '');
            this.popoverId = `rank-picker-${this.managerId}`;
            this.btnId = `btn-rank-${this.managerId}`;

            this.renderShell();
            this.load();
        }

        renderShell() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            container.innerHTML = `
                <h4 class="mb-sm text-muted">${this.title}</h4>
                <div id="${this.managerId}-list" class="flex-col gap-xs mb-md admin-list-container"></div>
                <div class="input-group input-group-adjacent" style="position: relative;">
                    <button class="btn admin-input-btn-h w-auto" type="button" id="${this.btnId}" popovertarget="${this.popoverId}" style="anchor-name: --${this.btnId};">
                        <img src="" id="${this.managerId}-rank-display" class="admin-rank-preview hidden">
                        <span id="${this.managerId}-rank-text">Select Rank</span>
                    </button>
                    <input type="hidden" id="${this.managerId}-new-rank">
                    
                    <div id="${this.popoverId}" popover class="rank-picker-popover" style="position-anchor: --${this.btnId};">
                        <h4 class="mt-0">Select Rank</h4>
                        <div class="icon-grid" id="${this.managerId}-rank-grid">
                            <!-- Populated dynamically -->
                        </div>
                    </div>

                    <input type="text" id="${this.managerId}-new-name" placeholder="Name (e.g. Smith)" class="flex-grow-1">
                    <button class="btn btn-icon w-auto" type="button" id="${this.managerId}-btn-add"><span class="material-symbols-outlined">add</span></button>
                </div>
            `;

            this.populateRankPicker();

            const btnAdd = document.getElementById(`${this.managerId}-btn-add`);
            const nameInput = document.getElementById(`${this.managerId}-new-name`);
            
            const handleAdd = async () => {
                const name = nameInput.value.trim();
                const rank = document.getElementById(`${this.managerId}-new-rank`).value;
                if (name && rank) {
                    await this.addFn(name, rank);
                    nameInput.value = '';
                    document.getElementById(`${this.managerId}-new-rank`).value = '';
                    document.getElementById(`${this.managerId}-rank-text`).style.display = 'inline';
                    document.getElementById(`${this.managerId}-rank-display`).style.display = 'none';
                    this.load();
                } else {
                    if (typeof Toast !== 'undefined') Toast.show('Please select a rank and enter a name.', 'error');
                }
            };

            btnAdd.addEventListener('click', handleAdd);
            nameInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') handleAdd();
            });
        }

        populateRankPicker() {
            const grid = document.getElementById(`${this.managerId}-rank-grid`);
            grid.innerHTML = '';
            this.ranks.forEach(r => {
                const label = document.createElement('label');
                label.style.display = 'flex';
                label.style.flexDirection = 'column';
                label.style.alignItems = 'center';
                label.style.cursor = 'pointer';
                label.style.padding = '5px';
                label.style.border = '1px solid transparent';
                label.style.borderRadius = '4px';

                label.innerHTML = `
                    <input type="radio" name="${this.managerId}_rank_select" value="${r}" class="hidden">
                    <img src="${getRankSvg(r)}" class="rank-svg-lg">
                    <span class="text-sm text-center">${r}</span>
                `;
                
                label.querySelector('input').addEventListener('change', () => {
                    document.getElementById(`${this.managerId}-new-rank`).value = r;
                    document.getElementById(`${this.managerId}-rank-text`).style.display = 'none';
                    const img = document.getElementById(`${this.managerId}-rank-display`);
                    img.src = getRankSvg(r);
                    img.style.display = 'block';
                    document.getElementById(this.popoverId).hidePopover();
                });

                grid.appendChild(label);
            });
        }

        async load() {
            this.items = await this.loadFn();
            this.renderList();
        }

        renderList() {
            renderList(`${this.managerId}-list`, this.items, {
                renderInner: (item, i) => `
                    <img src="${getRankSvg(item.rank)}" class="rank-svg-sm">
                    <span class="edit-text-rank clickable-rank" title="Click to change rank">${item.rank}</span> 
                    <span class="edit-text-name">${item.name}</span>
                `,
                bindEvents: (div, item, i) => {
                    editableTextBinding(div, '.edit-text-name', async (newVal) => { 
                        await this.editFn(item, newVal, item.rank); 
                        this.load(); 
                    });
                    editableTextBinding(div, '.edit-text-rank', async (newVal) => { 
                        await this.editFn(item, item.name, newVal); 
                        this.load(); 
                    });
                },
                onRemove: async (i) => {
                    const item = this.items[i];
                    if(confirm(`Remove ${item.rank} ${item.name}?`)) {
                        await this.deleteFn(item, i);
                        this.load();
                        if(typeof Toast !== 'undefined') Toast.show('Removed', 'success');
                    }
                },
                onReorder: async (newArr) => {
                    await this.reorderFn(newArr);
                    this.load();
                }
            });
        }
    }

    // --- Main ---
    async function loadConfig() {
        try {
            const data = await apiFetch('api/programme.php?action=config');
            if(data) progConfig = data;
        } catch(e) {
            console.error('Failed to load programme config');
        }
        renderUniforms();
        renderActivityTypes();
        renderClassifications();
        renderParadeNights();

        // Instantiate Staff Manager
        new PersonnelManager({
            containerId: 'staff-manager-container',
            title: 'Manage Staff',
            ranks: progConfig.ranks || [],
            loadFn: async () => progConfig.staff || [],
            addFn: async (name, rank) => {
                if(!progConfig.staff) progConfig.staff = [];
                progConfig.staff.push({name, rank});
            },
            editFn: async (item, name, rank) => {
                item.name = name;
                item.rank = rank;
            },
            deleteFn: async (item, i) => {
                progConfig.staff.splice(i, 1);
            },
            reorderFn: async (newArr) => {
                progConfig.staff = newArr;
            }
        });

        // Instantiate NCO Manager
        new PersonnelManager({
            containerId: 'nco-manager-container',
            title: 'Manage Duty NCOs',
            ranks: ['Cpl', 'Sgt', 'FS', 'CWO'],
            loadFn: async () => await apiFetch('api/ncos.php'),
            addFn: async (name, rank) => {
                await apiFetch('api/ncos.php', 'POST', { name, rank });
            },
            editFn: async (item, name, rank) => {
                await apiFetch('api/ncos.php', 'PUT', { id: item.id, name, rank });
            },
            deleteFn: async (item, i) => {
                await apiFetch('api/ncos.php', 'DELETE', {id: item.id});
            },
            reorderFn: async (newArr) => {
                const orderedIds = newArr.map(nco => nco.id);
                await apiFetch('api/ncos.php?action=reorder', 'POST', { ordered_ids: orderedIds });
            }
        });
    }

    btnSave.addEventListener('click', async () => {
        const originalText = btnSave.innerHTML;
        btnSave.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 2s linear infinite;">autorenew</span> Saving...';
        btnSave.disabled = true;

        try {
            await apiFetch('api/programme.php?action=config', 'POST', progConfig);
            
            btnSave.innerHTML = '<span class="material-symbols-outlined mr-sm">check</span> Saved!';
            btnSave.style.background = 'rgba(0, 200, 100, 0.6)';
            setTimeout(() => {
                btnSave.innerHTML = originalText;
                btnSave.style.background = '';
                btnSave.disabled = false;
            }, 2000);
        } catch(e) {
            console.error(e);
            btnSave.innerHTML = 'Error saving';
            setTimeout(() => {
                btnSave.innerHTML = originalText;
                btnSave.disabled = false;
            }, 2000);
        }
    });

    const checkLoginInterval = setInterval(() => {
        const adminSection = document.getElementById('admin-section');
        if (adminSection && !adminSection.classList.contains('hidden')) {
            clearInterval(checkLoginInterval);
            loadConfig();
        }
    }, 500);

});
