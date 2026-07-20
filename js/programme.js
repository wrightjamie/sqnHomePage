// js/programme.js
document.addEventListener('DOMContentLoaded', () => {
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth() + 1; // 1-12
    let isEditMode = false;
    let config = null;
    let programmeData = null;
    let prevMonthData = null;
    let nextMonthData = null;
    let prevMonthFullData = null;
    let nextMonthFullData = null;
    let currY, currM, prevY, prevM, nextY, nextM;
    
    // UI Elements
    const tableBody = document.getElementById('prog-body');
    const classHeader = document.getElementById('classifications-header');
    const classSubheader = document.getElementById('classifications-subheader');
    const btnPrev = document.getElementById('btn-prev-month');
    const btnNext = document.getElementById('btn-next-month');
    const title = document.getElementById('month-title');
    const btnEdit = document.getElementById('btn-toggle-edit');
    const btnSave = document.getElementById('btn-save-prog');
    const monthNotesContainer = document.getElementById('month-notes-container');
    
    // Popovers
    const actPopover = document.getElementById('activity-popover');
    const unifPopover = document.getElementById('uniform-popover');
    const notesPopover = document.getElementById('notes-popover');
    

    // Expose state and functions for programme-editor.js
    window.ProgState = {
        get config() { return config; },
        get programmeData() { return programmeData; },
        get prevMonthData() { return prevMonthData; },
        get nextMonthData() { return nextMonthData; },
        get prevMonthFullData() { return prevMonthFullData; },
        get nextMonthFullData() { return nextMonthFullData; },
        get currY() { return currY; },
        get currM() { return currM; },
        get prevY() { return prevY; },
        get prevM() { return prevM; },
        get nextY() { return nextY; },
        get nextM() { return nextM; },
        get isEditMode() { return isEditMode; },
        
        // UI Elements
        get monthNotesContainer() { return monthNotesContainer; },
        get unifPopover() { return unifPopover; },
        get notesPopover() { return notesPopover; },
        get actPopover() { return actPopover; },
        
        // Functions
        refreshRow: refreshRow,
        autoSave: autoSave,
        renderGrid: renderGrid,
        updatePopularButtons: updatePopularButtons,
        setupDragAndDrop: window.setupDragAndDrop // will be defined in editor.js
    };

    // Init
    async function init() {
        config = await apiFetch('api/programme.php?action=config');
        
        // Ensure arrays exist to prevent undefined errors
        if (!config.classifications) config.classifications = [];
        if (!config.uniforms) config.uniforms = [];
        if (!config.activity_types) config.activity_types = [];
        if (!config.staff) config.staff = [];
        if (!config.parade_nights) config.parade_nights = [];
        
        setupClassificationsHeader();
        setupPopovers();
        await loadMonth(currentYear, currentMonth);
        
        btnPrev.addEventListener('click', () => changeMonth(-1));
        btnNext.addEventListener('click', () => changeMonth(1));
        
        if (btnEdit) {
            btnEdit.addEventListener('click', toggleEditMode);
            
            monthNotesContainer.addEventListener('click', (e) => {
                if (!isEditMode) return;
                window.openNotesPopover(e, monthNotesContainer, programmeData, null, 'curr', 'month-notes');
            });
        }
    }
    
    function setupClassificationsHeader() {
        classHeader.colSpan = config.classifications.length;
        classSubheader.innerHTML = '';
        config.classifications.forEach(c => {
            const th = document.createElement('th');
            th.textContent = c;
            classSubheader.appendChild(th);
        });
    }
    
    function setupPopovers() {
        const unifGrid = document.getElementById('unif-grid');
        if (unifGrid) {
            unifGrid.innerHTML = '';
            config.uniforms.forEach(u => {
                const btn = document.createElement('div');
                btn.style.backgroundColor = u.color; 
                
                // Set fallback color first
                btn.style.color = isLight(u.color) ? '#000' : '#fff';
                // Attempt to apply contrast-color
                btn.style.color = `contrast-color(${u.color})`;
                
                btn.style.cursor = 'pointer'; 
                btn.style.border = '2px solid transparent'; 
                btn.style.borderRadius = '4px';
                btn.style.display = 'inline-flex';
                btn.style.alignItems = 'center';
                btn.style.justifyContent = 'center';
                btn.style.margin = '2px';
                btn.style.padding = '5px 10px';
                btn.style.fontWeight = 'bold';
                btn.style.fontSize = '14px';
                
                btn.textContent = u.name;
                btn.title = u.name;
                
                btn.onclick = () => {
                    document.querySelectorAll('#unif-grid div').forEach(d => d.style.border = '2px solid transparent');
                    btn.style.border = '2px solid #000';
                    unifGrid.dataset.value = u.name;
                    if (typeof window.triggerUniformSave === 'function') {
                        window.triggerUniformSave();
                    }
                };
                unifGrid.appendChild(btn);
            });
        }
        
        // Activity Types
        const typeContainer = document.getElementById('act-type');
        typeContainer.innerHTML = '';
        config.activity_types.forEach(t => {
            const label = document.createElement('label');
            label.className = 'radio-label-btn';
            label.style.backgroundColor = t.color;
            label.style.color = isLight(t.color) ? '#000' : '#fff';
            label.style.color = `contrast-color(${t.color})`;
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'act-type-radio';
            radio.value = t.name;
            radio.className = 'hidden';
            
            label.appendChild(radio);
            label.appendChild(document.createTextNode(t.name));
            typeContainer.appendChild(label);
        });
        
        // Instructors
        const instSelect = document.getElementById('act-instructor');
        if (instSelect) {
            instSelect.innerHTML = '<option value="">Instructor...</option>';
            config.staff.forEach(s => {
                const opt = document.createElement('option');
                const fullName = s.rank ? `${s.rank} ${s.name}` : s.name;
                opt.value = fullName;
                opt.textContent = fullName;
                instSelect.appendChild(opt);
            });
        }
    }
    
    function changeMonth(delta) {
        currentMonth += delta;
        if (currentMonth > 12) { currentMonth = 1; currentYear++; }
        else if (currentMonth < 1) { currentMonth = 12; currentYear--; }
        loadMonth(currentYear, currentMonth);
    }
    
    function getDatesForMonth(year, month, allowedDays) {
        let dates = [];
        let d = new Date(year, month - 1, 1);
        const daysMap = { "Sunday":0, "Monday":1, "Tuesday":2, "Wednesday":3, "Thursday":4, "Friday":5, "Saturday":6 };
        let allowed = allowedDays.map(name => daysMap[name]);
        
        while (d.getMonth() === month - 1) {
            if (allowed.includes(d.getDay())) {
                dates.push(new Date(d));
            }
            d.setDate(d.getDate() + 1);
        }
        return dates;
    }
    
    function formatDateShort(dateObj) {
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        let d = dateObj.getDate();
        let ext = 'th';
        if (d % 10 === 1 && d !== 11) ext = 'st';
        else if (d % 10 === 2 && d !== 12) ext = 'nd';
        else if (d % 10 === 3 && d !== 13) ext = 'rd';
        return `<span class="text-sm line-height-tight font-normal">${days[dateObj.getDay()]}</span><br><span class="text-lg">${d}<sup class="date-superscript">${ext}</sup></span>`;
    }
    
    function isoDate(d) {
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    
    async function loadMonth(year, month) {
        const monthName = new Date(year, month-1).toLocaleString('default', {month:'long'});
        title.textContent = `Training Programme ${monthName} ${year}`;
        
        currY = year; currM = month;
        prevM = month - 1; prevY = year; if(prevM < 1) { prevM = 12; prevY--; }
        nextM = month + 1; nextY = year; if(nextM > 12) { nextM = 1; nextY++; }
        
        document.getElementById('lbl-prev-month').textContent = new Date(prevY, prevM-1).toLocaleString('default', {month:'short'});
        document.getElementById('lbl-next-month').textContent = new Date(nextY, nextM-1).toLocaleString('default', {month:'short'});
        
        const [currData, prevData, nextData] = await Promise.all([
            apiFetch(`api/programme.php?action=month&year=${year}&month=${month}`),
            apiFetch(`api/programme.php?action=month&year=${prevY}&month=${prevM}`),
            apiFetch(`api/programme.php?action=month&year=${nextY}&month=${nextM}`)
        ]);
        
        // Auto-generate missing dates for current month
        let expectedDates = getDatesForMonth(year, month, config.parade_nights);
        if (!currData.parade_nights) currData.parade_nights = [];
        
        let mergedCurrent = [];
        expectedDates.forEach(dateObj => {
            let iso = isoDate(dateObj);
            let existing = currData.parade_nights.find(p => p.date === iso);
            if (existing) {
                mergedCurrent.push(existing);
            } else {
                let acts = config.classifications.map(c => ({ classifications: [c], activity_type: '', name: '', instructor: '' }));
                mergedCurrent.push({ date: iso, uniform: '', notes: [], activities: acts });
            }
        });
        currData.parade_nights = mergedCurrent;
        programmeData = currData; 
        
        // Calculate padding rows
        let prevExpected = getDatesForMonth(prevY, prevM, config.parade_nights);
        let paddingPrev = [];
        if (!prevData.parade_nights) prevData.parade_nights = [];
        if (prevExpected.length > 0) {
            let last3 = prevExpected.slice(-3);
            last3.forEach(d => {
                let iso = isoDate(d);
                let existing = prevData.parade_nights.find(p => p.date === iso);
                if (existing) paddingPrev.push(existing);
                else {
                    let acts = config.classifications.map(c => ({ classifications: [c], activity_type: '', name: '', instructor: '' }));
                    let newRow = { date: iso, uniform: '', notes: [], activities: acts };
                    paddingPrev.push(newRow);
                    prevData.parade_nights.push(newRow);
                }
            });
        }
        
        let nextExpected = getDatesForMonth(nextY, nextM, config.parade_nights);
        let paddingNext = [];
        if (!nextData.parade_nights) nextData.parade_nights = [];
        if (nextExpected.length > 0) {
            let first3 = nextExpected.slice(0, 3);
            first3.forEach(d => {
                let iso = isoDate(d);
                let existing = nextData.parade_nights.find(p => p.date === iso);
                if (existing) paddingNext.push(existing);
                else {
                    let acts = config.classifications.map(c => ({ classifications: [c], activity_type: '', name: '', instructor: '' }));
                    let newRow = { date: iso, uniform: '', notes: [], activities: acts };
                    paddingNext.push(newRow);
                    nextData.parade_nights.push(newRow);
                }
            });
        }
        
        prevMonthFullData = prevData;
        nextMonthFullData = nextData;
        prevMonthData = paddingPrev;
        nextMonthData = paddingNext;
        
        // Month notes
        if (!currData.month_comments) currData.month_comments = [];
        monthNotesContainer.innerHTML = currData.month_comments.filter(n => n).map(n => `• ${n}`).join('<br>') || '<em>No notes</em>';
        
        renderGrid(paddingPrev, currData.parade_nights, paddingNext);
        updatePopularButtons();
    }
    
    function updatePopularButtons() {
        let actTally = {};
        let staffTally = {};
        let noteTally = {};
        const allRows = [...prevMonthData, ...programmeData.parade_nights, ...nextMonthData];
        
        allRows.forEach(r => {
            if (r.activities) {
                r.activities.forEach(a => {
                    if (a.name) actTally[a.name] = (actTally[a.name] || 0) + 1;
                    if (a.instructor) staffTally[a.instructor] = (staffTally[a.instructor] || 0) + 1;
                });
            }
            if (r.notes) {
                r.notes.forEach(n => {
                    if (n) noteTally[n] = (noteTally[n] || 0) + 1;
                });
            }
        });
        
        const topActs = Object.entries(actTally).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
        const topStaff = Object.entries(staffTally).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
        const topNotes = Object.entries(noteTally).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
        
        const actContainer = document.getElementById('act-popular-btns');
        if (actContainer) {
            actContainer.innerHTML = '';
            topActs.forEach(name => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-secondary btn-sm';
                btn.textContent = name;
                btn.onclick = () => { document.getElementById('act-name').value = name; };
                actContainer.appendChild(btn);
            });
        }
        
        const staffContainer = document.getElementById('staff-popular-btns');
        if (staffContainer) {
            staffContainer.innerHTML = '';
            topStaff.forEach(name => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-secondary btn-sm';
                btn.textContent = name;
                btn.onclick = () => { document.getElementById('act-instructor').value = name; };
                staffContainer.appendChild(btn);
            });
        }
        
        const noteContainer = document.getElementById("note-popular-btns");
        if (noteContainer) {
            noteContainer.innerHTML = "";
            const dlNotes = document.getElementById("dl-notes");
            if (dlNotes) dlNotes.innerHTML = "";
            topNotes.forEach(name => {
                if (dlNotes) {
                    const opt = document.createElement("option");
                    opt.value = name;
                    dlNotes.appendChild(opt);
                }
                const btn = document.createElement("button");
                btn.className = "btn btn-secondary btn-sm";
                btn.textContent = name;
                btn.onclick = () => { 
                    if (window.ProgState && window.ProgState.appendNoteFromBtn) {
                        window.ProgState.appendNoteFromBtn(name);
                    }
                };
                noteContainer.appendChild(btn);
            });
        }
        
        const dlAct = document.getElementById('dl-activities');
        if (dlAct) {
            dlAct.innerHTML = '';
            Object.keys(actTally).forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                dlAct.appendChild(opt);
            });
        }
    }
    
    function renderGrid(prevRows, currRows, nextRows) {
        tableBody.innerHTML = '';
        
        prevRows.forEach((r, i) => tableBody.appendChild(createRow(r, 'padding-row prev-month')));
        currRows.forEach((r, i) => tableBody.appendChild(createRow(r, `prog-row current-month ${i % 2 === 0 ? 'row-even' : 'row-odd'}`, i)));
        nextRows.forEach((r, i) => tableBody.appendChild(createRow(r, 'padding-row next-month')));
        
        setupDragAndDrop();

        if (window.innerWidth <= 768) {
            scrollToNextParadeNight();
        }
    }
    
    function scrollToNextParadeNight() {
        const today = isoDate(new Date());
        const rows = document.querySelectorAll('#prog-body tr');
        let targetRow = null;
        for (let row of rows) {
            if (row.dataset.date >= today) {
                targetRow = row;
                break;
            }
        }
        if (targetRow) {
            setTimeout(() => {
                targetRow.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            }, 100);
        }
    }
    
    function createRow(rowData, classes, currentIndex = -1) {
        const tr = document.createElement('tr');
        tr.className = classes;
        if (currentIndex >= 0) tr.dataset.index = currentIndex;
        tr.dataset.date = rowData.date;
        
        const dateObj = new Date(rowData.date);
        
        // Controls
        let controlsHtml = '';
        if (isEditMode) {
            controlsHtml = `
                <div class="row-controls">
                    <button class="btn-swap-row" title="Swap"><span class="material-symbols-outlined btn-icon-md">swap_vert</span></button>
                    <button class="btn-copy-row" title="Drag to Copy"><span class="material-symbols-outlined btn-icon-md">content_copy</span></button>
                    <button class="btn-clear-row" title="Clear Row"><span class="material-symbols-outlined btn-icon-md text-error">delete</span></button>
                </div>
            `;
        }
        
        // Uniform
        let unifColor = '';
        let unifText = rowData.uniform || '';
        let unifObj = config.uniforms.find(u => u.name === rowData.uniform);
        if (unifObj) unifColor = unifObj.color;
        
        let dutyHtml = `<div class="duty-indicators text-xs text-muted mt-xs">NCO: ${rowData.duty_nco || '-'}<br>Cdt: ${rowData.duty_cadet || '-'}</div>`;

        let styleStr = '';
        if (unifColor) {
            styleStr = ` style="background-color: ${unifColor}; color: ${isLight(unifColor) ? '#000' : '#fff'};"`;
        }
        
        let html = `
            <td class="date-col" data-label="Date">
                ${controlsHtml}
                ${formatDateShort(dateObj)}
            </td>
            <td class="uniform-col editable-cell" data-type="uniform" data-label="Uniform"${styleStr}>
                ${unifText}
            </td>
        `;
        
        // Classifications / Activities
        let acts = rowData.activities || [];
        config.classifications.forEach((cls, colIdx) => {
            // Find activity covering this classification
            let act = acts.find(a => a.classifications.includes(cls));
            if (!act) return; // Means it's spanned over by a previous cell
            
            // Is this the first classification of this activity?
            if (act.classifications[0] !== cls) return;
            
            let colspan = act.classifications.length;
            let actTypeObj = config.activity_types.find(t => t.name === act.activity_type);
            let textColor = actTypeObj ? actTypeObj.color : '#000';
            
            let instStr = act.instructor ? `<div class="activity-instructor">${act.instructor}</div>` : '';
            
            html += `
                <td class="editable-cell" data-type="activity" data-col="${colIdx}" colspan="${colspan}" data-label="${act.classifications.join(' & ')}">
                    <div class="activity-title" style="color: ${textColor};">${act.name || ''}</div>
                    ${instStr}
                </td>
            `;
        });
        
        // Notes
        let notesText = (rowData.notes || []).join('\n');
        let notesDisplay = (rowData.notes || []).filter(n => n).map(n => `• ${n}`).join('<br>');
        
        html += `
            <td class="duty-col editable-cell" data-type="duty" data-label="Duties">
                ${dutyHtml}
            </td>
            <td class="notes-col editable-cell" data-type="notes" data-label="Notes">
                ${notesDisplay}
            </td>
        `;
        
        tr.innerHTML = html;
        
        // Bind editing
        const cells = tr.querySelectorAll('.editable-cell');
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                if (!isEditMode) return;
                let monthType = 'curr';
                if (tr.classList.contains('prev-month')) monthType = 'prev';
                else if (tr.classList.contains('next-month')) monthType = 'next';
                
                const type = cell.dataset.type;
                if (type === 'uniform') window.openUniformPopover(e, cell, rowData, tr, monthType);
                else if (type === 'notes' || type === 'month-notes') window.openNotesPopover(e, cell, rowData, tr, monthType, type);
                else if (type === 'duty') window.openDutyPopover(e, cell, rowData, tr, monthType);
                else if (type === 'activity') window.openActivityPopover(e, cell, rowData, tr, monthType);

            });
        });
        
        // Bind clear
        const btnClear = tr.querySelector('.btn-clear-row');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                let acts = config.classifications.map(c => ({ classifications: [c], activity_type: '', name: '', instructor: '' }));
                rowData.uniform = '';
                rowData.notes = [];
                rowData.duty_nco = '';
                rowData.duty_cadet = '';
                rowData.activities = acts;
                
                let monthType = 'curr';
                if (tr.classList.contains('prev-month')) monthType = 'prev';
                else if (tr.classList.contains('next-month')) monthType = 'next';
                
                renderGrid(prevMonthData, programmeData.parade_nights, nextMonthData);
                updatePopularButtons();
                autoSave(monthType);
            });
        }
        
        return tr;
    }
    
    // Quick helper to reconstruct mock data for padding rows during re-renders
    function getMockData(tr) {
        return {
            date: tr.dataset.date,
            uniform: tr.querySelector('.uniform-col').textContent.trim(),
            // Simplification: dragging/clearing only affects current month, so we don't strictly need accurate padding reconstruction, 
            // but we'll reload it from DOM to be safe. Actually, better to just call loadMonth to refresh completely.
        };
    }
    
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
    
    // Edit Mode Toggle
    function toggleEditMode() {
        isEditMode = !isEditMode;
        document.body.classList.toggle('edit-mode', isEditMode);
        btnEdit.innerHTML = isEditMode ? '<span class="material-symbols-outlined">edit_off</span>' : '<span class="material-symbols-outlined">edit</span>';
        btnEdit.title = isEditMode ? 'Exit Edit Mode' : 'Edit Programme';
        
        renderGrid(prevMonthData, programmeData.parade_nights, nextMonthData); // re-render to attach controls
    }
    
    // Popover Logic
    
    function refreshRow(tr, rowData) {
        let isCurrent = tr.classList.contains('current-month');
        let newTr = createRow(rowData, tr.className, tr.dataset.index);
        tr.replaceWith(newTr);
        if (isCurrent && window.setupDragAndDrop) window.setupDragAndDrop();
        updatePopularButtons();
    }
    
    // Drag and Drop is now in programme-editor.js
    
    // Auto Save
    let saveTimeout = null;
    
    async function autoSave(monthType) {
        let year, month, data;
        
        if (monthType === 'prev') { year = prevY; month = prevM; data = prevMonthFullData; }
        else if (monthType === 'next') { year = nextY; month = nextM; data = nextMonthFullData; }
        else { year = currY; month = currM; data = programmeData; }
        
        Toast.show('Saving...', 'info', 'sync');
        
        // Debounce slightly if many events fire (like multiple merges)
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            try {
                const result = await apiFetch('api/programme.php?action=month', 'POST', { year, month, programme: data });
                if (result.success) {
                    Toast.show('Saved', 'success');
                }
            } catch (e) {
                console.error(e);
            }
        }, 500);
    }
    
    // Auth logic is now handled globally and by page reload

    init();
});
