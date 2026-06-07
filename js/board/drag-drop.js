// ============================================
// Drag & Drop System
// ============================================

class DragDrop {
  constructor() {
    this.isDragging = false;
    this.dragElement = null;
    this.dragItem = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.onDragEnd = null;
  }

  init() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      const itemEl = e.target.closest('.board-item');
      if (!itemEl) return;
      if (e.target.closest('.item-resize-handle') || e.target.closest('.item-rotate-handle')) return;

      e.stopPropagation();
      this.startDrag(itemEl, e);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.onDrag(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.endDrag();
      }
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      const itemEl = e.target.closest('.board-item');
      if (!itemEl || e.touches.length !== 1) return;
      e.stopPropagation();
      this.startDrag(itemEl, e);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      e.preventDefault();
      this.onDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    window.addEventListener('touchend', () => {
      if (this.isDragging) this.endDrag();
    });
  }

  startDrag(itemEl, e) {
    this.isDragging = true;
    this.dragElement = itemEl;
    this.dragItem = ItemManager.getItem(itemEl.dataset.id);

    if (!this.dragItem) return;

    // Push history before drag starts
    if (typeof pushHistoryState === 'function') pushHistoryState();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Select item
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
    document.getElementById('canvas').style.cursor = 'grabbing';
  }

  onDrag(clientX, clientY) {
    if (!this.dragElement || !this.dragItem) return;

    const canvasPos = Canvas.screenToCanvas(clientX, clientY);
    let newX = canvasPos.x - this.offsetX;
    let newY = canvasPos.y - this.offsetY;

    // Snap to grid if enabled
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
    document.getElementById('canvas').style.cursor = 'grab';

    ItemManager.updateItem(this.dragItem.id, {
      position_x: this.dragItem.position_x,
      position_y: this.dragItem.position_y
    });

    this.onDragEnd?.(this.dragItem);
    this.isDragging = false;
    this.dragElement = null;
    this.dragItem = null;
  }
}

window.DragDrop = new DragDrop();
