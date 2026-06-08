// ============================================
// Connections — Lines Between Board Items
// ============================================

class _Connections {
  constructor() {
    this.connections = [];
    this.svgEl = null;
    this._dragSource = null;
    this._tempLine = null;
    this._onMove = null;
    this._onUp = null;
    this._onEscape = null;
  }

  init() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    if (!this.svgEl) {
      this.svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svgEl.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 0;
      `;
      container.prepend(this.svgEl);
    }
  }

  destroy() {
    this.svgEl?.remove();
    this.svgEl = null;
    this.connections = [];
    this._cleanupConnectMode();
  }

  load(boardId) {
    const stored = localStorage.getItem(`boardflow_connections_${boardId}`);
    if (stored) {
      try { this.connections = JSON.parse(stored); } catch { this.connections = []; }
    } else {
      this.connections = [];
    }
    this.render();
  }

  save(boardId) {
    try {
      localStorage.setItem(`boardflow_connections_${boardId}`, JSON.stringify(this.connections));
    } catch {}
  }

  addConnection(sourceId, targetId, type = 'arrow') {
    if (sourceId === targetId) return;
    this.connections.push({
      id: Utils.generateId('conn'),
      sourceId,
      targetId,
      type,
      color: '#6e6e73',
      width: 2
    });
    this.render();
  }

  removeConnection(id) {
    this.connections = this.connections.filter(c => c.id !== id);
    this.render();
  }

  removeConnectionsForItem(itemId) {
    this.connections = this.connections.filter(c => c.sourceId !== itemId && c.targetId !== itemId);
    this.render();
  }

  render() {
    if (!this.svgEl) return;

    const zoom = Canvas.zoom || 1;
    this.svgEl.innerHTML = '';

    // Shared defs for arrow markers
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const markerColors = new Set(this.connections.map(c => c.color || '#6e6e73'));
    markerColors.forEach((color) => {
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      const markerId = `arrowhead-${color.replace('#', '')}`;
      marker.setAttribute('id', markerId);
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '10');
      marker.setAttribute('refX', '8');
      marker.setAttribute('refY', '5');
      marker.setAttribute('orient', 'auto');
      marker.innerHTML = `<polygon points="0 0, 10 5, 0 10" fill="${color}" />`;
      defs.appendChild(marker);
    });
    this.svgEl.appendChild(defs);

    this.connections.forEach(conn => {
      const sourceEl = document.querySelector(`[data-id="${conn.sourceId}"]`);
      const targetEl = document.querySelector(`[data-id="${conn.targetId}"]`);
      if (!sourceEl || !targetEl) return;

      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const containerRect = this.svgEl.getBoundingClientRect();

      const x1 = (sourceRect.left - containerRect.left + sourceRect.width / 2) / zoom;
      const y1 = (sourceRect.top - containerRect.top + sourceRect.height / 2) / zoom;
      const x2 = (targetRect.left - containerRect.left + targetRect.width / 2) / zoom;
      const y2 = (targetRect.top - containerRect.top + targetRect.height / 2) / zoom;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${y1 + (y2 - y1) * 0.4}, ${x2} ${y2 - (y2 - y1) * 0.4}, ${x2} ${y2}`);
      path.setAttribute('stroke', conn.color || '#6e6e73');
      path.setAttribute('stroke-width', (conn.width || 2) / zoom);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');

      if (conn.type !== 'line') {
        path.setAttribute('marker-end', `url(#arrowhead-${(conn.color || '#6e6e73').replace('#', '')})`);
      }

      // Click to remove
      path.style.pointerEvents = 'stroke';
      path.style.cursor = 'pointer';
      path.tabIndex = 0;
      path.role = 'button';
      path.setAttribute('aria-label', 'Connection — press Enter to remove');
      path.dataset.connId = conn.id;
      path.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeConnection(conn.id);
        if (ItemManager.boardId) this.save(ItemManager.boardId);
      });
      path.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          path.click();
        }
      });

      this.svgEl.appendChild(path);
    });
  }

  startConnectMode(sourceId) {
    this._cleanupConnectMode();
    this._dragSource = sourceId;

    const sourceEl = document.querySelector(`[data-id="${sourceId}"]`);
    sourceEl?.classList.add('connect-source');

    const container = document.getElementById('canvas-container');
    if (!container) return;

    const zoom = Canvas.zoom || 1;

    this._onMove = (e) => {
      if (!this._tempLine) {
        this._tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this._tempLine.style.cssText = 'stroke: var(--primary); stroke-width: 2; stroke-dasharray: 5,5; pointer-events: none;';
        this.svgEl?.appendChild(this._tempLine);
      }
      const sourceEl = document.querySelector(`[data-id="${sourceId}"]`);
      if (!sourceEl) return;
      const sourceRect = sourceEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      this._tempLine.setAttribute('x1', (sourceRect.left - containerRect.left + sourceRect.width / 2) / zoom);
      this._tempLine.setAttribute('y1', (sourceRect.top - containerRect.top + sourceRect.height / 2) / zoom);
      this._tempLine.setAttribute('x2', (e.clientX - containerRect.left) / zoom);
      this._tempLine.setAttribute('y2', (e.clientY - containerRect.top) / zoom);
    };

    this._onUp = (e) => {
      const targetEl = e.target.closest('.board-item');
      if (targetEl && targetEl.dataset.id !== sourceId) {
        this.addConnection(sourceId, targetEl.dataset.id);
        if (ItemManager.boardId) this.save(ItemManager.boardId);
        Toast.show('Connection created', 'success');
      }
      this._cleanupConnectMode();
    };

    this._onEscape = (e) => {
      if (e.key === 'Escape') {
        this._cleanupConnectMode();
        Toast.show('Connection cancelled', 'info');
      }
    };

    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('mouseup', this._onUp);
    document.addEventListener('keydown', this._onEscape);
  }

  isConnecting() {
    return this._dragSource !== null;
  }

  _cleanupConnectMode() {
    document.querySelector('.connect-source')?.classList.remove('connect-source');
    this._tempLine?.remove();
    this._tempLine = null;
    this._dragSource = null;
    if (this._onMove) { window.removeEventListener('mousemove', this._onMove); this._onMove = null; }
    if (this._onUp) { window.removeEventListener('mouseup', this._onUp); this._onUp = null; }
    if (this._onEscape) { document.removeEventListener('keydown', this._onEscape); this._onEscape = null; }
  }
}

try {
  Object.defineProperty(window, 'Connections', { value: new _Connections(), writable: false, configurable: true, enumerable: true });
} catch { window.Connections = new _Connections(); }
