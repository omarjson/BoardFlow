// ============================================
// Sketch / Drawing Tool
// ============================================

class SketchTool {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.currentPath = [];
    this.paths = [];
    this.tool = 'pen';
    this.color = '#1d1d1f';
    this.lineWidth = 3;
    this.opacity = 1;
    this.itemId = null;
    this.onSave = null;
    this.tools = {
      pen: { compositeOp: 'source-over', cursor: 'crosshair' },
      marker: { compositeOp: 'source-over', cursor: 'crosshair' },
      eraser: { compositeOp: 'destination-out', cursor: 'crosshair' }
    };
  }

  init(containerEl, item) {
    this.itemId = item.id;
    this.paths = item.sketch_data?.paths || [];
    this.color = item.sketch_data?.color || '#1d1d1f';
    this.lineWidth = item.sketch_data?.lineWidth || 3;

    const wrapper = document.createElement('div');
    wrapper.className = 'sketch-wrapper';
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: var(--radius-md);
    `;

    wrapper.innerHTML = `
      <div class="sketch-toolbar">
        <button class="sketch-tool-btn active" data-tool="pen" title="Pen">✏️</button>
        <button class="sketch-tool-btn" data-tool="marker" title="Marker">🖊</button>
        <button class="sketch-tool-btn" data-tool="eraser" title="Eraser">🧹</button>
        <div class="sketch-divider"></div>
        <input type="color" class="sketch-color" value="${this.color}" title="Color">
        <div class="sketch-divider"></div>
        <button class="sketch-size-btn" data-size="1" title="Thin">—</button>
        <button class="sketch-size-btn active" data-size="3" title="Medium">━</button>
        <button class="sketch-size-btn" data-size="6" title="Thick">▬</button>
        <div class="sketch-divider"></div>
        <button class="sketch-undo-btn" title="Undo (Ctrl+Z)">↶</button>
        <button class="sketch-redo-btn" title="Redo (Ctrl+Y)">↷</button>
        <button class="sketch-clear-btn" title="Clear All">🗑</button>
      </div>
      <canvas class="sketch-canvas"></canvas>
    `;

    containerEl.appendChild(wrapper);

    this.canvas = wrapper.querySelector('.sketch-canvas');
    this.ctx = this.canvas.getContext('2d');

    this._resize();
    this._bindEvents(wrapper);
    this._redraw();

    // Resize observer
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(wrapper);
  }

  _resize() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const parent = this.canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const toolbarHeight = 40;

    this.canvas.width = rect.width;
    this.canvas.height = rect.height - toolbarHeight;
    this.canvas.style.marginTop = toolbarHeight + 'px';
    this._redraw();
  }

  _bindEvents(wrapper) {
    // Tool selection
    wrapper.querySelectorAll('.sketch-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        wrapper.querySelectorAll('.sketch-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.tool = btn.dataset.tool;
      });
    });

    // Color
    wrapper.querySelector('.sketch-color')?.addEventListener('input', (e) => {
      this.color = e.target.value;
    });

    // Size
    wrapper.querySelectorAll('.sketch-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        wrapper.querySelectorAll('.sketch-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.lineWidth = parseInt(btn.dataset.size);
      });
    });

    // Undo/Redo
    wrapper.querySelector('.sketch-undo-btn')?.addEventListener('click', () => this.undo());
    wrapper.querySelector('.sketch-redo-btn')?.addEventListener('click', () => this.redo());

    // Clear
    wrapper.querySelector('.sketch-clear-btn')?.addEventListener('click', () => {
      if (typeof pushHistoryState === 'function') pushHistoryState();
      this.paths = [];
      this._redraw();
      this._save();
    });

    // Drawing events
    this.canvas.addEventListener('mousedown', (e) => this._startDraw(e));
    this.canvas.addEventListener('mousemove', (e) => this._draw(e));
    this.canvas.addEventListener('mouseup', () => this._endDraw());
    this.canvas.addEventListener('mouseleave', () => this._endDraw());

    // Touch drawing
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._startDraw(e.touches[0]);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._draw(e.touches[0]);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.stopPropagation();
      this._endDraw();
    });
  }

  _getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  _startDraw(e) {
    this.isDrawing = true;
    const pos = this._getPos(e);
    this.currentPath = [{
      x: pos.x,
      y: pos.y,
      tool: this.tool,
      color: this.tool === 'eraser' ? null : this.color,
      lineWidth: this.tool === 'eraser' ? this.lineWidth * 3 : this.lineWidth,
      opacity: this.tool === 'marker' ? 0.4 : 1
    }];
  }

  _draw(e) {
    if (!this.isDrawing) return;
    const pos = this._getPos(e);
    this.currentPath.push({
      x: pos.x,
      y: pos.y,
      tool: this.tool,
      color: this.tool === 'eraser' ? null : this.color,
      lineWidth: this.tool === 'eraser' ? this.lineWidth * 3 : this.lineWidth,
      opacity: this.tool === 'marker' ? 0.4 : 1
    });
    this._redraw();
  }

  _endDraw() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (this.currentPath.length > 1) {
      this.paths.push([...this.currentPath]);
      this.currentPath = [];
      this._save();
    } else {
      this.currentPath = [];
    }
  }

  _redraw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all saved paths
    this.paths.forEach(path => this._drawPath(ctx, path));

    // Draw current path
    if (this.currentPath.length > 0) {
      this._drawPath(ctx, this.currentPath);
    }
  }

  _drawPath(ctx, path) {
    if (path.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];

      ctx.globalAlpha = curr.opacity || 1;
      ctx.strokeStyle = curr.tool === 'eraser' ? '#ffffff' : curr.color;
      ctx.lineWidth = curr.lineWidth;
      ctx.globalCompositeOperation = curr.tool === 'eraser' ? 'destination-out' : 'source-over';

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  undo() {
    if (this.paths.length === 0) return;
    this.paths.pop();
    this._redraw();
    this._save();
  }

  redo() {
    // Redo not fully implemented (would need separate redo stack)
  }

  _save() {
    if (this.onSave) {
      ItemManager.suppressRender = true;
      this.onSave(this.itemId, {
        paths: this.paths,
        color: this.color,
        lineWidth: this.lineWidth
      });
      ItemManager.suppressRender = false;
    }
  }

  getSVG() {
    // Export as SVG for thumbnails
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.canvas.width}" height="${this.canvas.height}">`;
    this.paths.forEach(path => {
      if (path.length < 2) return;
      const p = path[0];
      if (p.tool === 'eraser') return; // Skip eraser strokes
      let d = `M ${path[0].x} ${path[0].y}`;
      for (let i = 1; i < path.length; i++) {
        d += ` L ${path[i].x} ${path[i].y}`;
      }
      svg += `<path d="${d}" stroke="${p.color || '#000'}" stroke-width="${p.lineWidth}" fill="none" stroke-linecap="round" opacity="${p.opacity || 1}"/>`;
    });
    svg += '</svg>';
    return svg;
  }

  destroy() {
    this._resizeObserver?.disconnect();
    this.canvas = null;
    this.ctx = null;
  }
}

window.SketchTool = SketchTool;
