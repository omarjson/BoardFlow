// ============================================
// Sketch / Drawing Tool — Premium Edition
// ============================================

class _SketchTool {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.currentPath = [];
    this.paths = [];
    this.undoStack = [];
    this.redoStack = [];
    this.tool = 'pen';
    this.color = '#1d1d1f';
    this.fillColor = 'transparent';
    this.lineWidth = 3;
    this.opacity = 1;
    this.itemId = null;
    this.onSave = null;
    this._shapeStart = null;
    this._previewPath = null;
    this._textMode = false;
  }

  static TOOLS = {
    pen:        { icon: 'pen', label: 'Pen' },
    highlighter:{ icon: 'highlighter', label: 'Highlighter' },
    line:       { icon: 'line', label: 'Line' },
    arrow:      { icon: 'arrow', label: 'Arrow' },
    rect:       { icon: 'rect', label: 'Rectangle' },
    circle:     { icon: 'circle', label: 'Circle' },
    text:       { icon: 'text', label: 'Text' },
    fill:       { icon: 'fill', label: 'Fill' },
    eraser:     { icon: 'eraser', label: 'Eraser' },
  };

  static COLORS = [
    '#1d1d1f', '#ffffff', '#ff3b30', '#ff9500', '#ffcc00',
    '#34c759', '#007aff', '#5856d6', '#af52de', '#ff2d55',
    '#a2845e', '#8e8e93'
  ];

  static SIZES = [1, 3, 6, 12];

  init(containerEl, item) {
    this.itemId = item.id;
    this.paths = item.sketch_data?.paths || [];
    this.color = item.sketch_data?.color || '#1d1d1f';
    this.lineWidth = item.sketch_data?.lineWidth || 3;
    this.undoStack = [];
    this.redoStack = [];

    const wrapper = document.createElement('div');
    wrapper.className = 'sketch-wrapper';

    wrapper.innerHTML = this._buildToolbarHTML();

    containerEl.appendChild(wrapper);

    this.canvas = wrapper.querySelector('.sketch-canvas');
    this.ctx = this.canvas.getContext('2d');

    this._resize();
    this._bindEvents(wrapper);
    this._redraw();

    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(wrapper);
  }

  _buildToolbarHTML() {
    const toolIcons = {
      pen: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`,
      highlighter: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 11l-6 6v3h9l3-3"/><path d="M22 12l-4.6 4.6a2 2 0 01-2.8 0l-5.2-5.2a2 2 0 010-2.8L14 4"/></svg>`,
      line: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="19" x2="19" y2="5"/></svg>`,
      arrow: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
      rect: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
      circle: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`,
      text: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
      fill: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11l-8-8-8.6 8.6a2 2 0 000 2.8l5.2 5.2a2 2 0 002.8 0L19 11z"/><path d="M5 21a2 2 0 002-2 2 2 0 00-2-2 2 2 0 00-2 2 2 2 0 002 2z"/></svg>`,
      eraser: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16l9-9 8 8-4 4"/><path d="M6.5 13.5l5-5"/></svg>`,
    };

    const colorSwatches = _SketchTool.COLORS.map(c =>
      `<button class="sketch-color-swatch${c === this.color ? ' active' : ''}" data-color="${c}" style="background:${c};${c === '#ffffff' ? 'border-color:var(--hairline);' : ''}" title="${c}"></button>`
    ).join('');

    const sizeBtns = _SketchTool.SIZES.map(s =>
      `<button class="sketch-size-btn${s === this.lineWidth ? ' active' : ''}" data-size="${s}" title="${s}px">
        <span style="width:${Math.min(s * 2, 16)}px;height:${Math.min(s * 2, 16)}px;background:var(--ink);border-radius:50%;display:block;"></span>
      </button>`
    ).join('');

    const toolBtns = Object.entries(_SketchTool.TOOLS).map(([key, t]) =>
      `<button class="sketch-tool-btn${key === this.tool ? ' active' : ''}" data-tool="${key}" title="${t.label}">${toolIcons[key]}</button>`
    ).join('');

    return `
      <div class="sketch-toolbar">
        <div class="sketch-toolbar-group">
          ${toolBtns}
        </div>
        <div class="sketch-divider"></div>
        <div class="sketch-toolbar-group sketch-colors">
          ${colorSwatches}
          <input type="color" class="sketch-color-picker" value="${this.color}" title="Custom color">
        </div>
        <div class="sketch-divider"></div>
        <div class="sketch-toolbar-group sketch-sizes">
          ${sizeBtns}
        </div>
        <div class="sketch-divider"></div>
        <div class="sketch-toolbar-group">
          <button class="sketch-action-btn" data-action="undo" title="Undo (Ctrl+Z)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          </button>
          <button class="sketch-action-btn" data-action="redo" title="Redo (Ctrl+Y)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.13-9.36L23 10"/></svg>
          </button>
          <button class="sketch-action-btn sketch-clear-btn" data-action="clear" title="Clear All">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 0V4a1 1 0 011-1h2a1 1 0 011 1v2"/></svg>
          </button>
        </div>
      </div>
      <canvas class="sketch-canvas"></canvas>
    `;
  }

  _resize() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const parent = this.canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const toolbarHeight = parent.querySelector('.sketch-toolbar')?.offsetHeight || 40;
    const dpr = window.devicePixelRatio || 1;
    // preserve drawing at old DPR before resize
    const prevData = this.ctx ? this.canvas.toDataURL() : null;
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round((rect.height - toolbarHeight) * dpr));
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = (rect.height - toolbarHeight) + 'px';
    this.canvas.style.marginTop = toolbarHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._logicalWidth = rect.width;
    this._logicalHeight = rect.height - toolbarHeight;
    if (prevData) {
      const img = new Image();
      img.onload = () => { this.ctx.drawImage(img, 0, 0, this._logicalWidth, this._logicalHeight); };
      img.src = prevData;
    } else {
      this._redraw();
    }
  }

  _bindEvents(wrapper) {
    wrapper.querySelectorAll('.sketch-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        wrapper.querySelectorAll('.sketch-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.tool = btn.dataset.tool;
        this.canvas.style.cursor = this.tool === 'eraser' ? 'cell' :
                                   this.tool === 'text' ? 'text' :
                                   this.tool === 'fill' ? 'crosshair' : 'crosshair';
      });
    });

    wrapper.querySelectorAll('.sketch-color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        wrapper.querySelectorAll('.sketch-color-swatch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.color = btn.dataset.color;
      });
    });

    wrapper.querySelector('.sketch-color-picker')?.addEventListener('input', (e) => {
      this.color = e.target.value;
      wrapper.querySelectorAll('.sketch-color-swatch').forEach(b => b.classList.remove('active'));
    });

    wrapper.querySelectorAll('.sketch-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        wrapper.querySelectorAll('.sketch-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.lineWidth = parseInt(btn.dataset.size);
      });
    });

    wrapper.querySelectorAll('.sketch-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'undo') this.undo();
        else if (action === 'redo') this.redo();
        else if (action === 'clear') this.clear();
      });
    });

    this._onPointerDown = (e) => this._startDraw(e);
    this._onPointerMove = (e) => this._draw(e);
    this._onPointerUp = (e) => this._endDraw(e);

    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerup', this._onPointerUp);
    this.canvas.addEventListener('pointerleave', this._onPointerUp);
    this.canvas.style.touchAction = 'none';
  }

  _getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5
    };
  }

  _startDraw(e) {
    const pos = this._getPos(e);

    if (this.tool === 'text') {
      this._addText(pos);
      return;
    }

    if (this.tool === 'fill') {
      this._fillAt(pos);
      return;
    }

    this.isDrawing = true;
    this._pushUndo();

    if (['line', 'arrow', 'rect', 'circle'].includes(this.tool)) {
      this._shapeStart = pos;
      this._previewPath = null;
    } else {
      this.currentPath = [{
        x: pos.x, y: pos.y,
        tool: this.tool,
        color: this.tool === 'eraser' ? null : this.color,
        lineWidth: this.tool === 'eraser' ? this.lineWidth * 4 :
                   this.tool === 'highlighter' ? this.lineWidth * 3 : this.lineWidth,
        opacity: this.tool === 'highlighter' ? 0.35 : 1,
        pressure: pos.pressure
      }];
    }
  }

  _draw(e) {
    if (!this.isDrawing) return;
    const pos = this._getPos(e);

    if (['line', 'arrow', 'rect', 'circle'].includes(this.tool)) {
      this._previewPath = this._makeShape(this._shapeStart, pos);
      this._redraw();
      this._drawPath(this.ctx, this._previewPath, true);
    } else {
      this.currentPath.push({
        x: pos.x, y: pos.y,
        tool: this.tool,
        color: this.tool === 'eraser' ? null : this.color,
        lineWidth: this.tool === 'eraser' ? this.lineWidth * 4 :
                   this.tool === 'highlighter' ? this.lineWidth * 3 : this.lineWidth,
        opacity: this.tool === 'highlighter' ? 0.35 : 1,
        pressure: pos.pressure
      });
      this._redraw();
    }
  }

  _endDraw(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (['line', 'arrow', 'rect', 'circle'].includes(this.tool) && this._shapeStart && this._previewPath) {
      this.paths.push(this._previewPath);
      this._previewPath = null;
      this._shapeStart = null;
      this._save();
      this._redraw();
    } else if (this.currentPath.length > 1) {
      this.paths.push([...this.currentPath]);
      this.currentPath = [];
      this._save();
      this._redraw();
    } else {
      this.currentPath = [];
    }
  }

  _makeShape(start, end) {
    const base = {
      tool: this.tool,
      color: this.color,
      fillColor: this.fillColor,
      lineWidth: this.lineWidth,
      opacity: 1
    };

    if (this.tool === 'line') {
      return { ...base, points: [start, end] };
    }

    if (this.tool === 'arrow') {
      return { ...base, points: [start, end], isArrow: true };
    }

    if (this.tool === 'rect') {
      return {
        ...base,
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        w: Math.abs(end.x - start.x),
        h: Math.abs(end.y - start.y)
      };
    }

    if (this.tool === 'circle') {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      return { ...base, cx, cy, rx, ry };
    }

    return base;
  }

  _addText(pos) {
    const input = document.createElement('textarea');
    input.className = 'sketch-text-input';
    input.placeholder = 'Type here...';
    input.style.cssText = `
      position: absolute;
      left: ${pos.x}px;
      top: ${pos.y + (this.canvas.parentElement.querySelector('.sketch-toolbar')?.offsetHeight || 40)}px;
      min-width: 120px;
      max-width: 300px;
      min-height: 32px;
      font-size: ${Math.max(this.lineWidth * 5, 16)}px;
      color: ${this.color};
      background: transparent;
      border: 1px dashed var(--primary);
      border-radius: 4px;
      padding: 4px 6px;
      outline: none;
      resize: both;
      z-index: 20;
      font-family: var(--font-sans);
      line-height: 1.3;
    `;

    this.canvas.parentElement.appendChild(input);
    input.focus();

    const commit = () => {
      const text = input.value.trim();
      if (text) {
        this._pushUndo();
        this.paths.push({
          tool: 'text',
          x: pos.x,
          y: pos.y,
          text,
          color: this.color,
          fontSize: Math.max(this.lineWidth * 5, 16),
          opacity: 1
        });
        this._save();
        this._redraw();
      }
      input.remove();
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { input.value = ''; input.blur(); }
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); input.blur(); }
    });
  }

  _fillAt(pos) {
    const { width, height } = this.canvas;
    const dpr = window.devicePixelRatio || 1;
    const px = Math.floor(pos.x * dpr);
    const py = Math.floor(pos.y * dpr);

    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const targetIdx = (py * width + px) * 4;
    const targetR = data[targetIdx];
    const targetG = data[targetIdx + 1];
    const targetB = data[targetIdx + 2];
    const targetA = data[targetIdx + 3];

    const fill = this._hexToRgb(this.color);
    if (!fill) return;

    if (targetR === fill.r && targetG === fill.g && targetB === fill.b && targetA === 255) return;

    const stack = [[px, py]];
    const visited = new Set();
    const tolerance = 30;

    const match = (idx) => {
      return Math.abs(data[idx] - targetR) <= tolerance &&
             Math.abs(data[idx + 1] - targetG) <= tolerance &&
             Math.abs(data[idx + 2] - targetB) <= tolerance &&
             Math.abs(data[idx + 3] - targetA) <= tolerance;
    };

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = y * width + x;
      if (visited.has(key)) continue;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const idx = key * 4;
      if (!match(idx)) continue;

      visited.add(key);
      data[idx] = fill.r;
      data[idx + 1] = fill.g;
      data[idx + 2] = fill.b;
      data[idx + 3] = 255;

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    this._pushUndo();
    // compress fill to dataURL to avoid 8MB buffer in history/JSON
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = width; tmpCanvas.height = height;
    tmpCanvas.getContext('2d').putImageData(imageData, 0, 0);
    const fillDataUrl = tmpCanvas.toDataURL('image/png');
    this.paths.push({
      tool: 'fill',
      fillDataUrl,
      width, height
    });
    this.ctx.putImageData(imageData, 0, 0);
    this._save();
  }

  _hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  _redraw() {
    if (!this.ctx) return;
    const dpr = window.devicePixelRatio || 1;
    this.ctx.save();
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, this._logicalWidth, this._logicalHeight);

    this.paths.forEach(p => this._drawPath(this.ctx, p, false));

    if (this.currentPath.length > 0) {
      this._drawPath(this.ctx, { tool: 'stroke', points: this.currentPath, ...this.currentPath[0] }, false);
    }

    this.ctx.restore();
  }

  _drawPath(ctx, path, isPreview) {
    if (path.tool === 'fill') {
      if (path.fillDataUrl) {
        // draw cached fill image
        if (!path._fillImg) {
          path._fillImg = new Image();
          path._fillImg.src = path.fillDataUrl;
        }
        if (path._fillImg.complete) ctx.drawImage(path._fillImg, 0, 0, path.width / (window.devicePixelRatio||1), path.height / (window.devicePixelRatio||1));
        return;
      }
      if (path.imageData) {
        const imgData = new ImageData(new Uint8ClampedArray(path.imageData), path.width, path.height);
        ctx.putImageData(imgData, 0, 0);
      }
      return;
    }

    if (path.tool === 'text') {
      ctx.save();
      ctx.globalAlpha = path.opacity || 1;
      ctx.fillStyle = path.color;
      ctx.font = `${path.fontSize || 16}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-sans') || 'sans-serif'}`;
      ctx.textBaseline = 'top';
      const lines = path.text.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, path.x, path.y + i * (path.fontSize || 16) * 1.3);
      });
      ctx.restore();
      return;
    }

    if (['line', 'arrow'].includes(path.tool) && path.points) {
      ctx.save();
      ctx.globalAlpha = path.opacity || 1;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      ctx.lineTo(path.points[1].x, path.points[1].y);
      ctx.stroke();

      if (path.isArrow) {
        const [start, end] = path.points;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = Math.max(path.lineWidth * 4, 12);
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLen * Math.cos(angle - 0.4), end.y - headLen * Math.sin(angle - 0.4));
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLen * Math.cos(angle + 0.4), end.y - headLen * Math.sin(angle + 0.4));
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (path.tool === 'rect') {
      ctx.save();
      ctx.globalAlpha = path.opacity || 1;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeRect(path.x, path.y, path.w, path.h);
      ctx.restore();
      return;
    }

    if (path.tool === 'circle') {
      ctx.save();
      ctx.globalAlpha = path.opacity || 1;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.lineWidth;
      ctx.beginPath();
      ctx.ellipse(path.cx, path.cy, Math.abs(path.rx), Math.abs(path.ry), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const points = path.points || path;
    if (!Array.isArray(points) || points.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      ctx.globalAlpha = curr.opacity || 1;
      ctx.strokeStyle = curr.tool === 'eraser' ? '#ffffff' : curr.color;
      ctx.globalCompositeOperation = curr.tool === 'eraser' ? 'destination-out' : 'source-over';

      const baseWidth = curr.lineWidth || 3;
      const pressure = curr.pressure || 0.5;
      const variableWidth = baseWidth * (0.5 + pressure);

      ctx.lineWidth = variableWidth;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);

      if (i < points.length - 1) {
        const next = points[i + 1];
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      } else {
        ctx.lineTo(curr.x, curr.y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  _clonePaths(p) {
    try { return structuredClone(p); } catch { return JSON.parse(JSON.stringify(p)); }
  }
  _pushUndo() {
    this.undoStack.push(this._clonePaths(this.paths));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(this._clonePaths(this.paths));
    this.paths = this.undoStack.pop();
    this._redraw();
    this._save();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(this._clonePaths(this.paths));
    this.paths = this.redoStack.pop();
    this._redraw();
    this._save();
  }

  clear() {
    if (this.paths.length === 0) return;
    this._pushUndo();
    this.paths = [];
    this._redraw();
    this._save();
  }

  _save() {
    if (this.onSave) {
      this.onSave(this.itemId, {
        paths: this.paths,
        color: this.color,
        lineWidth: this.lineWidth
      });
    }
  }

  getSVG() {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this._logicalWidth || 400}" height="${this._logicalHeight || 300}">`;
    this.paths.forEach(path => {
      if (path.tool === 'text') {
        svg += `<text x="${path.x}" y="${path.y + 16}" fill="${path.color}" font-size="${path.fontSize || 16}" font-family="sans-serif">${this._escSvg(path.text)}</text>`;
      } else if (path.tool === 'rect') {
        svg += `<rect x="${path.x}" y="${path.y}" width="${path.w}" height="${path.h}" stroke="${path.color}" stroke-width="${path.lineWidth}" fill="none"/>`;
      } else if (path.tool === 'circle') {
        svg += `<ellipse cx="${path.cx}" cy="${path.cy}" rx="${Math.abs(path.rx)}" ry="${Math.abs(path.ry)}" stroke="${path.color}" stroke-width="${path.lineWidth}" fill="none"/>`;
      } else if (path.tool === 'fill' || path.tool === 'eraser') {
        // Skip pixel-based paths
      } else if (path.points) {
        const p = path.points;
        if (p.length >= 2) {
          let d = `M ${p[0].x} ${p[0].y}`;
          for (let i = 1; i < p.length; i++) d += ` L ${p[i].x} ${p[i].y}`;
          svg += `<path d="${d}" stroke="${p[0].color || '#000'}" stroke-width="${p[0].lineWidth || 3}" fill="none" stroke-linecap="round" opacity="${p[0].opacity || 1}"/>`;
        }
      }
    });
    svg += '</svg>';
    return svg;
  }

  _escSvg(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  destroy() {
    this._resizeObserver?.disconnect();
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this._onPointerDown);
      this.canvas.removeEventListener('pointermove', this._onPointerMove);
      this.canvas.removeEventListener('pointerup', this._onPointerUp);
      this.canvas.removeEventListener('pointerleave', this._onPointerUp);
    }
    this.canvas = null;
    this.ctx = null;
  }
}

window.SketchTool = _SketchTool;
