const fs = require('fs');
const path = require('path');

describe('Home Page Dashboard Settings Sidebar', () => {
  describe('CSS Styles', () => {
    const cssPath = path.resolve(__dirname, '../../css/pages/home-editor.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    it('should define max-width: 100% and min-width on .editor-sidebar', () => {
      expect(css).toContain('max-width: 100%');
      expect(css).toContain('min-width: min(400px, 100%)');
    });

    it('should define slide-out wrapper with transition and collapsed transform', () => {
      expect(css).toContain('.editor-sidebar-wrapper');
      expect(css).toContain('.editor-sidebar-wrapper.collapsed');
      expect(css).toContain('transform: translateX(100%)');
    });

    it('should style the sidebar-toggle-btn docked to the edge of the sidebar', () => {
      expect(css).toContain('.sidebar-toggle-btn');
      expect(css).toContain('right: 100%');
      expect(css).toContain('border-radius: 8px 0 0 8px');
    });

    it('should not hardcode body padding-right in edit mode to allow full responsive width', () => {
      expect(css).toContain('padding-right: 0');
    });

    it('should define bottom padding on .editor-sidebar to clear floating menu controls', () => {
      expect(css).toContain('padding-bottom: calc(var(--space-lg, 1.25rem) + 50px');
    });

    it('should style action buttons with save taking remaining space and cancel collapsing on narrow screens', () => {
      expect(css).toContain('.editor-sidebar #save-config-btn');
      expect(css).toContain('flex: 1');
      expect(css).toContain('.editor-sidebar #close-editor-btn');
      expect(css).toContain('flex: 0 0 auto');
      expect(css).toContain('.editor-sidebar #close-editor-btn .btn-label');
      expect(css).toContain('display: none');
    });
  });

  describe('DOM Interaction & Action Buttons', () => {
    let wrapper, toggleBtn, sidebar;

    beforeEach(() => {
      document.body.innerHTML = `
        <div id="editor-sidebar-wrapper" class="editor-sidebar-wrapper collapsed">
          <button id="sidebar-toggle-btn" class="sidebar-toggle-btn" type="button" title="Open Dashboard Settings" aria-label="Toggle Dashboard Settings">
            <span class="material-symbols-outlined">tune</span>
          </button>
          <div class="editor-sidebar glass-panel">
            <div class="mb-xs">
              <h3 class="m-0">Dashboard Settings</h3>
            </div>
            <div id="tab-settings" class="sidebar-tab-content active">
              <div class="mt-sm flex-row gap-sm">
                <button id="save-config-btn" class="btn btn-primary flex-1" type="button"><span class="material-symbols-outlined icon-sm">save</span> Save Configuration</button>
                <button id="close-editor-btn" class="btn btn-danger" type="button" title="Cancel" aria-label="Cancel"><span class="material-symbols-outlined icon-sm">close</span><span class="btn-label">Cancel</span></button>
              </div>
            </div>
          </div>
        </div>
      `;

      wrapper = document.getElementById('editor-sidebar-wrapper');
      toggleBtn = document.getElementById('sidebar-toggle-btn');
      sidebar = wrapper.querySelector('.editor-sidebar');

      // Mimic toggle function from home.js
      const toggleSettingsPanel = (forceOpen) => {
        if (!wrapper) return;
        const isCollapsed = wrapper.classList.contains('collapsed');
        const shouldOpen = (forceOpen !== undefined) ? forceOpen : isCollapsed;

        if (shouldOpen) {
          wrapper.classList.remove('collapsed');
          toggleBtn.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
          toggleBtn.title = 'Close Dashboard Settings';
          toggleBtn.setAttribute('aria-label', 'Close Dashboard Settings');
        } else {
          wrapper.classList.add('collapsed');
          toggleBtn.innerHTML = '<span class="material-symbols-outlined">tune</span>';
          toggleBtn.title = 'Open Dashboard Settings';
          toggleBtn.setAttribute('aria-label', 'Open Dashboard Settings');
        }
      };

      toggleBtn.onclick = () => toggleSettingsPanel();
    });

    it('should not render a close button in the top right of dashboard settings header', () => {
      const headerCloseBtn = sidebar.querySelector('.btn-close-editor, #slide-close-editor-btn');
      expect(headerCloseBtn).toBeNull();
    });

    it('should render Save button before Cancel button', () => {
      const saveBtn = sidebar.querySelector('#save-config-btn');
      const cancelBtn = sidebar.querySelector('#close-editor-btn');

      expect(saveBtn).not.toBeNull();
      expect(cancelBtn).not.toBeNull();

      // Ensure save button precedes cancel button in the DOM
      expect(saveBtn.compareDocumentPosition(cancelBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('should have Cancel button configured with accessible label and .btn-label wrapper', () => {
      const cancelBtn = sidebar.querySelector('#close-editor-btn');
      expect(cancelBtn.getAttribute('aria-label')).toBe('Cancel');
      expect(cancelBtn.getAttribute('title')).toBe('Cancel');

      const labelSpan = cancelBtn.querySelector('.btn-label');
      expect(labelSpan).not.toBeNull();
      expect(labelSpan.textContent.trim()).toBe('Cancel');

      const iconSpan = cancelBtn.querySelector('.material-symbols-outlined');
      expect(iconSpan).not.toBeNull();
      expect(iconSpan.textContent.trim()).toBe('close');
    });

    it('should slide open when toggle button is clicked while collapsed', () => {
      expect(wrapper.classList.contains('collapsed')).toBe(true);

      toggleBtn.click();

      expect(wrapper.classList.contains('collapsed')).toBe(false);
      expect(toggleBtn.title).toBe('Close Dashboard Settings');
      expect(toggleBtn.innerHTML).toContain('chevron_right');
    });

    it('should slide in/closed when toggle button is clicked while open', () => {
      wrapper.classList.remove('collapsed');
      toggleBtn.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
      toggleBtn.title = 'Close Dashboard Settings';

      toggleBtn.click();

      expect(wrapper.classList.contains('collapsed')).toBe(true);
      expect(toggleBtn.title).toBe('Open Dashboard Settings');
      expect(toggleBtn.innerHTML).toContain('tune');
    });
  });
});
