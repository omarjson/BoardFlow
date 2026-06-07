// ============================================
// Item Manager — Create, Edit, Delete Board Items
// ============================================

class ItemManager {
  constructor() {
    this.items = [];
    this.boardId = null;
    this.selectedItems = new Set();
    this.onItemsChange = null;
    this.onSelectionChange = null;
    this.suppressRender = false;
  }

  async loadItems(boardId) {
    this.boardId = boardId;
    this.items = [];
    this.selectedItems.clear();

    if (Auth.supabase) {
      const { data, error } = await Auth.supabase
        .from('items')
        .select('*')
        .eq('board_id', boardId);
      if (error) {
        console.error('Failed to load items:', error.message);
      } else if (data) {
        this.items = data;
      }
    } else {
      const stored = localStorage.getItem(`boardflow_items_${boardId}`);
      if (stored) {
        try { this.items = JSON.parse(stored); } catch { this.items = []; }
      }
    }

    this.onItemsChange?.(this.items);
    return this.items;
  }

  async createItem(type, options = {}) {
    const item = {
      id: Utils.generateId('item'),
      board_id: this.boardId,
      type,
      position_x: options.x ?? 0,
      position_y: options.y ?? 0,
      width: options.width ?? 200,
      height: options.height ?? 200,
      rotation: options.rotation ?? 0,
      z_index: this.items.length,
      color: options.color || null,
      title: options.title || '',
      content: options.content || '',
      url: options.url || null,
      file_url: options.file_url || null,
      file_provider: options.file_provider || null,
      file_id: options.file_id || null,
      sketch_data: options.sketch_data || null,
      metadata: options.metadata || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (Auth.supabase) {
      const { data, error } = await Auth.supabase
        .from('items')
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      item.id = data.id;
    }

    this.items.push(item);
    this._saveLocal();
    this.onItemsChange?.(this.items);
    return item;
  }

  async updateItem(id, updates) {
    if (Auth.supabase) {
      const { error } = await Auth.supabase
        .from('items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    }

    const item = this.items.find(i => i.id === id);
    if (item) {
      Object.assign(item, updates, { updated_at: new Date().toISOString() });
      this._saveLocal();
      if (!this.suppressRender) {
        this.onItemsChange?.(this.items);
      }
    }
    return item;
  }

  async deleteItem(id) {
    if (Auth.supabase) {
      const { error } = await Auth.supabase
        .from('items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }

    window.Connections?.removeConnectionsForItem(id);

    this.items = this.items.filter(i => i.id !== id);
    this.selectedItems.delete(id);
    this._saveLocal();
    this.onItemsChange?.(this.items);
    this.onSelectionChange?.(this.selectedItems);
  }

  async deleteSelected() {
    const ids = [...this.selectedItems];
    if (ids.length === 0) return;

    // Delete from Supabase in parallel
    if (Auth.supabase) {
      const { error } = await Auth.supabase.from('items').delete().in('id', ids);
      if (error) throw error;
    }

    ids.forEach(id => window.Connections?.removeConnectionsForItem(id));

    // Remove from local array
    this.items = this.items.filter(i => !ids.includes(i.id));
    ids.forEach(id => this.selectedItems.delete(id));
    this._saveLocal();

    // Fire callbacks once
    this.onItemsChange?.(this.items);
    this.onSelectionChange?.(this.selectedItems);
  }

  getItem(id) {
    return this.items.find(i => i.id === id) || null;
  }

  getItems() {
    return this.items;
  }

  selectItem(id, addToSelection = false) {
    if (!addToSelection) {
      this.selectedItems.clear();
    }
    this.selectedItems.add(id);
    this.onSelectionChange?.(this.selectedItems);
  }

  deselectItem(id) {
    this.selectedItems.delete(id);
    this.onSelectionChange?.(this.selectedItems);
  }

  deselectAll() {
    this.selectedItems.clear();
    this.onSelectionChange?.(this.selectedItems);
  }

  getSelectedItems() {
    return this.items.filter(i => this.selectedItems.has(i.id));
  }

  bringToFront(id) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      const maxZ = Math.max(...this.items.map(i => i.z_index), 0);
      item.z_index = maxZ + 1;
      this.updateItem(id, { z_index: item.z_index });
    }
  }

  sendToBack(id) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      const minZ = Math.min(...this.items.map(i => i.z_index), 0);
      item.z_index = minZ - 1;
      this.updateItem(id, { z_index: item.z_index });
    }
  }

  _saveLocal() {
    if (!this.boardId || Auth.supabase) return;
    try {
      localStorage.setItem(`boardflow_items_${this.boardId}`, JSON.stringify(this.items));
    } catch {
      // Storage full
    }
  }
}

window.ItemManager = new ItemManager();
