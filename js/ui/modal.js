// ============================================
// Modal Dialog System
// ============================================

class _Modal {
  constructor() {
    this.backdrop = null;
    this.isOpen = false;
    this._escHandler = null;
    this._closeTimeout = null;
  }

  show({ title = '', content = '', confirmText = 'Confirm', cancelText = 'Cancel', confirmStyle = 'primary', onConfirm, onCancel, onOpen, hideCancel }) {
    if (this._closeTimeout) {
      clearTimeout(this._closeTimeout);
      this._closeTimeout = null;
    }
    this.close();

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';
    this.backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close btn btn-ghost" aria-label="Close" style="display: flex; align-items: center; justify-content: center;">${Icons.get('close', 18)}</button>
        </div>
        <div class="modal-body">${content}</div>
        <div class="modal-footer">
          ${hideCancel ? '' : `<button class="btn btn-secondary modal-cancel">${cancelText}</button>`}
          <button class="btn btn-${confirmStyle} modal-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    this.isOpen = true;
    this._previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';

    // Focus first input if present
    requestAnimationFrame(() => {
      const firstInput = this.backdrop.querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
      else this.backdrop.querySelector('.modal-confirm')?.focus();
      onOpen?.();
    });

    // Event listeners
    this.backdrop.querySelector('.modal-close').addEventListener('click', () => this.close());
    this.backdrop.querySelector('.modal-cancel')?.addEventListener('click', () => {
      onCancel?.();
      this.close();
    });
    this.backdrop.querySelector('.modal-confirm').addEventListener('click', async () => {
      const btn = this.backdrop.querySelector('.modal-confirm');
      btn.disabled = true;
      btn.textContent = 'Loading...';
      try {
        await onConfirm?.();
        this.close();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = confirmText;
        Toast?.show(err.message || 'An error occurred', 'error');
      }
    });

    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    document.addEventListener('keydown', this._escHandler = (e) => {
      if (e.key === 'Escape') this.close();
      if (e.key === 'Tab' && this.backdrop) {
        const focusable = this.backdrop.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Animate in
    requestAnimationFrame(() => this.backdrop.classList.add('open'));
  }

  close() {
    if (!this.backdrop) return;
    this.backdrop.classList.remove('open');
    this.isOpen = false;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this._escHandler);
    const prev = this._previousFocus;
    this._closeTimeout = setTimeout(() => {
      this.backdrop?.remove();
      this.backdrop = null;
      this._closeTimeout = null;
      if (prev && typeof prev.focus === 'function') try { prev.focus(); } catch {}
    }, 200);
  }
}

try {
  Object.defineProperty(window, 'Modal', { value: new _Modal(), writable: false, configurable: true, enumerable: true });
} catch { window.Modal = new _Modal(); }
