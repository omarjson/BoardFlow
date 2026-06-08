// ============================================
// Drag & Drop System
// ============================================

class _DragDrop {
  constructor() {
    this.isDragging = false;
    this.dragElement = null;
    this.dragItem = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.onDragEnd = null;
    this._canvasEl = null;
    this._onCanvasMouseDown = null;
    this._onWindowMouseMove = null;
    this._onWindowMouseUp = null;
    this._onCanvasTouchStart = null;
    this._onWindowTouchMove = null;
    this._onWindowTouchEnd = null;
  }

  init() {
    this._canvasEl = document.getElementById('canvas');
    if (!this._canvasEl) return;

    this._onCanvasMouseDown = (e) => {
      const itemEl = e.target.closest('.board-item');
      if (!itemEl) return;
      if (e.target.closest('.item-resize-handle') || e.target.closest('.item-rotate-handle')) return;

      e.stopPropagation();
      this.startDrag(itemEl, e);
    };

    this._onWindowMouseMove = (e) => {
      if (!this.isDragging) return;
      this.onDrag(e.clientX, e.clientY);
    };

    this._onWindowMouseUp = () => {
      if (this.isDragging) {
        this.endDrag();
      }
    };

    this._onCanvasTouchStart = (e) => {
      const itemEl = e.target.closest('.board-item');
      if (!itemEl || e.touches.length !== 1) return;
      e.stopPropagation();
      this.startDrag(itemEl, e);
    };

    this._onWindowTouchMove = (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      e.preventDefault();
      this.onDrag(e.touches[0].clientX, e.touches[0].clientY);
    };

    this._onWindowTouchEnd = () => {
      if (this.isDragging) this.endDrag();
    };

    this._canvasEl.addEventListener('mousedown', this._onCanvasMouseDown);
    window.addEventListener('mousemove', this._onWindowMouseMove);
    window.addEventListener('mouseup', this._onWindowMouseUp);
    this._canvasEl.addEventListener('touchstart', this._onCanvasTouchStart, { passive: false });
    window.addEventListener('touchmove', this._onWindowTouchMove, { passive: false });
    window.addEventListener('touchend', this._onWindowTouchEnd);
  }

  startDrag(itemEl, e) {
    this.isDragging = true;
    this.dragElement = itemEl;
    this.dragItem = ItemManager.getItem(itemEl.dataset.id);

    if (!this.dragItem) return;

    BoardHistory.push({
      items: ItemManager.items.map(i => ({ ...i })),
      selectedIds: [...ItemManager.selectedItems]
    });

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (e.shiftKey) {
      ItemManager.selectItem(this.dragItem.id, true);
    } else if (!ItemManager.selectedItems.has(this.dragItem.id)) {
      ItemManager.selectItem(this.dragItem.id);
    }

    const canvasPos = Canvas.screenToCanvas(clientX, clientY);
    this.offsetX = canvasPos.x - this.dragItem.position_x;
    this.offsetY = canvasPos.y - this.dragItem.position_y;

    itemEl.style.zIndex = 9999;
    itemEl.classList.add('dragging');
    this._canvasEl.style.cursor = 'grabbing';
  }

  onDrag(clientX, clientY) {
    if (!this.dragElement || !this.dragItem) return;

    const canvasPos = Canvas.screenToCanvas(clientX, clientY);
    let newX = canvasPos.x - this.offsetX;
    let newY = canvasPos.y - this.offsetY;

    if (Canvas.gridEnabled) {
      const gridSize = Canvas.gridSize;
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    this.dragElement.style.transform = `translate(${newX}px, ${newY}px) rotate(${this.dragItem.rotation}deg)`;
    this.dragItem.position_x = newX;
    this.dragItem.position_y = newY;
  }

  endDrag() {
    if (!this.dragElement || !this.dragItem) {
      this.isDragging = false;
      return;
    }

    this.dragElement.style.zIndex = '';
    this.dragElement.classList.remove('dragging');
    this._canvasEl.style.cursor = 'grab';

    ItemManager.updateItem(this.dragItem.id, {
      position_x: this.dragItem.position_x,
      position_y: this.dragItem.position_y
    });

    this.onDragEnd?.(this.dragItem);
    this.isDragging = false;
    this.dragElement = null;
    this.dragItem = null;
  }

  destroy() {
    if (this._canvasEl) {
      this._canvasEl.removeEventListener('mousedown', this._onCanvasMouseDown);
      this._canvasEl.removeEventListener('touchstart', this._onCanvasTouchStart);
    }
    window.removeEventListener('mousemove', this._onWindowMouseMove);
    window.removeEventListener('mouseup', this._onWindowMouseUp);
    window.removeEventListener('touchmove', this._onWindowTouchMove);
    window.removeEventListener('touchend', this._onWindowTouchEnd);
    this._canvasEl = null;
  }
}

try {
  Object.defineProperty(window, 'DragDrop', { value: new _DragDrop(), writable: false, configurable: true, enumerable: true });
} catch { window.DragDrop = new _DragDrop(); }
