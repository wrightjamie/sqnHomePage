// js/programme_admin.js
/**
 * programme_admin.js
 *
 * Frontend logic for the Programme Settings tab in the admin panel.
 * Handles configuration of training programme elements like uniforms,
 * activities, classifications, parade nights, and staff members.
 */
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
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (!progConfig.parade_nights) progConfig.parade_nights = [];
        
        days.forEach(day => {
            const isActive = progConfig.parade_nights.includes(day);
            const div = document.createElement('div');
            div.className = 'set-item';
            div.style.cursor = 'pointer';
            div.style.justifyContent = 'flex-start';
            div.style.gap = '10px';
            
            div.innerHTML = `
                <input type="checkbox" ${isActive ? 'checked' : ''} class="m-0 cursor-pointer">
                <span style="user-select:none;">${day}</span>
            `;
            
            div.addEventListener('click', (e) => {
                const cb = div.querySelector('input');
                if (e.target.tagName !== 'INPUT') {
                    cb.checked = !cb.checked;
                }
                if (cb.checked && !progConfig.parade_nights.includes(day)) {
                    progConfig.parade_nights.push(day);
                } else if (!cb.checked && progConfig.parade_nights.includes(day)) {
                    progConfig.parade_nights = progConfig.parade_nights.filter(d => d !== day);
                }
                // Sort array to keep chronological order
                progConfig.parade_nights.sort((a, b) => days.indexOf(a) - days.indexOf(b));
            });
            container.appendChild(div);
        });
    }

    // --- Staff ---
    function populateRankPicker() {
        const grid = document.getElementById('rank-picker-grid');
        grid.innerHTML = '';
        if (progConfig.ranks) {
            progConfig.ranks.forEach(r => {
                const label = document.createElement('label');
                label.style.display = 'flex';
                label.style.flexDirection = 'column';
                label.style.alignItems = 'center';
                label.style.cursor = 'pointer';
                label.style.padding = '5px';
                label.style.border = '1px solid transparent';
                label.style.borderRadius = '4px';

                label.innerHTML = `
                    <input type="radio" name="rank_select" value="${r}" class="hidden">
                    <img src="${getRankSvg(r)}" class="rank-svg-lg">
                    <span class="text-sm text-center">${r}</span>
                `;
                
                label.querySelector('input').addEventListener('change', (e) => {
                    document.getElementById('new-staff-rank').value = r;
                    document.getElementById('selected-rank-text').style.display = 'none';
                    const img = document.getElementById('selected-rank-display');
                    img.src = getRankSvg(r);
                    img.style.display = 'block';
                    document.getElementById('rank-picker').hidePopover();
                });

                grid.appendChild(label);
            });
        }
    }

    function renderStaff() {
        renderList('staff-list', progConfig.staff, {
            renderInner: (s, i) => `
                <img src="${getRankSvg(s.rank)}" class="rank-svg-sm">
                <span class="edit-text-rank clickable-rank" title="Click to change rank">${s.rank}</span> 
                <span class="edit-text-name">${s.name}</span>
            `,
            bindEvents: (div, s, i) => {
                editableTextBinding(div, '.edit-text-name', (newVal) => { s.name = newVal; renderStaff(); });
                // We can't easily pop up the rank picker for inline edit, so we just use a basic text edit for rank inline.
                editableTextBinding(div, '.edit-text-rank', (newVal) => { s.rank = newVal; renderStaff(); });
            },
            onRemove: (i) => { progConfig.staff.splice(i, 1); renderStaff(); },
            onReorder: (newArr) => { progConfig.staff = newArr; renderStaff(); }
        });
    }

    document.getElementById('btn-add-staff').addEventListener('click', () => {
        const name = document.getElementById('new-staff-name').value.trim();
        const rank = document.getElementById('new-staff-rank').value;
        if(name && rank) {
            if(!progConfig.staff) progConfig.staff = [];
            progConfig.staff.push({name, rank});
            document.getElementById('new-staff-name').value = '';
            
            // reset rank picker
            document.getElementById('new-staff-rank').value = '';
            document.getElementById('selected-rank-text').style.display = 'inline';
            document.getElementById('selected-rank-display').style.display = 'none';

            renderStaff();
        } else {
            Toast.show('Please select a rank and enter a name.', 'warning');
        }
    });

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
        populateRankPicker();
        renderStaff();
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
