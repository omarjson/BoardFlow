// ============================================
// Item Manager — Create, Edit, Delete Board Items
// ============================================

class _ItemManager {
  constructor() {
    this.items = [];
    this.boardId = null;
    this.selectedItems = new Set();
    this.onItemsChange = null;
    this.onSelectionChange = null;
    this.onSync = null;
    this.suppressRender = false;
    this.lastSyncedAt = null;
  }

  _markSynced() {
    this.lastSyncedAt = Date.now();
    this.onSync?.();
  }

  _pushHistory() {
    if (window.BoardHistory) {
      const deep = (obj) => {
        try { return structuredClone(obj); } catch { return JSON.parse(JSON.stringify(obj)); }
      };
      BoardHistory.push({
        items: this.items.map(i => deep(i)),
        selectedIds: [...this.selectedItems]
      });
    }
  }

  async loadItems(boardId) {
    this.boardId = boardId;
    this.items = [];
    this.selectedItems.clear();
    if (!BoardFlowAuth.supabase) throw new Error('Supabase not configured');
    const { data, error } = await BoardFlowAuth.supabase
      .from('items')
      .select('*')
      .eq('board_id', boardId)
      .order('z_index', { ascending: true });
    if (error) {
      console.error('Failed to load items:', error.message);
      Toast.show(I18n.__('error_occurred') + ': ' + error.message, 'error');
    } else if (data) {
      this.items = data;
    }
    this._markSynced();
    this.onItemsChange?.(this.items);
    this._subscribeRealtime(boardId);
    return this.items;
  }

  _realtimeChannel = null;
  _subscribeRealtime(boardId) {
    if (!BoardFlowAuth.supabase) return;
    if (this._realtimeChannel) {
      try { BoardFlowAuth.supabase.removeChannel(this._realtimeChannel); } catch {}
      this._realtimeChannel = null;
    }
    this._realtimeChannel = BoardFlowAuth.supabase
      .channel('items:' + boardId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `board_id=eq.${boardId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (!this.items.find(i => i.id === payload.new.id)) {
            this.items.push(payload.new);
            this.onItemsChange?.(this.items);
          }
        } else if (payload.eventType === 'UPDATE') {
          const idx = this.items.findIndex(i => i.id === payload.new.id);
          if (idx !== -1) {
            // last-write-wins but don't overwrite local unsaved edge: simple merge
            this.items[idx] = payload.new;
            this.onItemsChange?.(this.items);
          }
        } else if (payload.eventType === 'DELETE') {
          this.items = this.items.filter(i => i.id !== payload.old.id);
          this.selectedItems.delete(payload.old.id);
          window.Connections?.removeConnectionsForItem(payload.old.id);
          this.onItemsChange?.(this.items);
          this.onSelectionChange?.(this.selectedItems);
        }
      })
      .subscribe();
  }

  async createItem(type, options = {}) {
    if (!this.boardId) throw new Error('No board loaded');
    this._pushHistory();
    const row = {
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
      created_by: BoardFlowAuth.getUserId()
    };
    const { data, error } = await BoardFlowAuth.supabase
      .from('items')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    // avoid duplicate if realtime already inserted
    if (!this.items.find(i => i.id === data.id)) {
      this.items.push(data);
      this.onItemsChange?.(this.items);
    }
    this._markSynced();
    return data;
  }

  async updateItem(id, updates) {
    const safe = { ...updates, updated_at: new Date().toISOString() };
    const { error } = await BoardFlowAuth.supabase
      .from('items')
      .update(safe)
      .eq('id', id);
    if (error) throw error;
    const item = this.items.find(i => i.id === id);
    if (item) {
      Object.assign(item, safe);
      this._markSynced();
      if (!this.suppressRender) {
        this.onItemsChange?.(this.items);
      }
    }
    return item;
  }

  async deleteItem(id) {
    this._pushHistory();
    window.Connections?.removeConnectionsForItem(id);
    const { error } = await BoardFlowAuth.supabase
      .from('items')
      .delete()
      .eq('id', id);
    if (error) throw error;
    this.items = this.items.filter(i => i.id !== id);
    this.selectedItems.delete(id);
    this._markSynced();
    this.onItemsChange?.(this.items);
    this.onSelectionChange?.(this.selectedItems);
  }

  async deleteSelected() {
    const ids = [...this.selectedItems];
    if (ids.length === 0) return;
    this._pushHistory();
    ids.forEach(id => window.Connections?.removeConnectionsForItem(id));
    const { error } = await BoardFlowAuth.supabase.from('items').delete().in('id', ids);
    if (error) throw error;
    this.items = this.items.filter(i => !ids.includes(i.id));
    ids.forEach(id => this.selectedItems.delete(id));
    this._markSynced();
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
      this._pushHistory();
      const maxZ = Math.max(...this.items.map(i => i.z_index), 0);
      item.z_index = maxZ + 1;
      this.updateItem(id, { z_index: item.z_index });
    }
  }

  sendToBack(id) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      this._pushHistory();
      const minZ = Math.min(...this.items.map(i => i.z_index), 0);
      item.z_index = minZ - 1;
      this.updateItem(id, { z_index: item.z_index });
    }
  }

  _saveLocal() {
    // kept for dashboard item counts only (no item persistence here)
    try {
      if (this.boardId) BoardManager.setItemCount(this.boardId, this.items.length);
    } catch {}
  }

  destroyRealtime() {
    if (this._realtimeChannel && BoardFlowAuth.supabase) {
      try { BoardFlowAuth.supabase.removeChannel(this._realtimeChannel); } catch {}
      this._realtimeChannel = null;
    }
  }
}

try {
  Object.defineProperty(window, 'ItemManager', { value: new _ItemManager(), writable: false, configurable: true, enumerable: true });
} catch { window.ItemManager = new _ItemManager(); }
