const fs = require('fs');
const path = require('path');

import {
  escapeHtml,
  formatPersonnelName,
  getRankSvg,
  renderEditableTextButton,
  bindEditableTextButton,
  createProgrammeRenameDialog,
  PersonnelManager
} from '../../js/utils/programme-settings-editor.js';
import { Toast } from '../../js/components/Toast.js';

jest.mock('../../js/components/Toast.js', () => ({
  Toast: { show: jest.fn() }
}));

describe('Programme Settings Editor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Toast.show.mockClear();
  });

  describe('Formatting & Escaping Helpers', () => {
    it('formats rank and name cleanly', () => {
      expect(formatPersonnelName('FS', 'Sheffield')).toBe('FS Sheffield');
      expect(formatPersonnelName('  Sgt ', ' Smith  ')).toBe('Sgt Smith');
      expect(formatPersonnelName('', 'Smith')).toBe('Smith');
    });

    it('escapes HTML special characters safely', () => {
      expect(escapeHtml('<script>"O\'Brien" & Co</script>')).toBe('&lt;script&gt;&quot;O&#39;Brien&quot; &amp; Co&lt;/script&gt;');
    });

    it('maps known ranks to SVG paths with Cdt fallback', () => {
      expect(getRankSvg('FS')).toBe('images/ranks/fsgt.svg');
      expect(getRankSvg('Flt Lt')).toBe('images/ranks/flt_lt.svg');
      expect(getRankSvg('Unknown')).toBe('images/ranks/cdt.svg');
    });
  });

  describe('Direct Click-to-Edit Inline Rename (bindEditableTextButton)', () => {
    function setupRow(initialValue = 'Dark Blue', onCommit = jest.fn()) {
      document.body.innerHTML = `
        <div class="set-item reorder-item" draggable="true">
          <div class="flex-row align-center flex-1 gap-sm">
            ${renderEditableTextButton(initialValue, { className: 'edit-text', title: 'Click to rename' })}
          </div>
        </div>
      `;
      const row = document.querySelector('.reorder-item');
      bindEditableTextButton(row, '.edit-text', {
        inputLabel: 'Rename uniform',
        onCommit
      });
      return { row, btn: row.querySelector('.edit-text'), onCommit };
    }

    it('switches to an inline edit form on click, disables row dragging, and commits on submit', () => {
      const { row, btn, onCommit } = setupRow('Dark Blue');

      btn.click();

      expect(row.classList.contains('is-editing')).toBe(true);
      expect(row.draggable).toBe(false);
      expect(btn.classList.contains('hidden')).toBe(true);

      const form = row.querySelector('.inline-edit-form');
      const input = form.querySelector('.inline-edit-input');
      expect(input.value).toBe('Dark Blue');

      input.value = 'No. 1 Blue';
      form.dispatchEvent(new Event('submit', { cancelable: true }));

      expect(onCommit).toHaveBeenCalledWith('No. 1 Blue', 'Dark Blue', btn);
      expect(row.classList.contains('is-editing')).toBe(false);
      expect(row.draggable).toBe(true);
      expect(btn.classList.contains('hidden')).toBe(false);
    });

    it('blocks Enter submission during IME composition (isComposing or keyCode 229)', () => {
      const { row, btn, onCommit } = setupRow('Leading');
      btn.click();

      const input = row.querySelector('.inline-edit-input');
      input.value = 'Leading Cadet';

      const composingEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      Object.defineProperty(composingEvent, 'isComposing', { value: true });
      input.dispatchEvent(composingEvent);
      expect(onCommit).not.toHaveBeenCalled();

      const safariImeEvent = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true, cancelable: true });
      input.dispatchEvent(safariImeEvent);
      expect(onCommit).not.toHaveBeenCalled();

      // Normal Enter submits cleanly
      const normalEnter = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true, cancelable: true });
      input.dispatchEvent(normalEnter);
      expect(onCommit).toHaveBeenCalledWith('Leading Cadet', 'Leading', btn);
    });

    it('cancels without committing on Escape or Cancel button click', () => {
      const { row, btn, onCommit } = setupRow('Academic');
      btn.click();

      const input = row.querySelector('.inline-edit-input');
      input.value = 'Changed';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

      expect(onCommit).not.toHaveBeenCalled();
      expect(row.querySelector('.inline-edit-form')).toBeNull();
      expect(row.draggable).toBe(true);

      // Reopen and cancel via button
      btn.click();
      const cancelBtn = row.querySelector('.btn-inline-cancel');
      cancelBtn.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      cancelBtn.click();

      expect(onCommit).not.toHaveBeenCalled();
      expect(row.querySelector('.inline-edit-form')).toBeNull();
    });

    it('rejects empty submissions with an error toast and keeps the input open', () => {
      const { row, btn, onCommit } = setupRow('Greens');
      btn.click();

      const form = row.querySelector('.inline-edit-form');
      const input = form.querySelector('.inline-edit-input');
      input.value = '   ';
      form.dispatchEvent(new Event('submit', { cancelable: true }));

      expect(onCommit).not.toHaveBeenCalled();
      expect(Toast.show).toHaveBeenCalledWith('Name cannot be empty.', 'error');
      expect(row.querySelector('.inline-edit-form')).not.toBeNull();
    });

    it('does not trigger onCommit when submitted value is unchanged', () => {
      const { row, btn, onCommit } = setupRow('Civvis');
      btn.click();

      const form = row.querySelector('.inline-edit-form');
      form.dispatchEvent(new Event('submit', { cancelable: true }));

      expect(onCommit).not.toHaveBeenCalled();
      expect(row.querySelector('.inline-edit-form')).toBeNull();
    });
  });

  describe('Native Rename Confirmation Dialog (createProgrammeRenameDialog)', () => {
    function setupDialog(previewResponse = { matching_nights: 2 }) {
      document.body.innerHTML = `
        <dialog id="programme-rename-dialog" class="programme-rename-dialog" aria-labelledby="programme-rename-dialog-title" closedby="any">
          <form method="dialog" id="programme-rename-form">
            <h2 id="programme-rename-dialog-title">Save Change</h2>
            <div id="programme-rename-summary"></div>
            <label for="programme-rename-update-upcoming">
              <input type="checkbox" id="programme-rename-update-upcoming" name="update_upcoming">
              <span id="programme-rename-upcoming-hint"></span>
            </label>
            <button type="submit" value="cancel">Cancel</button>
            <button type="submit" value="save">Save Change</button>
          </form>
        </dialog>
      `;
      const dialogEl = document.getElementById('programme-rename-dialog');
      dialogEl.showModal = jest.fn(() => { dialogEl.setAttribute('open', ''); });
      dialogEl.close = jest.fn((val = '') => {
        dialogEl.returnValue = val;
        dialogEl.removeAttribute('open');
        dialogEl.dispatchEvent(new Event('close'));
      });

      const apiFetchFn = jest.fn().mockResolvedValue(previewResponse);
      const controller = createProgrammeRenameDialog({ dialogEl, apiFetchFn });
      return { dialogEl, apiFetchFn, controller };
    }

    it('shows before/after preview, fetches upcoming night count, and returns checked option on save', async () => {
      const { dialogEl, apiFetchFn, controller } = setupDialog({ matching_nights: 3 });

      const promise = controller.confirmRename({
        title: 'Update NCO',
        entityType: 'nco',
        oldDisplay: 'Sgt Sheffield',
        newDisplay: 'FS Sheffield',
        oldRank: 'Sgt',
        newRank: 'FS'
      });

      // Wait for async preview fetch microtask
      await Promise.resolve();
      await Promise.resolve();

      expect(dialogEl.showModal).toHaveBeenCalled();
      expect(apiFetchFn).toHaveBeenCalledWith('api/programme.php?action=rename_preview&type=nco&old_value=Sgt+Sheffield');
      expect(dialogEl.querySelector('#programme-rename-summary').textContent).toContain('Sgt Sheffield');
      expect(dialogEl.querySelector('#programme-rename-summary').textContent).toContain('FS Sheffield');
      expect(dialogEl.querySelector('#programme-rename-upcoming-hint').textContent).toContain('Will update 3 upcoming parade nights');

      const checkbox = dialogEl.querySelector('#programme-rename-update-upcoming');
      expect(checkbox.checked).toBe(false);
      checkbox.checked = true;

      dialogEl.close('save');
      const result = await promise;

      expect(result).toEqual({ confirmed: true, updateUpcoming: true });
      // Return value must be cleared after close so stale values cannot leak
      expect(dialogEl.returnValue).toBe('');
    });

    it('treats Escape/dismissal (empty returnValue) as cancelled', async () => {
      const { dialogEl, controller } = setupDialog({ matching_nights: 0 });

      const promise = controller.confirmRename({
        title: 'Rename Uniform',
        entityType: 'uniform',
        oldDisplay: 'Dark Blue',
        newDisplay: 'No. 1 Blue',
        swatchColor: '#002F5F'
      });

      await Promise.resolve();
      dialogEl.close('');

      const result = await promise;
      expect(result).toEqual({ confirmed: false, updateUpcoming: false });
      expect(dialogEl.returnValue).toBe('');
    });
  });

  describe('PersonnelManager Graphical Rank Picker & Inline Name Edit', () => {
    function simpleRenderList(containerId, items, config) {
      const container = document.getElementById(containerId);
      container.innerHTML = '';
      items.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'set-item reorder-item';
        div.draggable = true;
        div.innerHTML = `<div class="flex-row">${config.renderInner(item, i)}</div>`;
        if (config.bindEvents) config.bindEvents(div, item, i);
        container.appendChild(div);
      });
    }

    it('opens the graphical rank picker anchored to an existing NCO row and triggers editFn on rank change', async () => {
      document.body.innerHTML = '<div id="nco-manager-container"></div>';
      const ncos = [{ id: 1, name: 'Sheffield', rank: 'Sgt' }];
      const editFn = jest.fn().mockImplementation(async (item, name, rank) => {
        item.name = name;
        item.rank = rank;
        return true;
      });

      const manager = new PersonnelManager({
        containerId: 'nco-manager-container',
        title: 'Manage Duty NCOs',
        ranks: ['Cpl', 'Sgt', 'FS', 'CWO'],
        renderListFn: simpleRenderList,
        loadFn: async () => ncos,
        addFn: jest.fn(),
        editFn,
        deleteFn: jest.fn(),
        reorderFn: jest.fn()
      });

      await Promise.resolve();
      await Promise.resolve();

      const rankTrigger = document.querySelector('.editable-rank-btn');
      expect(rankTrigger).not.toBeNull();
      expect(rankTrigger.textContent).toContain('Sgt');

      // Click existing row's rank badge/label button
      rankTrigger.click();

      const popover = document.getElementById('rank-picker-nco-manager');
      expect(popover.classList.contains(':popover-open')).toBe(true);
      expect(rankTrigger.classList.contains('is-rank-picker-open')).toBe(true);
      expect(popover.querySelector('[data-rank="Sgt"]').getAttribute('aria-pressed')).toBe('true');

      // Promote to FS
      popover.querySelector('[data-rank="FS"]').click();
      await Promise.resolve();
      await Promise.resolve();

      expect(editFn).toHaveBeenCalledWith(ncos[0], 'Sheffield', 'FS', 0);
      expect(document.querySelector('.editable-rank-btn').textContent).toContain('FS');
      expect(manager).toBeDefined();
    });

    it('reveals rank preview SVG when selecting a rank in Add mode', async () => {
      document.body.innerHTML = '<div id="staff-manager-container"></div>';
      const addFn = jest.fn();

      new PersonnelManager({
        containerId: 'staff-manager-container',
        title: 'Manage Staff',
        ranks: ['Flt Lt', 'WO', 'CI'],
        renderListFn: simpleRenderList,
        loadFn: async () => [],
        addFn,
        editFn: jest.fn(),
        deleteFn: jest.fn(),
        reorderFn: jest.fn()
      });

      await Promise.resolve();

      document.getElementById('btn-rank-staff-manager').click();
      document.querySelector('#rank-picker-staff-manager [data-rank="WO"]').click();

      const rankImg = document.getElementById('staff-manager-rank-display');
      const rankText = document.getElementById('staff-manager-rank-text');
      expect(rankImg.classList.contains('hidden')).toBe(false);
      expect(rankImg.getAttribute('src')).toBe('images/ranks/wo.svg');
      expect(rankText.classList.contains('hidden')).toBe(true);
    });
  });

  describe('CSS Modern Web Compliance Checks', () => {
    const componentsCss = fs.readFileSync(path.resolve(__dirname, '../../css/components.css'), 'utf8');
    const adminCss = fs.readFileSync(path.resolve(__dirname, '../../css/pages/admin.css'), 'utf8');

    it('gates rank-picker-popover anchor positioning inside @supports with flip fallbacks', () => {
      expect(componentsCss).toContain('@supports (position-area: block-end)');
      expect(componentsCss).toContain('position-area: block-end span-inline-end;');
      expect(componentsCss).toContain('position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;');
      expect(componentsCss).toContain(':is(:popover-open, .\\:popover-open)');
    });

    it('contains modal scroll on dialog and backdrop without unconditional dialog display override', () => {
      expect(adminCss).toContain('dialog.programme-rename-dialog:modal');
      expect(adminCss).toContain('dialog.programme-rename-dialog::backdrop');
      expect(adminCss).toContain('overscroll-behavior: contain;');
      expect(adminCss).toContain('overflow: hidden;');
      expect(adminCss).toContain('@media (hover: none)');
    });
  });
});
