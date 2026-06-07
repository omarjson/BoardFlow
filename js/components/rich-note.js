// ============================================
// Enhanced Rich Note Component
// ============================================

const RichNote = {
  render(item) {
    const el = document.createElement('div');
    el.className = 'board-item rich-note-item';
    el.dataset.id = item.id;
    el.dataset.type = 'rich_note';
    el.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      width: ${item.width}px;
      height: ${item.height}px;
      transform: translate(${item.position_x}px, ${item.position_y}px) rotate(${item.rotation}deg);
      z-index: ${item.z_index};
    `;

    el.innerHTML = `
      <div class="rich-note" style="height: 100%; display: flex; flex-direction: column;">
        <div class="rich-note-header">
          <div class="rich-note-format-bar">
            <button class="format-btn" data-command="bold" title="Bold (Ctrl+B)"><b>B</b></button>
            <button class="format-btn" data-command="italic" title="Italic (Ctrl+I)"><i>I</i></button>
            <button class="format-btn" data-command="underline" title="Underline (Ctrl+U)"><u>U</u></button>
            <div class="format-divider"></div>
            <button class="format-btn" data-command="insertUnorderedList" title="Bullet List">•</button>
            <button class="format-btn" data-command="insertOrderedList" title="Numbered List">#</button>
            <div class="format-divider"></div>
            <button class="format-btn" data-command="strikeThrough" title="Strikethrough"><s>S</s></button>
          </div>
          <div class="rich-note-menu-btn" data-action="menu">⋯</div>
        </div>
        <div class="note-title" contenteditable="true" data-field="title" placeholder="Note title...">${Utils.escapeHtml(item.title)}</div>
        <div class="note-content rich-text-content" contenteditable="true" data-field="content" placeholder="Start writing...">${this._renderContent(item.content)}</div>
      </div>
      <div class="item-type-badge">Rich Note</div>
    `;

    this._bindEvents(el, item);
    return el;
  },

  _renderContent(content) {
    if (!content) return '';
    // Escape HTML first, then apply markdown
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '<div class="checklist-item">$1</div>')
      .replace(/^# (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h4>$1</h4>')
      .replace(/\n/g, '<br>');
  },

  _bindEvents(el, item) {
    // Save on blur — use innerHTML for content to preserve formatting
    el.querySelectorAll('[contenteditable="true"]').forEach(field => {
      field.addEventListener('blur', () => {
        const value = field.dataset.field === 'content' ? field.innerHTML : field.textContent;
        ItemManager.updateItem(item.id, { [field.dataset.field]: value });
      });
      field.addEventListener('mousedown', (e) => e.stopPropagation());
    });

    // Format buttons
    el.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.execCommand(btn.dataset.command, false, null);
      });
    });

    // Menu button
    el.querySelector('[data-action="menu"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._showContextMenu(e, item);
    });

    // Right-click
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._showContextMenu(e, item);
    });

    // Handle keyboard shortcuts within the note
    const contentEl = el.querySelector('.rich-text-content');
    if (contentEl) {
      contentEl.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          document.execCommand('insertText', false, '    ');
        }
      });
    }
  },

  _showContextMenu(e, item) {
    ContextMenu.show(e.clientX, e.clientY, [
      { icon: Icons.edit, label: 'Edit', action: () => {
        const titleEl = document.querySelector(`[data-id="${item.id}"] .note-title`);
        if (titleEl) titleEl.focus();
      }},
      { icon: Icons.board, label: 'Duplicate', action: async () => {
        await ItemManager.createItem('rich_note', {
          x: item.position_x + 20,
          y: item.position_y + 20,
          width: item.width,
          height: item.height,
          title: item.title + ' (copy)',
          content: item.content
        });
      }},
      { icon: Icons.file, label: 'Copy Content', shortcut: 'Ctrl+C', action: () => {
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

window.RichNote = RichNote;
