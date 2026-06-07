// ============================================
// Board CRUD Manager
// ============================================

class BoardManager {
  constructor() {
    this.boards = [];
    this.currentBoard = null;
    this.DB_KEY = 'boardflow_boards';
  }

  async init() {
    if (Auth.supabase) {
      await this._loadFromSupabase();
    } else {
      this._loadFromLocal();
    }
    return this.boards;
  }

  async create(title = 'Untitled Board', templateId = null) {
    const board = {
      id: 'board-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      user_id: Auth.getUserId(),
      title,
      description: '',
      is_public: false,
      share_token: null,
      template: templateId,
      thumbnail_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (Auth.supabase) {
      const { data, error } = await Auth.supabase
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
    if (Auth.supabase) {
      await this._loadFromSupabase();
    }
    return this.boards;
  }

  async getById(id) {
    if (Auth.supabase) {
      const { data } = await Auth.supabase
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
    if (Auth.supabase) {
      const { data } = await Auth.supabase
        .from('boards')
        .select('*')
        .eq('share_token', token)
        .single();
      return data;
    }
    return this.boards.find(b => b.share_token === token) || null;
  }

  async update(id, updates) {
    if (Auth.supabase) {
      const { error } = await Auth.supabase
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
    if (Auth.supabase) {
      const { error } = await Auth.supabase
        .from('boards')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }

    this.boards = this.boards.filter(b => b.id !== id);
    this._saveLocal();
  }

  async _loadFromSupabase() {
    if (!Auth.supabase || !Auth.getUserId()) return;
    const { data, error } = await Auth.supabase
      .from('boards')
      .select('*')
      .eq('user_id', Auth.getUserId())
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
}

window.BoardManager = new BoardManager();
