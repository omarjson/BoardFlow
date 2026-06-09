// ============================================
// Board CRUD Manager
// ============================================

class _BoardManager {
  constructor() {
    this.boards = [];
    this.currentBoard = null;
    this.DB_KEY = 'boardflow_boards';
  }

  async init() {
    if (BoardFlowAuth.supabase) {
      await this._loadFromSupabase();
    } else {
      this._loadFromLocal();
    }
    return this.boards;
  }

  _generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  async create(title = 'Untitled Board', templateId = null) {
    const board = {
      id: this._generateId(),
      user_id: BoardFlowAuth.getUserId(),
      title,
      description: '',
      is_public: false,
      share_token: null,
      template: templateId,
      thumbnail_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (BoardFlowAuth.supabase) {
      const { data, error } = await BoardFlowAuth.supabase
        .from('boards')
        .insert({ ...board, id: undefined })
        .select()
        .single();
      if (error) throw error;
      board.id = data.id;
    }

    this.boards.unshift(board);
    this._saveLocal();
    return board;
  }

  async getAll() {
    if (BoardFlowAuth.supabase) {
      await this._loadFromSupabase();
    }
    return this.boards;
  }

  async getById(id) {
    if (BoardFlowAuth.supabase) {
      const { data } = await BoardFlowAuth.supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .single();
      return data;
    }
    return this.boards.find(b => b.id === id) || null;
  }

  async getByShareToken(token) {
    if (!token) return null;
    if (BoardFlowAuth.supabase) {
      const { data } = await BoardFlowAuth.supabase
        .from('boards')
        .select('*')
        .eq('share_token', token)
        .single();
      return data;
    }
    return this.boards.find(b => b.share_token === token) || null;
  }

  async update(id, updates) {
    if (BoardFlowAuth.supabase) {
      const { error } = await BoardFlowAuth.supabase
        .from('boards')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    }

    const board = this.boards.find(b => b.id === id);
    if (board) {
      Object.assign(board, updates, { updated_at: new Date().toISOString() });
      this._saveLocal();
    }
    return board;
  }

  async delete(id) {
    if (BoardFlowAuth.supabase) {
      const { error } = await BoardFlowAuth.supabase
        .from('boards')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }

    this.boards = this.boards.filter(b => b.id !== id);
    this._saveLocal();
  }

  async _loadFromSupabase() {
    if (!BoardFlowAuth.supabase || !BoardFlowAuth.getUserId()) return;
    const { data, error } = await BoardFlowAuth.supabase
      .from('boards')
      .select('*')
      .eq('user_id', BoardFlowAuth.getUserId())
      .order('updated_at', { ascending: false });
    if (error) {
      console.error('Failed to load boards:', error.message);
      return;
    }
    if (data) this.boards = data;
  }

  _loadFromLocal() {
    try {
      const stored = localStorage.getItem(this.DB_KEY);
      this.boards = stored ? JSON.parse(stored) : [];
    } catch {
      this.boards = [];
    }
  }

  _saveLocal() {
    try {
      localStorage.setItem(this.DB_KEY, JSON.stringify(this.boards));
    } catch {
      // Storage full or unavailable
    }
  }

  // ---- Favorites ----
  getFavorites() {
    try {
      const stored = localStorage.getItem('boardflow_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }

  isFavorite(boardId) {
    return this.getFavorites().includes(boardId);
  }

  toggleFavorite(boardId) {
    let favs = this.getFavorites();
    if (favs.includes(boardId)) {
      favs = favs.filter(id => id !== boardId);
    } else {
      favs.unshift(boardId);
    }
    localStorage.setItem('boardflow_favorites', JSON.stringify(favs));
    return favs.includes(boardId);
  }

  // ---- Recent Boards ----
  markBoardVisited(boardId) {
    try {
      let recent = JSON.parse(localStorage.getItem('boardflow_recent') || '[]');
      recent = recent.filter(r => r.id !== boardId);
      recent.unshift({ id: boardId, at: Date.now() });
      recent = recent.slice(0, 10);
      localStorage.setItem('boardflow_recent', JSON.stringify(recent));
    } catch {}
  }

  getRecentBoardIds() {
    try {
      const recent = JSON.parse(localStorage.getItem('boardflow_recent') || '[]');
      return recent.slice(0, 5).map(r => r.id);
    } catch { return []; }
  }

  // ---- Item Count Cache ----
  setItemCount(boardId, count) {
    try {
      const counts = JSON.parse(localStorage.getItem('boardflow_item_counts') || '{}');
      counts[boardId] = count;
      localStorage.setItem('boardflow_item_counts', JSON.stringify(counts));
    } catch {}
  }

  getItemCount(boardId) {
    try {
      const counts = JSON.parse(localStorage.getItem('boardflow_item_counts') || '{}');
      return counts[boardId] !== undefined ? counts[boardId] : null;
    } catch { return null; }
  }
}

try {
  Object.defineProperty(window, 'BoardManager', { value: new _BoardManager(), writable: false, configurable: true, enumerable: true });
} catch { window.BoardManager = new _BoardManager(); }
