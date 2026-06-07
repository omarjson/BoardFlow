// ============================================
// Enhanced Sticky Note Component
// ============================================

const StickyNote = {
  COLORS: [
    { name: 'Yellow', value: '#fffde7' },
    { name: 'Pink', value: '#fce4ec' },
    { name: 'Blue', value: '#e3f2fd' },
    { name: 'Green', value: '#e8f5e9' },
    { name: 'Purple', value: '#f3e5f5' },
    { name: 'Orange', value: '#fff3e0' },
    { name: 'Teal', value: '#e0f2f1' },
    { name: 'White', value: '#ffffff' }
  ],

  render(item) {
    const el = document.createElement('div');
    el.className = 'board-item sticky-note-item';
    el.dataset.id = item.id;
    el.dataset.type = 'sticky_note';
    el.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      width: ${item.width}px;
      height: ${item.height}px;
      transform: translate(${item.position_x}px, ${item.position_y}px) rotate(${item.rotation}deg);
      z-index: ${item.z_index};
    `;

    const color = item.color || '#fffde7';

    el.innerHTML = `
      <div class="sticky-note" style="background: ${color}; height: 100%; display: flex; flex-direction: column;">
        <div class="sticky-note-header">
          <div class="sticky-note-color-picker" data-action="color">
            <span class="color-dot" style="background: ${color};"></span>
          </div>
          <div class="sticky-note-menu-btn" data-action="menu">⋯</div>
        </div>
        <div class="note-title" contenteditable="true" data-field="title" placeholder="Title...">${Utils.escapeHtml(item.title)}</div>
        <div class="note-content" contenteditable="true" data-field="content" placeholder="Write something...">${Utils.escapeHtml(item.content)}</div>
      </div>
      <div class="item-type-badge">Note</div>
    `;

    // Event handlers
    this._bindEvents(el, item);

    return el;
  },

  _bindEvents(el, item) {
    // Save on blur
    el.querySelectorAll('[contenteditable="true"]').forEach(field => {
      field.addEventListener('blur', () => {
        ItemManager.updateItem(item.id, { [field.dataset.field]: field.textContent });
      });
      field.addEventListener('mousedown', (e) => e.stopPropagation());
      field.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          field.blur();
        }
      });
    });

    // Color picker
    el.querySelector('[data-action="color"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._showColorPicker(el, item);
    });

    // Context menu button
    el.querySelector('[data-action="menu"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._showContextMenu(e, item);
    });

    // Right-click context menu
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._showContextMenu(e, item);
    });
  },

  _showColorPicker(el, item) {
    // Remove any existing picker
    document.querySelectorAll('.sticky-note-color-dropdown').forEach(d => d.remove());

    const btn = el.querySelector('[data-action="color"]');
    const btnRect = btn.getBoundingClientRect();

    const dropdown = document.createElement('div');
    dropdown.className = 'sticky-note-color-dropdown';
    dropdown.style.cssText = `
      position: fixed;
      left: ${btnRect.left}px;
      top: ${btnRect.bottom + 4}px;
      background: var(--surface);
      border: 1px solid var(--hairline);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-elevated);
      padding: var(--space-sm);
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-xs);
      z-index: 10000;
    `;

    this.COLORS.forEach(color => {
      const swatch = document.createElement('button');
      swatch.style.cssText = `
        width: 28px; height: 28px;
        border-radius: var(--radius-sm);
        background: ${color.value};
        border: 2px solid ${item.color === color.value ? 'var(--primary)' : 'var(--hairline)'};
        cursor: pointer;
        transition: transform 0.1s ease;
      `;
      swatch.title = color.name;
      swatch.addEventListener('mouseenter', () => swatch.style.transform = 'scale(1.1)');
      swatch.addEventListener('mouseleave', () => swatch.style.transform = 'scale(1)');
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        const noteEl = el.querySelector('.sticky-note');
        if (noteEl) noteEl.style.background = color.value;
        ItemManager.updateItem(item.id, { color: color.value });
        dropdown.remove();
      });
      dropdown.appendChild(swatch);
    });

    document.body.appendChild(dropdown);

    // Close on click outside
    const close = (e) => {
      if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.remove();
        document.removeEventListener('click', close);
      }
    };
    requestAnimationFrame(() => document.addEventListener('click', close));
  },

  _showContextMenu(e, item) {
    ContextMenu.show(e.clientX, e.clientY, [
      { icon: Icons.edit, label: 'Edit', action: () => {
        const titleEl = document.querySelector(`[data-id="${item.id}"] .note-title`);
        if (titleEl) titleEl.focus();
      }},
      { icon: Icons.board, label: 'Duplicate', action: async () => {
        await ItemManager.createItem('sticky_note', {
          x: item.position_x + 20,
          y: item.position_y + 20,
          width: item.width,
          height: item.height,
          title: item.title + ' (copy)',
          content: item.content,
          color: item.color
        });
      }},
      { icon: Icons.file, label: 'Copy', shortcut: 'Ctrl+C', action: () => {
        navigator.clipboard?.writeText(item.content || '');
      }},
      { separator: true },
      { icon: Icons.arrowLeft, label: 'Bring to Front', action: () => ItemManager.bringToFront(item.id) },
      { icon: Icons.arrowLeft, label: 'Send to Back', action: () => ItemManager.sendToBack(item.id) },
      { separator: true },
      { icon: Icons.trash, label: 'Delete', shortcut: 'Del', danger: true, action: () => ItemManager.deleteItem(item.id) }
    ]);
  }
};

window.StickyNote = StickyNote;
