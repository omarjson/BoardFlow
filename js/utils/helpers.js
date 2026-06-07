// ============================================
// Utility Helpers
// ============================================

const Utils = {
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  throttle(fn, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  screenToCanvas(screenX, screenY, panX, panY, zoom) {
    return {
      x: (screenX - panX) / zoom,
      y: (screenY - panY) / zoom
    };
  },

  canvasToScreen(canvasX, canvasY, panX, panY, zoom) {
    return {
      x: canvasX * zoom + panX,
      y: canvasY * zoom + panY
    };
  },

  downloadFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

window.Utils = Utils;
