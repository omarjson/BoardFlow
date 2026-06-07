// ============================================
// Mini-Map Navigation
// ============================================

class Minimap {
  constructor() {
    this.el = null;
    this.ctx = null;
    this.width = 160;
    this.height = 120;
    this.scale = 0.05;
    this.viewportRect = null;
    this.isDragging = false;
  }

  init() {
    this.el = document.getElementById('minimap');
    if (!this.el) return;

    this.el.innerHTML = `
      <canvas width="${this.width}" height="${this.height}" style="width: 100%; height: 100%;"></canvas>
    `;
    this.ctx = this.el.querySelector('canvas').getContext('2d');

    this._bindEvents();
    this.render();
  }

  _bindEvents() {
    this.el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this._navigateTo(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this._navigateTo(e);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  _navigateTo(e) {
    const rect = this.el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) return;
    const canvasRect = canvasEl.getBoundingClientRect();

    // Use stored world bounds from last render
    if (this._minX === undefined) return;

    const worldX = this._minX + x * this._worldWidth;
    const worldY = this._minY + y * this._worldHeight;

    Canvas.panX = canvasRect.width / 2 - worldX * Canvas.zoom;
    Canvas.panY = canvasRect.height / 2 - worldY * Canvas.zoom;
    Canvas._applyTransform();
    this.render();
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const items = ItemManager.getItems();

    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || '#2c2c2e';
    ctx.fillRect(0, 0, this.width, this.height);

    if (items.length === 0) return;

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    items.forEach(item => {
      minX = Math.min(minX, item.position_x);
      minY = Math.min(minY, item.position_y);
      maxX = Math.max(maxX, item.position_x + item.width);
      maxY = Math.max(maxY, item.position_y + item.height);
    });

    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;
    this.scale = Math.min(this.width / worldWidth, this.height / worldHeight);
    this._minX = minX;
    this._minY = minY;
    this._worldWidth = worldWidth;
    this._worldHeight = worldHeight;

    // Draw items
    const colorMap = {
      sticky_note: '#ff9f0a',
      rich_note: '#007aff',
      sketch: '#34c759',
      screenshot: '#af52de',
      link_card: '#5ac8fa',
      file: '#ff6482',
      audio: '#30d158',
      video: '#ff3b30',
      image: '#ffd60a'
    };

    items.forEach(item => {
      const x = (item.position_x - minX) * this.scale;
      const y = (item.position_y - minY) * this.scale;
      const w = Math.max(item.width * this.scale, 3);
      const h = Math.max(item.height * this.scale, 3);

      ctx.fillStyle = colorMap[item.type] || '#6e6e73';
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x, y, w, h);
    });

    ctx.globalAlpha = 1;

    // Draw viewport
    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) return;
    const canvasRect = canvasEl.getBoundingClientRect();

    const vpX = (-Canvas.panX / Canvas.zoom - minX) * this.scale;
    const vpY = (-Canvas.panY / Canvas.zoom - minY) * this.scale;
    const vpW = (canvasRect.width / Canvas.zoom) * this.scale;
    const vpH = (canvasRect.height / Canvas.zoom) * this.scale;

    ctx.strokeStyle = '#007aff';
    ctx.lineWidth = 2;
    ctx.strokeRect(vpX, vpY, vpW, vpH);
  }

  destroy() {
    this.el = null;
    this.ctx = null;
  }
}

window.Minimap = new Minimap();
