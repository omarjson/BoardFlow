// ============================================
// Toast Notification System
// ============================================

class _Toast {
  constructor() {
    this.container = null;
    this.queue = [];
    this.maxVisible = 5;
  }

  _ensureContainer() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: var(--space-lg);
      left: 50%;
      transform: translateX(-50%);
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column-reverse;
      gap: var(--space-sm);
      pointer-events: none;
      max-width: 400px;
      width: calc(100% - var(--space-xl) * 2);
    `;
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = 3000) {
    this._ensureContainer();

    const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      background: var(--surface);
      border: 1px solid var(--hairline);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-elevated);
      font-size: var(--text-sm);
      color: var(--ink);
      animation: toastIn 0.3s ease;
      cursor: pointer;
    `;

    const iconSpan = document.createElement('span');
    iconSpan.style.cssText = `
      width: 20px; height: 20px;
      border-radius: var(--radius-full);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--text-xs); font-weight: var(--weight-bold);
      flex-shrink: 0;
    `;

    const colorMap = {
      success: 'var(--success)',
      error: 'var(--danger)',
      warning: 'var(--warning)',
      info: 'var(--info)'
    };
    iconSpan.style.background = colorMap[type] || colorMap.info;
    iconSpan.style.color = '#fff';
    iconSpan.textContent = icons[type] || icons.info;

    const textSpan = document.createElement('span');
    textSpan.textContent = message;

    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);

    toast.addEventListener('click', () => this._remove(toast));

    this.container.appendChild(toast);

    // Auto-remove
    if (duration > 0) {
      setTimeout(() => this._remove(toast), duration);
    }

    // Limit visible toasts
    while (this.container.children.length > this.maxVisible) {
      this._remove(this.container.firstChild);
    }

    return toast;
  }

  _remove(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }
}

try {
  Object.defineProperty(window, 'Toast', { value: new _Toast(), writable: false, configurable: true, enumerable: true });
} catch { window.Toast = new _Toast(); }

// Add toast animations
if (!document.getElementById('toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    @keyframes toastIn {
      from { opacity: 0; transform: translateY(12px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to { opacity: 0; transform: translateY(-8px) scale(0.95); }
    }
  `;
  document.head.appendChild(style);
}
