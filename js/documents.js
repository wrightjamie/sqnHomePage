document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app-root');
    let quill = null;
    let currentDoc = null;
    let canManage = false;

    // Check permissions
    try {
        const status = await Auth.checkStatus();
        canManage = status.logged_in && status.permissions && status.permissions.includes('manage_settings');
    } catch (e) {
        canManage = false;
    }

    function renderList() {
        app.innerHTML = `
            <div class="flex-row justify-between align-center mb-lg">
                <h2>Documents</h2>
                ${canManage ? `<button id="btn-new-doc" class="btn btn-primary"><span class="material-symbols-outlined">add</span> New Document</button>` : ''}
            </div>
            <div id="doc-list" class="flex-col gap-sm">Loading...</div>
        `;

        if (document.getElementById('btn-new-doc')) {
            document.getElementById('btn-new-doc').onclick = () => renderEditor();
        }

        apiFetch('api/documents.php').then(docs => {
            const list = document.getElementById('doc-list');
            if (docs.length === 0) {
                list.innerHTML = '<p class="text-muted">No documents found.</p>';
                return;
            }
            list.innerHTML = '';
            docs.forEach(doc => {
                const div = document.createElement('div');
                div.className = 'doc-list-item flex-row justify-between align-center';
                div.style.cursor = 'pointer';
                
                let controlsHtml = '';
                if (canManage) {
                    controlsHtml = `
                        <div class="flex-row gap-xs no-print" style="margin-left:auto; margin-right:1rem;">
                            <button class="btn btn-secondary btn-edit-inline" style="padding: 0.25rem 0.5rem;"><span class="material-symbols-outlined" style="font-size:1rem;">edit</span></button>
                            <button class="btn btn-secondary btn-del-inline text-error" style="padding: 0.25rem 0.5rem;"><span class="material-symbols-outlined" style="font-size:1rem;">delete</span></button>
                        </div>
                    `;
                }

                div.innerHTML = `
                    <div style="flex:1;">
                        <div style="font-size:1.2rem; font-weight:bold; color:var(--raf-deep-blue);">${doc.title}</div>
                        <div class="doc-meta mt-xs">Issue ${doc.issue_number} | ${doc.issue_date}</div>
                    </div>
                    ${controlsHtml}
                    <span class="material-symbols-outlined text-muted" style="pointer-events:none;">chevron_right</span>
                `;

                div.onclick = () => renderView(doc.id);
                
                if (canManage) {
                    div.querySelector('.btn-edit-inline').onclick = (e) => {
                        e.stopPropagation();
                        // Fetch full doc to edit
                        apiFetch(`api/documents.php?id=${doc.id}`).then(fullDoc => renderEditor(fullDoc));
                    };
                    div.querySelector('.btn-del-inline').onclick = (e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this document?')) {
                            apiFetch('api/documents.php', 'DELETE', {id: doc.id}).then(() => {
                                Toast.show('Deleted', 'success');
                                renderList();
                            });
                        }
                    };
                }

                list.appendChild(div);
            });
        }).catch(e => {
            document.getElementById('doc-list').innerHTML = `<p class="text-error">Error loading documents.</p>`;
        });
    }

    function renderView(id, isSlug = false) {
        const queryParam = isSlug ? 'slug' : 'id';
        apiFetch(`api/documents.php?${queryParam}=${id}`).then(doc => {
            currentDoc = doc;
            let historyHtml = '';
            if (doc.history && doc.history.length > 0) {
                historyHtml = `
                    <details class="doc-amendments-section">
                        <summary style="cursor:pointer; font-size:1.2rem; font-weight:bold; color:var(--raf-deep-blue); margin-bottom: 1rem;">Record of Amendments</summary>
                        <table class="doc-history-table">
                            <thead>
                                <tr>
                                    <th style="width:10%;">Issue No.</th>
                                    <th style="width:15%;">Date</th>
                                    <th>Summary of Changes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${doc.history.map(h => `
                                    <tr>
                                        <td>${h.issue_number}</td>
                                        <td>${h.issue_date}</td>
                                        <td>${h.summary}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </details>
                `;
            }

            app.innerHTML = `
                <div class="no-print mb-md flex-row justify-between align-center">
                    <button class="btn btn-secondary" onclick="location.reload()"><span class="material-symbols-outlined">arrow_back</span> Back</button>
                    <div class="flex-row gap-sm">
                        <button class="btn btn-secondary" onclick="window.print()"><span class="material-symbols-outlined">print</span> Print</button>
                        ${canManage ? `<button id="btn-edit-doc" class="btn btn-primary"><span class="material-symbols-outlined">edit</span> Edit</button>` : ''}
                    </div>
                </div>
                <div class="doc-view">
                    <h1 class="doc-title-view">${doc.title}</h1>
                    <div class="doc-meta mb-lg" style="border-bottom: 2px solid var(--raf-deep-blue); padding-bottom: 0.5rem;">Issue ${doc.issue_number} | ${doc.issue_date}</div>
                    <div class="ql-editor" style="padding:0;">${doc.content}</div>
                    ${historyHtml}
                </div>
            `;

            if (document.getElementById('btn-edit-doc')) {
                document.getElementById('btn-edit-doc').onclick = () => renderEditor(doc);
            }
        });
    }

    function renderEditor(doc = null) {
        currentDoc = doc || { title: '', content: '', issue_number: '1.0', history: [] };

        app.innerHTML = `
            <div class="mb-md flex-row justify-between align-center">
                <button class="btn btn-secondary" id="btn-cancel-edit">Cancel</button>
                <button class="btn btn-primary" id="btn-save-doc">Save</button>
            </div>

            <input type="text" id="doc-title" class="form-control mb-md" style="font-size:1.5rem; font-weight:bold;" placeholder="Document Title" value="${currentDoc.title}">

            <div class="flex-row align-center mb-md" style="font-size: 1.2rem;">
                <span class="text-muted" style="margin-right: 4px;">documents.php/</span>
                <input type="text" id="doc-slug" class="form-control" style="flex:1; font-family:monospace;" placeholder="auto-generated-slug" value="${currentDoc.slug || ''}">
            </div>

            <div class="mb-md flex-row justify-between align-center">
                <span class="text-muted">Current Issue: <strong>${currentDoc.issue_number}</strong></span>
            </div>

            <div id="editor-container"></div>
        `;

        quill = new Quill('#editor-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image', 'video'],
                    ['clean']
                ]
            }
        });

        if (currentDoc.content) {
            quill.root.innerHTML = currentDoc.content;
        }

        const titleInput = document.getElementById('doc-title');
        const slugInput = document.getElementById('doc-slug');
        let slugManuallyEdited = !!currentDoc.slug;
        slugInput.addEventListener('input', () => { slugManuallyEdited = true; });
        titleInput.addEventListener('input', () => {
            if (!slugManuallyEdited) {
                slugInput.value = titleInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
        });

        document.getElementById('btn-cancel-edit').onclick = () => {
            if (currentDoc.id) renderView(currentDoc.id);
            else renderList();
        };

        document.getElementById('btn-save-doc').onclick = () => {
            const title = titleInput.value;
            if (!title) { Toast.show('Title is required', 'error'); return; }

            const popupHtml = `
                <dialog id="version-modal" style="padding:0; border:none; border-radius:var(--space-md); max-width:550px; width:100%; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                    <div style="padding: 2rem; background:white;">
                        <h2 style="margin-top:0; color:var(--raf-deep-blue); font-size: 2rem; border-bottom: 2px solid var(--colour-primary); padding-bottom: 0.5rem; margin-bottom: 1rem;">Save Document</h2>
                        <p class="mb-lg" style="font-size: 1.1rem;">Current Version: <strong>${currentDoc.issue_number}</strong></p>
                        
                        <div class="flex-col gap-sm" style="margin-bottom: 1.5rem;">
                            <label style="display:flex; align-items:center; padding: 0.75rem; background:#f9f9f9; border:1px solid #ddd; border-radius:var(--space-sm); cursor:pointer;">
                                <input type="radio" name="version_type" value="none" checked style="margin-right: 1rem; transform: scale(1.2);"> 
                                <div><strong style="font-size: 1.1rem;">None / Minor Correction</strong><br><span class="text-muted text-sm">No version bump</span></div>
                            </label>
                            <label style="display:flex; align-items:center; padding: 0.75rem; background:#f9f9f9; border:1px solid #ddd; border-radius:var(--space-sm); cursor:pointer;">
                                <input type="radio" name="version_type" value="point" style="margin-right: 1rem; transform: scale(1.2);"> 
                                <div><strong style="font-size: 1.1rem;">Point Release</strong><br><span class="text-muted text-sm">Typo fixes, minor clarifications (e.g. 1.0 &rarr; 1.1)</span></div>
                            </label>
                            <label style="display:flex; align-items:center; padding: 0.75rem; background:#f9f9f9; border:1px solid #ddd; border-radius:var(--space-sm); cursor:pointer;">
                                <input type="radio" name="version_type" value="major" style="margin-right: 1rem; transform: scale(1.2);"> 
                                <div><strong style="font-size: 1.1rem;">Major Release</strong><br><span class="text-muted text-sm">Structural changes, new material (e.g. 1.1 &rarr; 2.0)</span></div>
                            </label>
                        </div>

                        <div id="summary-container" style="display:none; margin-bottom: 1.5rem;">
                            <label class="form-label font-bold mb-xs" style="color:var(--raf-deep-blue);">Amendment Summary</label>
                            <input type="text" id="modal-summary" class="form-control" placeholder="Briefly describe the changes" style="font-size: 1.1rem;">
                        </div>

                        <div class="flex-row justify-end gap-md">
                            <button class="btn btn-secondary" id="btn-modal-cancel" style="padding: 0.5rem 1.5rem;">Cancel</button>
                            <button class="btn btn-primary" id="btn-modal-save" style="padding: 0.5rem 1.5rem;">Confirm Save</button>
                        </div>
                    </div>
                </dialog>
            `;

            document.body.insertAdjacentHTML('beforeend', popupHtml);
            const modal = document.getElementById('version-modal');
            modal.showModal();
            document.body.style.overflow = 'hidden';

            const radios = modal.querySelectorAll('input[name="version_type"]');
            const summaryContainer = document.getElementById('summary-container');
            const summaryInput = document.getElementById('modal-summary');

            radios.forEach(r => {
                r.addEventListener('change', () => {
                    if (r.value === 'none') {
                        summaryContainer.style.display = 'none';
                    } else {
                        summaryContainer.style.display = 'block';
                        summaryInput.focus();
                    }
                });
            });

            document.getElementById('btn-modal-cancel').onclick = () => {
                document.body.style.overflow = '';
                modal.close();
                modal.remove();
            };

            document.getElementById('btn-modal-save').onclick = () => {
                const versionType = modal.querySelector('input[name="version_type"]:checked').value;
                let newIssueNumber = currentDoc.issue_number;
                
                if (versionType !== 'none') {
                    if (!summaryInput.value.trim()) {
                        Toast.show('Summary is required for version changes', 'error');
                        summaryInput.focus();
                        return;
                    }
                    
                    let parts = currentDoc.issue_number.split('.').map(Number);
                    if (parts.length !== 2) parts = [1, 0];
                    if (versionType === 'point') {
                        newIssueNumber = `${parts[0]}.${parts[1] + 1}`;
                    } else if (versionType === 'major') {
                        newIssueNumber = `${parts[0] + 1}.0`;
                    }
                }

                const payload = {
                    title: title,
                    content: quill.root.innerHTML,
                    issue_number: newIssueNumber,
                    summary: summaryInput.value.trim(),
                    slug: slugInput.value
                };

                const method = currentDoc.id ? 'PUT' : 'POST';
                if (currentDoc.id) payload.id = currentDoc.id;

                apiFetch('api/documents.php', method, payload).then((res) => {
                    document.body.style.overflow = '';
                    modal.close();
                    modal.remove();
                    Toast.show('Saved', 'success');
                    renderView(currentDoc.id || res.id);
                });
            };
        };
    }

    if (window.initialDocSlug) {
        renderView(window.initialDocSlug, true);
    } else {
        renderList();
    }
});
