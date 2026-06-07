// ============================================
// Context Menu
// ============================================

class _ContextMenu {
  constructor() {
    this.menu = null;
    this.onClose = null;
  }

  show(x, y, items) {
    this.close();

    this.menu = document.createElement('div');
    this.menu.className = 'context-menu';
    this.menu.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      z-index: 9999;
      min-width: 180px;
      background: var(--surface);
      border: 1px solid var(--hairline);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-elevated);
      padding: var(--space-xs) 0;
      animation: contextMenuIn 0.12s ease;
    `;

    items.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.style.cssText = 'height: 1px; background: var(--hairline); margin: var(--space-xs) 0;';
        this.menu.appendChild(sep);
        return;
      }

      const btn = document.createElement('button');
      btn.className = 'context-menu-item';
      btn.style.cssText = `
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        width: 100%;
        padding: var(--space-sm) var(--space-md);
        font-size: var(--text-sm);
        color: ${item.danger ? 'var(--danger)' : 'var(--ink)'};
        text-align: left;
        border: none;
        background: none;
        cursor: pointer;
        transition: background 0.1s ease;
      `;

      if (item.icon) {
        const icon = document.createElement('span');
        icon.textContent = item.icon;
        icon.style.cssText = 'width: 20px; text-align: center; font-size: var(--text-base);';
        btn.appendChild(icon);
      }

      const label = document.createElement('span');
      label.textContent = item.label;
      btn.appendChild(label);

      if (item.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.textContent = item.shortcut;
        shortcut.style.cssText = 'margin-left: auto; font-size: var(--text-xs); color: var(--ink-muted);';
        btn.appendChild(shortcut);
      }

      btn.addEventListener('mouseenter', () => {
        btn.style.background = item.danger ? '#ff3b3014' : 'var(--canvas-soft)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'none';
      });

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
        item.action?.();
      });

      this.menu.appendChild(btn);
    });

    document.body.appendChild(this.menu);

    // Adjust position if off-screen
    const rect = this.menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.menu.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      this.menu.style.top = (y - rect.height) + 'px';
    }
    if (rect.left < 0) {
      this.menu.style.left = '4px';
    }
    if (rect.top < 0) {
      this.menu.style.top = '4px';
    }

    // Close on click outside, Escape key
    requestAnimationFrame(() => {
      document.addEventListener('click', this._closeHandler = () => this.close());
      document.addEventListener('contextmenu', this._closeHandler);
      document.addEventListener('keydown', this._escHandler = (e) => {
        if (e.key === 'Escape') this.close();
      });
    });
  }

  close() {
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
    }
    document.removeEventListener('click', this._closeHandler);
    document.removeEventListener('contextmenu', this._closeHandler);
    document.removeEventListener('keydown', this._escHandler);
    this.onClose?.();
  }
}

try {
  Object.defineProperty(window, 'ContextMenu', { value: new _ContextMenu(), writable: false, configurable: true, enumerable: true });
} catch { window.ContextMenu = new _ContextMenu(); }

// Add animation
if (!document.getElementById('context-menu-styles')) {
  const style = document.createElement('style');
  style.id = 'context-menu-styles';
  style.textContent = `
    @keyframes contextMenuIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}
