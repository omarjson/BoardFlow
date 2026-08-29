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
    if (!BoardFlowAuth.supabase) throw new Error('Supabase not configured');
    await this._loadFromSupabase();
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
    if (!BoardFlowAuth.supabase) throw new Error('Supabase not configured');
    if (!BoardFlowAuth.getUserId()) throw new Error('Not authenticated');
    const board = {
      user_id: BoardFlowAuth.getUserId(),
      title: title || 'Untitled Board',
      description: '',
      is_public: false,
      share_token: null,
      template: templateId,
      thumbnail_url: null
    };
    const { data, error } = await BoardFlowAuth.supabase
      .from('boards')
      .insert(board)
      .select()
      .single();
    if (error) throw error;
    this.boards.unshift(data);
    this._saveLocal();
    // add owner membership for convenience (if trigger not present)
    try {
      await BoardFlowAuth.supabase.from('board_members').insert({ board_id: data.id, user_id: BoardFlowAuth.getUserId(), role: 'owner' });
    } catch {}
    return data;
  }

  async getAll() {
    await this._loadFromSupabase();
    return this.boards;
  }

  async getById(id) {
    const { data, error } = await BoardFlowAuth.supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getByShareToken(token) {
    if (!token) return null;
    // share links should require token match, not enumeration
    const { data, error } = await BoardFlowAuth.supabase
      .from('boards')
      .select('*')
      .eq('share_token', token)
      .single();
    if (error && error.code !== 'PGRST116') console.warn('getByShareToken', error.message);
    return data || null;
  }

  async update(id, updates) {
    const whitelist = ['title', 'description', 'is_public', 'share_token', 'template', 'thumbnail_url'];
    const safe = {};
    Object.keys(updates).forEach(k => { if (whitelist.includes(k)) safe[k] = updates[k]; });
    if (Object.keys(safe).length === 0 && Object.keys(updates).length === 0) {
      // touch updated_at only
      safe.updated_at = new Date().toISOString();
    } else {
      safe.updated_at = new Date().toISOString();
    }
    const { error } = await BoardFlowAuth.supabase
      .from('boards')
      .update(safe)
      .eq('id', id);
    if (error) throw error;
    const board = this.boards.find(b => b.id === id);
    if (board) {
      Object.assign(board, safe);
      this._saveLocal();
    }
    return board;
  }

  async delete(id) {
    const { error } = await BoardFlowAuth.supabase
      .from('boards')
      .delete()
      .eq('id', id);
    if (error) throw error;
    this.boards = this.boards.filter(b => b.id !== id);
    this._saveLocal();
  }

  async _loadFromSupabase() {
    if (!BoardFlowAuth.supabase || !BoardFlowAuth.getUserId()) { this.boards = []; return; }
    const uid = BoardFlowAuth.getUserId();
    // owned boards
    const { data: owned, error: e1 } = await BoardFlowAuth.supabase
      .from('boards')
      .select('*')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false });
    if (e1) console.error('Failed to load owned boards:', e1.message);
    // shared boards via membership
    const { data: memberships, error: e2 } = await BoardFlowAuth.supabase
      .from('board_members')
      .select('board_id')
      .eq('user_id', uid);
    let shared = [];
    if (!e2 && memberships && memberships.length) {
      const ids = memberships.map(m => m.board_id);
      const { data: sharedBoards, error: e3 } = await BoardFlowAuth.supabase
        .from('boards')
        .select('*')
        .in('id', ids);
      if (!e3 && sharedBoards) shared = sharedBoards;
      else if (e3) console.error('Failed to load shared boards:', e3.message);
    }
    const map = new Map();
    [...(owned || []), ...shared].forEach(b => map.set(b.id, b));
    this.boards = Array.from(map.values()).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
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
