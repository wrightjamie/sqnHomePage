// js/programme-editor.js

let currentEditCell = null;
let currentEditRowData = null;
let currentEditColIdx = null;

function activateCell(cell, rowData) {
    if (currentEditCell) currentEditCell.classList.remove('active-anchor');
    currentEditCell = cell;
    currentEditCell.classList.add('active-anchor');
    currentEditRowData = rowData;
}

window.openUniformPopover = function(e, cell, rowData, tr, monthType) {
    activateCell(cell, rowData);
    const popover = window.ProgState.unifPopover;
    const unifGrid = document.getElementById('unif-grid');
    
    document.querySelectorAll('#unif-grid div').forEach(d => {
        d.style.border = (d.title === rowData.uniform) ? '2px solid #000' : '2px solid transparent';
    });
    unifGrid.dataset.value = rowData.uniform || '';
    
    window.triggerUniformSave = () => {
        rowData.uniform = unifGrid.dataset.value;
        popover.hidePopover();
        window.ProgState.refreshRow(tr, rowData);
        window.ProgState.autoSave(monthType);
    };
    popover.showPopover();
};

window.openNotesPopover = function(e, cell, rowData, tr, monthType, type) {
    activateCell(cell, rowData);
    const popover = window.ProgState.notesPopover;
    let currentNotes = type === "month-notes" ? [...(rowData.month_comments || [])] : [...(rowData.notes || [])];
    
    const listContainer = document.getElementById("notes-list-editor");

    function renderNoteList() {
        listContainer.innerHTML = "";
        currentNotes.forEach((note, idx) => {
            const div = document.createElement("div");
            div.className = "note-edit-item flex-row gap-xs align-center mb-xs";
            div.innerHTML = `
                <input type="text" class="form-control flex-grow-1 note-input" placeholder="Note..." list="dl-notes">
                <button type="button" class="btn btn-secondary btn-sm flex-center note-up" ${idx === 0 ? "disabled" : ""}><span class="material-symbols-outlined">arrow_upward</span></button>
                <button type="button" class="btn btn-secondary btn-sm flex-center note-down" ${idx === currentNotes.length - 1 ? "disabled" : ""}><span class="material-symbols-outlined">arrow_downward</span></button>
                <button type="button" class="btn btn-secondary btn-sm flex-center note-del text-error"><span class="material-symbols-outlined">delete</span></button>
            `;

            div.querySelector(".note-input").value = note; // Safe programmatic assignment
            div.querySelector(".note-input").addEventListener("change", (e) => { currentNotes[idx] = e.target.value; });
            div.querySelector(".note-up").addEventListener("click", () => { [currentNotes[idx-1], currentNotes[idx]] = [currentNotes[idx], currentNotes[idx-1]]; renderNoteList(); });
            div.querySelector(".note-down").addEventListener("click", () => { [currentNotes[idx+1], currentNotes[idx]] = [currentNotes[idx], currentNotes[idx+1]]; renderNoteList(); });
            div.querySelector(".note-del").addEventListener("click", () => { currentNotes.splice(idx, 1); renderNoteList(); });
            listContainer.appendChild(div);
        });
    }

    renderNoteList();

    document.getElementById("btn-note-add").onclick = () => {
        currentNotes.push("");
        renderNoteList();
    };

    window.ProgState.appendNoteFromBtn = (noteText) => {
        currentNotes.push(noteText);
        renderNoteList();
    };

    document.getElementById("btn-note-save").onclick = () => {
        let lines = currentNotes.map(n => typeof n === "string" ? n.trim() : n).filter(l => l);
        if (type === "month-notes") {
            rowData.month_comments = lines;
            window.ProgState.monthNotesContainer.innerHTML = lines.filter(n => n).map(n => `• ${n}`).join("<br>") || "<em>No notes</em>";
        } else {
            rowData.notes = lines;
            window.ProgState.refreshRow(tr, rowData);
        }
        popover.hidePopover();
        window.ProgState.autoSave(monthType);

    };
    popover.showPopover();
};

window.openActivityPopover = function(e, cell, rowData, tr, monthType) {
    activateCell(cell, rowData);
    const popover = window.ProgState.actPopover;
    currentEditColIdx = parseInt(cell.dataset.col);
    
    const config = window.ProgState.config;
    let clsName = config.classifications[currentEditColIdx];
    let act = rowData.activities.find(a => a.classifications.includes(clsName));
    
    document.getElementById('act-name').value = act.name || '';
    const actTypeVal = act.activity_type || '';
    const actTypeRadio = document.querySelector(`input[name="act-type-radio"][value="${actTypeVal}"]`);
    if (actTypeRadio) actTypeRadio.checked = true;
    else {
        const checked = document.querySelector('input[name="act-type-radio"]:checked');
        if (checked) checked.checked = false;
    }
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
        window.ProgState.refreshRow(tr, rowData);
        window.ProgState.autoSave(monthType);
    };
    
    btnSplit.onclick = () => {
        let kept = act.classifications[0];
        let dropped = act.classifications.slice(1);
        act.classifications = [kept];
        
        dropped.forEach(d => {
            rowData.activities.push({ classifications: [d], activity_type: '', name: '', instructor: '' });
        });
        
        popover.hidePopover();
        window.ProgState.refreshRow(tr, rowData);
        window.ProgState.autoSave(monthType);
    };
    
    document.getElementById('btn-act-save').onclick = () => {
        act.name = document.getElementById('act-name').value;
        const actTypeSelected = document.querySelector('input[name="act-type-radio"]:checked');
        act.activity_type = actTypeSelected ? actTypeSelected.value : '';
        act.instructor = document.getElementById('act-instructor').value;
        popover.hidePopover();
        window.ProgState.refreshRow(tr, rowData);
        window.ProgState.autoSave(monthType);
    };
    
    popover.showPopover();
};

window.setupDragAndDrop = function() {
    const rows = document.querySelectorAll('.prog-row');
    const swapBtns = document.querySelectorAll('.btn-swap-row');
    const copyBtns = document.querySelectorAll('.btn-copy-row');
    
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
            if (dragSrcEl.classList.contains('current-month')) srcData = window.ProgState.programmeData.parade_nights[srcIdx];
            else if (dragSrcEl.classList.contains('prev-month')) srcData = window.ProgState.prevMonthData[srcIdx];
            else if (dragSrcEl.classList.contains('next-month')) srcData = window.ProgState.nextMonthData[srcIdx];
            
            let tgtData = null;
            if (targetTr.classList.contains('current-month')) tgtData = window.ProgState.programmeData.parade_nights[tgtIdx];
            else if (targetTr.classList.contains('prev-month')) tgtData = window.ProgState.prevMonthData[tgtIdx];
            else if (targetTr.classList.contains('next-month')) tgtData = window.ProgState.nextMonthData[tgtIdx];
            
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
                
                window.ProgState.refreshRow(dragSrcEl, srcData);
                if (srcMonthType !== tgtMonthType) window.ProgState.autoSave(srcMonthType);
            } else if (dragMode === 'copy') {
                // Copy contents
                tgtData.uniform = srcData.uniform;
                tgtData.notes = JSON.parse(JSON.stringify(srcData.notes));
                tgtData.activities = JSON.parse(JSON.stringify(srcData.activities));
            }
            
            window.ProgState.refreshRow(targetTr, tgtData);
            window.ProgState.autoSave(tgtMonthType);
        }
        return false;
    }
    
    function handleDragEnd(e) {
        dragSrcEl.style.opacity = '1';
    }
    
    swapBtns.forEach(btn => {
        btn.draggable = true;
        btn.addEventListener('dragstart', (e) => { e.stopPropagation(); handleDragStart(e, 'swap'); });
        btn.addEventListener('dragend', handleDragEnd);
    });
    
    copyBtns.forEach(btn => {
        btn.draggable = true;
        btn.addEventListener('dragstart', (e) => { e.stopPropagation(); handleDragStart(e, 'copy'); });
        btn.addEventListener('dragend', handleDragEnd);
    });
    
    rows.forEach(row => {
        if (document.body.classList.contains('edit-mode')) {
            row.draggable = true;
            row.addEventListener('dragstart', (e) => {
                if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target.tagName)) {
                    e.preventDefault();
                    return;
                }
                handleDragStart(e, 'swap');
            });
            row.addEventListener('dragend', handleDragEnd);
        }

        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('dragenter', handleDragEnter);
        row.addEventListener('dragleave', handleDragLeave);
        row.addEventListener('drop', handleDrop);
    });
};
