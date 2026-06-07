// ============================================
// Multi-Select System
// ============================================

class Selection {
  constructor() {
    this.isSelecting = false;
    this.startX = 0;
    this.startY = 0;
    this.selectionBox = null;
    this.onSelectionComplete = null;
  }

  init() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      if (DragDrop.isDragging) return;
      if (e.target !== canvas && !e.target.classList.contains('canvas-grid')) return;
      if (e.button !== 0) return;

      // Deselect all if not holding shift
      if (!e.shiftKey) {
        ItemManager.deselectAll();
      }

      this.startSelection(e.clientX, e.clientY);
    });
  }

  startSelection(clientX, clientY) {
    this.isSelecting = true;
    const canvasPos = Canvas.screenToCanvas(clientX, clientY);
    this.startX = canvasPos.x;
    this.startY = canvasPos.y;

    // Create selection box
    this.selectionBox = document.createElement('div');
    this.selectionBox.className = 'selection-box';
    this.selectionBox.style.cssText = `
      position: absolute;
      border: 2px dashed var(--primary);
      background: color-mix(in srgb, var(--primary) 10%, transparent);
      pointer-events: none;
      z-index: 10000;
    `;
    Canvas.container.appendChild(this.selectionBox);

    window.addEventListener('mousemove', this._onMouseMove = (e) => {
      this.onDrag(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', this._onMouseUp = () => {
      this.endSelection();
    });
  }

  onDrag(clientX, clientY) {
    if (!this.selectionBox) return;

    const canvasPos = Canvas.screenToCanvas(clientX, clientY);
    const x = Math.min(this.startX, canvasPos.x);
    const y = Math.min(this.startY, canvasPos.y);
    const w = Math.abs(canvasPos.x - this.startX);
    const h = Math.abs(canvasPos.y - this.startY);

    this.selectionBox.style.left = `${x}px`;
    this.selectionBox.style.top = `${y}px`;
    this.selectionBox.style.width = `${w}px`;
    this.selectionBox.style.height = `${h}px`;
  }

  endSelection() {
    if (!this.selectionBox) {
      this.isSelecting = false;
      return;
    }

    const box = this.selectionBox.getBoundingClientRect();
    if (box.width > 5 && box.height > 5) {
      // Select items within the box
      const canvasRect = Canvas.el.getBoundingClientRect();
      const selectionRect = {
        left: (box.left - canvasRect.left - Canvas.panX) / Canvas.zoom,
        top: (box.top - canvasRect.top - Canvas.panY) / Canvas.zoom,
        right: (box.right - canvasRect.left - Canvas.panX) / Canvas.zoom,
        bottom: (box.bottom - canvasRect.top - Canvas.panY) / Canvas.zoom
      };

      ItemManager.items.forEach(item => {
        const itemRight = item.position_x + item.width;
        const itemBottom = item.position_y + item.height;

        if (
          item.position_x < selectionRect.right &&
          itemRight > selectionRect.left &&
          item.position_y < selectionRect.bottom &&
          itemBottom > selectionRect.top
        ) {
          ItemManager.selectItem(item.id, true);
        }
      });
    }

    this.selectionBox.remove();
    this.selectionBox = null;
    this.isSelecting = false;

    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
  }
}

window.Selection = new Selection();
