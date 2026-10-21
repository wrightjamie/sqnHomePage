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
  });

  describe('DOM Sliding Interaction', () => {
    let wrapper, toggleBtn, sidebar, slideCloseBtn;

    beforeEach(() => {
      document.body.innerHTML = `
        <div id="editor-sidebar-wrapper" class="editor-sidebar-wrapper collapsed">
          <button id="sidebar-toggle-btn" class="sidebar-toggle-btn" type="button" title="Open Dashboard Settings" aria-label="Toggle Dashboard Settings">
            <span class="material-symbols-outlined">tune</span>
          </button>
          <div class="editor-sidebar glass-panel">
            <div class="flex-space-between-center mb-xs">
              <h3 class="m-0">Dashboard Settings</h3>
              <button id="slide-close-editor-btn" class="btn-close-editor" title="Slide In Settings (Hide)" type="button">
                <i class="ph ph-x"></i>
              </button>
            </div>
          </div>
        </div>
      `;

      wrapper = document.getElementById('editor-sidebar-wrapper');
      toggleBtn = document.getElementById('sidebar-toggle-btn');
      sidebar = wrapper.querySelector('.editor-sidebar');
      slideCloseBtn = document.getElementById('slide-close-editor-btn');

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
      slideCloseBtn.onclick = () => toggleSettingsPanel(false);
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

    it('should slide closed when the header close button is clicked', () => {
      wrapper.classList.remove('collapsed');
      toggleBtn.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';

      slideCloseBtn.click();

      expect(wrapper.classList.contains('collapsed')).toBe(true);
      expect(toggleBtn.title).toBe('Open Dashboard Settings');
      expect(toggleBtn.innerHTML).toContain('tune');
    });
  });
});
