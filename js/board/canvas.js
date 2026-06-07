// ============================================
// Infinite Canvas — Pan, Zoom, Grid
// ============================================

class _Canvas {
  constructor() {
    this.el = null;
    this.container = null;
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1;
    this.minZoom = 0.1;
    this.maxZoom = 5;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;
    this.gridEnabled = true;
    this.gridSize = 20;
    this.listeners = [];
    this.onZoomChange = null;
    this.onPanChange = null;
  }

  init() {
    this.el = document.getElementById('canvas');
    this.container = document.getElementById('canvas-container');
    if (!this.el || !this.container) return;

    this._bindEvents();
    this._applyTransform();
    this._renderGrid();
    this.centerCanvas();
  }

  _bindEvents() {
    // Mouse pan
    this.el.addEventListener('mousedown', (e) => {
      if (e.target !== this.el && e.target !== this.container && !e.target.classList.contains('canvas-grid')) return;
      if (e.button !== 0) return;
      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.el.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', Utils.throttle((e) => {
      if (!this.isPanning) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this._applyTransform();
      this.onPanChange?.(this.panX, this.panY);
    }, 16));

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.el.style.cursor = 'grab';
      }
    });

    // Wheel zoom
    this.el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Utils.clamp(this.zoom + delta * this.zoom, this.minZoom, this.maxZoom);

      // Zoom toward mouse position
      const rect = this.el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scale = newZoom / this.zoom;
      this.panX = mouseX - scale * (mouseX - this.panX);
      this.panY = mouseY - scale * (mouseY - this.panY);
      this.zoom = newZoom;

      this._applyTransform();
      this._renderGrid();
      this.onZoomChange?.(this.zoom);
    }, { passive: false });

    // Touch pan/zoom
    let lastTouchDist = 0;
    let lastTouchCenter = { x: 0, y: 0 };

    this.el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isPanning = true;
        this.startX = e.touches[0].clientX - this.panX;
        this.startY = e.touches[0].clientY - this.panY;
      } else if (e.touches.length === 2) {
        this.isPanning = false;
        lastTouchDist = this._getTouchDist(e.touches);
        lastTouchCenter = this._getTouchCenter(e.touches);
      }
    }, { passive: true });

    this.el.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isPanning) {
        this.panX = e.touches[0].clientX - this.startX;
        this.panY = e.touches[0].clientY - this.startY;
        this._applyTransform();
        this.onPanChange?.(this.panX, this.panY);
      } else if (e.touches.length === 2) {
        const dist = this._getTouchDist(e.touches);
        const center = this._getTouchCenter(e.touches);
        const scale = dist / lastTouchDist;
        const newZoom = Utils.clamp(this.zoom * scale, this.minZoom, this.maxZoom);

        const rect = this.el.getBoundingClientRect();
        const cx = center.x - rect.left;
        const cy = center.y - rect.top;

        const s = newZoom / this.zoom;
        this.panX = cx - s * (cx - this.panX);
        this.panY = cy - s * (cy - this.panY);
        this.zoom = newZoom;

        lastTouchDist = dist;
        lastTouchCenter = center;
        this._applyTransform();
        this._renderGrid();
        this.onZoomChange?.(this.zoom);
      }
      e.preventDefault();
    }, { passive: false });

    this.el.addEventListener('touchend', () => {
      this.isPanning = false;
    });

    // Keyboard shortcuts
    this._keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.resetView();
      } else if (e.key === '=' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.zoomIn();
      } else if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.zoomOut();
      } else if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        this.toggleGrid();
      }
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  _applyTransform() {
    if (this.container) {
      this.container.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }
  }

  _renderGrid() {
    const existing = this.el.querySelector('.canvas-grid');
    if (existing) existing.remove();

    if (!this.gridEnabled) return;

    const grid = document.createElement('div');
    grid.className = 'canvas-grid';
    grid.style.cssText = `
      position: absolute;
      top: -5000px; left: -5000px;
      width: 10000px; height: 10000px;
      pointer-events: none;
      background-image:
        radial-gradient(circle, var(--canvas-grid-color) 1px, transparent 1px);
      background-size: ${this.gridSize}px ${this.gridSize}px;
      opacity: 0.5;
    `;
    this.container.prepend(grid);
  }

  _getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  _getTouchCenter(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }

  centerCanvas() {
    if (!this.el) return;
    const rect = this.el.getBoundingClientRect();
    this.panX = rect.width / 2;
    this.panY = rect.height / 2;
    this._applyTransform();
  }

  resetView() {
    this.zoom = 1;
    this.centerCanvas();
    this._renderGrid();
    this.onZoomChange?.(this.zoom);
  }

  panTo(x, y) {
    if (!this.el) return;
    const rect = this.el.getBoundingClientRect();
    this.panX = rect.width / 2 - x * this.zoom;
    this.panY = rect.height / 2 - y * this.zoom;
    this._applyTransform();
    this.onPanChange?.(this.panX, this.panY);
  }

  zoomIn() {
    this.zoom = Utils.clamp(this.zoom * 1.2, this.minZoom, this.maxZoom);
    this._applyTransform();
    this.onZoomChange?.(this.zoom);
  }

  zoomOut() {
    this.zoom = Utils.clamp(this.zoom / 1.2, this.minZoom, this.maxZoom);
    this._applyTransform();
    this.onZoomChange?.(this.zoom);
  }

  toggleGrid() {
    this.gridEnabled = !this.gridEnabled;
    this._renderGrid();
  }

  getZoom() {
    return this.zoom;
  }

  getPan() {
    return { x: this.panX, y: this.panY };
  }

  screenToCanvas(screenX, screenY) {
    const rect = this.el.getBoundingClientRect();
    return Utils.screenToCanvas(
      screenX - rect.left,
      screenY - rect.top,
      this.panX,
      this.panY,
      this.zoom
    );
  }

  destroy() {
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
    this.el = null;
    this.container = null;
  }
}

try {
  Object.defineProperty(window, 'Canvas', { value: new _Canvas(), writable: false, configurable: true, enumerable: true });
} catch { window.Canvas = new _Canvas(); }
