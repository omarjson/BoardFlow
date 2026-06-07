// ============================================
// Undo/Redo History System
// ============================================

class History {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = 50;
    this.onUpdate = null;
  }

  push(state) {
    this.undoStack.push(JSON.stringify(state));
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.onUpdate?.(this.canUndo(), this.canRedo());
  }

  undo(currentState) {
    if (this.undoStack.length === 0) return null;
    this.redoStack.push(JSON.stringify(currentState));
    const prev = JSON.parse(this.undoStack.pop());
    this.onUpdate?.(this.canUndo(), this.canRedo());
    return prev;
  }

  redo(currentState) {
    if (this.redoStack.length === 0) return null;
    this.undoStack.push(JSON.stringify(currentState));
    const next = JSON.parse(this.redoStack.pop());
    this.onUpdate?.(this.canUndo(), this.canRedo());
    return next;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.onUpdate?.(false, false);
  }
}

window.BoardHistory = new History();
