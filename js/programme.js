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
                openPopover(e, monthNotesContainer, programmeData, null, 'curr');
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
        const typeSelect = document.getElementById('act-type');
        typeSelect.innerHTML = '<option value="">Select Type...</option>';
        config.activity_types.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.name;
            opt.textContent = t.name;
            typeSelect.appendChild(opt);
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
        
        const noteContainer = document.getElementById('note-popular-btns');
        if (noteContainer) {
            noteContainer.innerHTML = '';
            topNotes.forEach(name => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-secondary btn-sm';
                btn.textContent = name;
                btn.onclick = () => { 
                    if (typeof window.quickAddNote === 'function') {
                        window.quickAddNote(name);
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
        
        let styleStr = '';
        if (unifColor) {
            styleStr = ` style="background-color: ${unifColor}; color: ${isLight(unifColor) ? '#000' : '#fff'}; text-shadow: ${isLight(unifColor) ? 'none' : '0.0625rem 0.0625rem 0.125rem #000'};"`;
        }
        
        let html = `
            <td class="date-col">
                ${controlsHtml}
                ${formatDateShort(dateObj)}
            </td>
            <td class="uniform-col editable-cell" data-type="uniform"${styleStr}>
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
                <td class="editable-cell" data-type="activity" data-col="${colIdx}" colspan="${colspan}">
                    <div class="activity-title" style="color: ${textColor};">${act.name || ''}</div>
                    ${instStr}
                </td>
            `;
        });
        
        // Notes
        let notesText = (rowData.notes || []).join('\n');
        let notesDisplay = (rowData.notes || []).filter(n => n).map(n => `• ${n}`).join('<br>');
        
        html += `
            <td class="notes-col editable-cell" data-type="notes">
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
                openPopover(e, cell, rowData, tr, monthType);
            });
        });
        
        // Bind clear
        const btnClear = tr.querySelector('.btn-clear-row');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                let acts = config.classifications.map(c => ({ classifications: [c], activity_type: '', name: '', instructor: '' }));
                rowData.uniform = '';
                rowData.notes = [];
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
    let currentEditCell = null;
    let currentEditRowData = null;
    let currentEditColIdx = null;
    
    function openPopover(e, cell, rowData, tr, monthType) {
        const type = cell.dataset.type;
        
        if (currentEditCell) currentEditCell.classList.remove('active-anchor');
        currentEditCell = cell;
        currentEditCell.classList.add('active-anchor');
        
        currentEditRowData = rowData;
        
        let popover;
        
        if (type === 'uniform') {
            popover = unifPopover;
            const unifGrid = document.getElementById('unif-grid');
            document.querySelectorAll('#unif-grid div').forEach(d => {
                d.style.border = (d.title === rowData.uniform) ? '2px solid #000' : '2px solid transparent';
            });
            unifGrid.dataset.value = rowData.uniform || '';
            
            window.triggerUniformSave = () => {
                rowData.uniform = unifGrid.dataset.value;
                popover.hidePopover();
                refreshRow(tr, rowData);
                autoSave(monthType);
            };
        } else if (type === 'notes' || type === 'month-notes') {
            popover = notesPopover;
            const container = document.getElementById('note-inputs-container');
            const btnAdd = document.getElementById('btn-add-note');
            let currentNotes = type === 'month-notes' ? (rowData.month_comments || []) : (rowData.notes || []);

            // Render existing notes
            container.innerHTML = '';

            const createNoteRow = (val = '') => {
                const row = document.createElement('div');
                row.className = 'flex-row gap-xs align-center note-input-row w-100';
                row.innerHTML = `
                    <input type="text" list="dl-comments" class="form-control flex-1" value="${val.replace(/"/g, '&quot;')}" style="min-width: 0;">
                    <button class="btn btn-secondary btn-sm flex-center btn-note-up" title="Move Up"><span class="material-symbols-outlined" style="font-size: 16px;">arrow_upward</span></button>
                    <button class="btn btn-secondary btn-sm flex-center btn-note-down" title="Move Down"><span class="material-symbols-outlined" style="font-size: 16px;">arrow_downward</span></button>
                    <button class="btn btn-sm flex-center btn-note-del" title="Delete" style="background: var(--raf-logo-1); color: white; border: none;"><span class="material-symbols-outlined" style="font-size: 16px;">delete</span></button>
                `;

                row.querySelector('.btn-note-up').onclick = (e) => {
                    e.preventDefault();
                    if (row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
                };
                row.querySelector('.btn-note-down').onclick = (e) => {
                    e.preventDefault();
                    if (row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
                };
                row.querySelector('.btn-note-del').onclick = (e) => {
                    e.preventDefault();
                    row.remove();
                };
                return row;
            };

            currentNotes.forEach(n => container.appendChild(createNoteRow(n)));

            if (currentNotes.length === 0) {
                container.appendChild(createNoteRow());
            }

            // Cleanup previous listener
            const newBtnAdd = btnAdd.cloneNode(true);
            btnAdd.parentNode.replaceChild(newBtnAdd, btnAdd);
            newBtnAdd.addEventListener('click', (e) => {
                e.preventDefault();
                container.appendChild(createNoteRow());
                container.scrollTop = container.scrollHeight;
            });

            // Quick add support for popular buttons (need to hook this globally or here)
            window.quickAddNote = (val) => {
                container.appendChild(createNoteRow(val));
                container.scrollTop = container.scrollHeight;
            };

            document.getElementById('btn-note-save').onclick = () => {
                const inputs = Array.from(container.querySelectorAll('input[type="text"]'));
                let lines = inputs.map(inp => inp.value.trim()).filter(l => l);
                
                if (type === 'month-notes') {
                    rowData.month_comments = lines;
                    monthNotesContainer.innerHTML = lines.filter(n => n).map(n => `• ${n}`).join('<br>') || '<em>No notes</em>';
                } else {
                    rowData.notes = lines;
                    refreshRow(tr, rowData);
                }
                popover.hidePopover();
                autoSave(monthType);
            };
        } else if (type === 'activity') {
            popover = actPopover;
            currentEditColIdx = parseInt(cell.dataset.col);
            let clsName = config.classifications[currentEditColIdx];
            let act = rowData.activities.find(a => a.classifications.includes(clsName));
            
            document.getElementById('act-name').value = act.name || '';
            document.getElementById('act-type').value = act.activity_type || '';
            document.getElementById('act-instructor').value = act.instructor || '';
            
            // Show/hide merge/split
            const btnMerge = document.getElementById('btn-act-merge');
            const btnSplit = document.getElementById('btn-act-split');
            
            btnMerge.style.display = (currentEditColIdx > 0) ? 'inline-block' : 'none';
            btnSplit.style.display = (act.classifications.length > 1) ? 'inline-block' : 'none';
            
            btnMerge.onclick = () => {
                let prevCls = config.classifications[currentEditColIdx - 1];
                let prevAct = rowData.activities.find(a => a.classifications.includes(prevCls));
                prevAct.classifications.push(...act.classifications);
                rowData.activities = rowData.activities.filter(a => a !== act);
                popover.hidePopover();
                refreshRow(tr, rowData);
                autoSave(monthType);
            };
            
            btnSplit.onclick = () => {
                let kept = act.classifications[0];
                let dropped = act.classifications.slice(1);
                act.classifications = [kept];
                
                dropped.forEach(d => {
                    rowData.activities.push({ classifications: [d], activity_type: '', name: '', instructor: '' });
                });
                
                popover.hidePopover();
                refreshRow(tr, rowData);
                autoSave(monthType);
            };
            
            document.getElementById('btn-act-save').onclick = () => {
                act.name = document.getElementById('act-name').value;
                act.activity_type = document.getElementById('act-type').value;
                act.instructor = document.getElementById('act-instructor').value;
                popover.hidePopover();
                refreshRow(tr, rowData);
                autoSave(monthType);
            };
        }
        
        popover.showPopover();
    }
    
    function refreshRow(tr, rowData) {
        let isCurrent = tr.classList.contains('current-month');
        let newTr = createRow(rowData, tr.className, tr.dataset.index);
        tr.replaceWith(newTr);
        if (isCurrent) setupDragAndDrop();
        updatePopularButtons();
    }
    
    // Drag and Drop
    function setupDragAndDrop() {
        const rows = document.querySelectorAll('.prog-row');
        const swapBtns = document.querySelectorAll('.btn-swap-row');
        const copyBtns = document.querySelectorAll('.btn-copy-row');
        const paddingRows = document.querySelectorAll('.padding-row');
        
        let dragSrcEl = null;
        let dragMode = ''; // 'swap' or 'copy'
        
        function handleDragStart(e, mode) {
            dragMode = mode;
            dragSrcEl = e.target.closest('tr');
            e.dataTransfer.effectAllowed = 'copyMove';
            e.dataTransfer.setData('text/html', dragSrcEl.innerHTML);
            dragSrcEl.style.opacity = '0.4';
        }
        
        function handleDragOver(e) {
            if (e.preventDefault) { e.preventDefault(); }
            e.dataTransfer.dropEffect = 'move';
            return false;
        }
        
        function handleDragEnter(e) {
            let tr = e.target.closest('tr');
            if (tr) tr.classList.add('drag-over');
        }
        
        function handleDragLeave(e) {
            let tr = e.target.closest('tr');
            if (tr) tr.classList.remove('drag-over');
        }
        
        function handleDrop(e) {
            if (e.stopPropagation) { e.stopPropagation(); }
            let targetTr = e.target.closest('tr');
            if (targetTr) targetTr.classList.remove('drag-over');
            
            if (dragSrcEl !== targetTr) {
                let srcIdx = dragSrcEl.dataset.index;
                let tgtIdx = targetTr.dataset.index;
                
                let srcData = null;
                if (dragSrcEl.classList.contains('current-month')) srcData = programmeData.parade_nights[srcIdx];
                else if (dragSrcEl.classList.contains('prev-month')) srcData = prevMonthData[srcIdx];
                else if (dragSrcEl.classList.contains('next-month')) srcData = nextMonthData[srcIdx];
                
                let tgtData = null;
                if (targetTr.classList.contains('current-month')) tgtData = programmeData.parade_nights[tgtIdx];
                else if (targetTr.classList.contains('prev-month')) tgtData = prevMonthData[tgtIdx];
                else if (targetTr.classList.contains('next-month')) tgtData = nextMonthData[tgtIdx];
                
                if (!srcData || !tgtData) return;
                
                let srcMonthType = 'curr';
                if (dragSrcEl.classList.contains('prev-month')) srcMonthType = 'prev';
                else if (dragSrcEl.classList.contains('next-month')) srcMonthType = 'next';
                
                let tgtMonthType = 'curr';
                if (targetTr.classList.contains('prev-month')) tgtMonthType = 'prev';
                else if (targetTr.classList.contains('next-month')) tgtMonthType = 'next';
                
                if (dragMode === 'swap') {
                    // Swap contents
                    let tempUniform = srcData.uniform;
                    let tempNotes = srcData.notes;
                    let tempActs = srcData.activities;
                    
                    srcData.uniform = tgtData.uniform;
                    srcData.notes = tgtData.notes;
                    srcData.activities = tgtData.activities;
                    
                    tgtData.uniform = tempUniform;
                    tgtData.notes = tempNotes;
                    tgtData.activities = tempActs;
                    
                    refreshRow(dragSrcEl, srcData);
                    if (srcMonthType !== tgtMonthType) autoSave(srcMonthType);
                } else if (dragMode === 'copy') {
                    // Copy contents
                    tgtData.uniform = srcData.uniform;
                    tgtData.notes = JSON.parse(JSON.stringify(srcData.notes));
                    tgtData.activities = JSON.parse(JSON.stringify(srcData.activities));
                }
                
                refreshRow(targetTr, tgtData);
                autoSave(tgtMonthType);
            }
            return false;
        }
        
        function handleDragEnd(e) {
            dragSrcEl.style.opacity = '1';
        }
        
        swapBtns.forEach(btn => {
            btn.draggable = true;
            btn.addEventListener('dragstart', (e) => handleDragStart(e, 'swap'));
            btn.addEventListener('dragend', handleDragEnd);
        });
        
        copyBtns.forEach(btn => {
            btn.draggable = true;
            btn.addEventListener('dragstart', (e) => handleDragStart(e, 'copy'));
            btn.addEventListener('dragend', handleDragEnd);
        });
        
        rows.forEach(row => {
            row.addEventListener('dragover', handleDragOver);
            row.addEventListener('dragenter', handleDragEnter);
            row.addEventListener('dragleave', handleDragLeave);
            row.addEventListener('drop', handleDrop);
        });
    }
    
    // Auto Save
    let saveTimeout = null;
    
    async function autoSave(monthType) {
        let year, month, data;
        
        if (monthType === 'prev') { year = prevY; month = prevM; data = prevMonthFullData; }
        else if (monthType === 'next') { year = nextY; month = nextM; data = nextMonthFullData; }
        else { year = currY; month = currM; data = programmeData; }
        
        showToast('Saving...', 'sync');
        
        // Debounce slightly if many events fire (like multiple merges)
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            try {
                const result = await apiFetch('api/programme.php?action=month', 'POST', { year, month, programme: data });
                if (result.success) {
                    showToast('Saved', 'check_circle');
                    setTimeout(hideToast, 2000);
                } else {
                    showToast('Error saving', 'error');
                }
            } catch (e) {
                console.error(e);
                showToast('Network error', 'cloud_off');
            }
        }, 500);
    }
    
    function showToast(msg, icon) {
        const t = document.getElementById('toast-container');
        document.getElementById('toast-message').textContent = msg;
        document.getElementById('toast-icon').textContent = icon;
        t.classList.add('show');
        if (icon === 'sync') {
            document.getElementById('toast-icon').style.animation = 'spin 1s linear infinite';
        } else {
            document.getElementById('toast-icon').style.animation = '';
        }
    }
    function hideToast() {
        document.getElementById('toast-container').classList.remove('show');
    }
    
    // Add spin animation dynamically
    const style = document.createElement('style');
    style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    
    // Auth Logic
    async function checkAuthStatus() {
        try {
            const data = await Auth.checkStatus();
            if (data.logged_in) {
                setAuthenticatedState();
            } else {
                setUnauthenticatedState();
            }
        } catch(e) {
            setUnauthenticatedState();
        }
    }

    function setAuthenticatedState() {
        const btnLoginTrigger = document.getElementById('btn-login-trigger');
        const linkAdmin = document.getElementById('link-admin');
        const btnLogout = document.getElementById('btn-logout');
        if (btnLoginTrigger) btnLoginTrigger.classList.add('hidden');
        if (btnEdit) btnEdit.classList.remove('hidden');
        if (linkAdmin) linkAdmin.classList.remove('hidden');
        if (btnLogout) btnLogout.classList.remove('hidden');
    }

    function setUnauthenticatedState() {
        const btnLoginTrigger = document.getElementById('btn-login-trigger');
        const linkAdmin = document.getElementById('link-admin');
        const btnLogout = document.getElementById('btn-logout');
        if (btnLoginTrigger) btnLoginTrigger.classList.remove('hidden');
        if (btnEdit) btnEdit.classList.add('hidden');
        if (linkAdmin) linkAdmin.classList.add('hidden');
        if (btnLogout) btnLogout.classList.add('hidden');
        if (isEditMode) toggleEditMode();
    }

    const loginTrigger = document.getElementById('btn-login-trigger');
    if (loginTrigger) {
        loginTrigger.addEventListener('click', () => Auth.showModal());
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => Auth.logout());
    }
    
    Auth.onLogin(() => setAuthenticatedState());
    Auth.onLogout(() => setUnauthenticatedState());

    init();
});
