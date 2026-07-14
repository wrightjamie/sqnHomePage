document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app-root');
    let quill = null;
    let currentDoc = null;

    function renderList() {
        app.innerHTML = `
            <div class="flex-row justify-between align-center mb-lg">
                <h2>Documents</h2>
                ${window.Auth && window.Auth.hasPermission('manage_settings') ? `<button id="btn-new-doc" class="btn btn-primary"><span class="material-symbols-outlined">add</span> New Document</button>` : ''}
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
                div.className = 'doc-list-item';
                div.innerHTML = `
                    <div>
                        <div style="font-size:1.2rem; font-weight:bold; color:var(--raf-deep-blue);">${doc.title}</div>
                        <div class="doc-meta mt-xs">Issue ${doc.issue_number} | ${doc.issue_date}</div>
                    </div>
                    <span class="material-symbols-outlined text-muted">chevron_right</span>
                `;
                div.onclick = () => renderView(doc.id);
                list.appendChild(div);
            });
        }).catch(e => {
            document.getElementById('doc-list').innerHTML = `<p class="text-error">Error loading documents.</p>`;
        });
    }

    function renderView(id) {
        apiFetch(`api/documents.php?id=${id}`).then(doc => {
            currentDoc = doc;
            let historyHtml = '';
            if (doc.history && doc.history.length > 0) {
                historyHtml = `
                    <div class="mt-xl">
                        <h3>Record of Amendments</h3>
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
                    </div>
                `;
            }

            app.innerHTML = `
                <div class="no-print mb-md flex-row justify-between align-center">
                    <button class="btn btn-secondary" onclick="location.reload()"><span class="material-symbols-outlined">arrow_back</span> Back</button>
                    <div class="flex-row gap-sm">
                        <button class="btn btn-secondary" onclick="window.print()"><span class="material-symbols-outlined">print</span> Print</button>
                        ${window.Auth && window.Auth.hasPermission('manage_settings') ? `<button id="btn-edit-doc" class="btn btn-primary"><span class="material-symbols-outlined">edit</span> Edit</button>` : ''}
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

            <div class="flex-row gap-md mb-md align-end">
                <div style="flex:1;">
                    <label class="form-label font-bold mb-xs">Issue Number</label>
                    <input type="text" id="doc-issue" class="form-control" value="${currentDoc.issue_number}">
                </div>
                <div style="flex:3;">
                    <label class="form-label font-bold mb-xs">Amendment Summary (if changing Issue No.)</label>
                    <input type="text" id="doc-summary" class="form-control" placeholder="e.g. Updated uniform policy">
                </div>
            </div>

            <div class="mb-md text-sm text-muted p-sm" style="background:#f0f0f0; border-left:4px solid var(--raf-deep-blue);">
                <strong>Versioning Guidance:</strong><br>
                • Point Releases (e.g., 1.1, 1.2): Strictly used for minor adjustments such as typos, clarifications, and quick corrections.<br>
                • Full Releases (e.g., 2.0, 3.0): Reserved exclusively for structural changes, significant updates, or the addition of entirely new training material.
            </div>

            <div id="editor-container"></div>

            ${currentDoc.id ? `<button id="btn-del-doc" class="btn text-error mt-lg"><span class="material-symbols-outlined">delete</span> Delete Document</button>` : ''}
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

        document.getElementById('btn-cancel-edit').onclick = () => {
            if (currentDoc.id) renderView(currentDoc.id);
            else renderList();
        };

        if (document.getElementById('btn-del-doc')) {
            document.getElementById('btn-del-doc').onclick = () => {
                if (confirm('Are you sure you want to delete this document?')) {
                    apiFetch('api/documents.php', 'DELETE', {id: currentDoc.id}).then(() => {
                        Toast.show('Deleted', 'success');
                        renderList();
                    });
                }
            };
        }

        document.getElementById('btn-save-doc').onclick = () => {
            const payload = {
                title: document.getElementById('doc-title').value,
                content: quill.root.innerHTML,
                issue_number: document.getElementById('doc-issue').value,
                summary: document.getElementById('doc-summary').value
            };

            if (!payload.title) { Toast.show('Title is required', 'error'); return; }

            const method = currentDoc.id ? 'PUT' : 'POST';
            if (currentDoc.id) payload.id = currentDoc.id;

            apiFetch('api/documents.php', method, payload).then((res) => {
                Toast.show('Saved', 'success');
                renderView(currentDoc.id || res.id);
            });
        };
    }

    // Auto-check auth on init, if we fail to get profile, we assume not admin
    if (window.Auth) {
        window.Auth.checkSession().finally(() => {
            renderList();
        });
    } else {
        renderList();
    }
});
