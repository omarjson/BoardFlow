// ============================================
// Sidebar Component
// ============================================

class _Sidebar {
  constructor() {
    this.el = null;
    this.contentEl = null;
    this.footerEl = null;
  }

  init() {
    this.el = document.querySelector('#page-dashboard .sidebar');
    this.contentEl = document.getElementById('sidebar-content');
    this.footerEl = document.getElementById('sidebar-footer');
    if (!this.el) return;
    this._wireToggle();
    this.render();
  }

  _wireToggle() {
    let toggle = document.getElementById('sidebar-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.id = 'sidebar-toggle';
      toggle.className = 'sidebar-toggle';
      toggle.innerHTML = Icons.menu;
      toggle.setAttribute('aria-label', 'Toggle sidebar');
      document.body.appendChild(toggle);
    }
    toggle.addEventListener('click', () => {
      this.el.classList.toggle('open');
    });
    // Close sidebar on board card click (mobile)
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.board-card, .board-list-item');
      if (card && this.el.classList.contains('open')) {
        this.el.classList.remove('open');
      }
    });
  }

  render() {
    const user = BoardFlowAuth.getUser();
    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
    const email = user?.email || '';

    this.contentEl.innerHTML = `
      <div style="padding: var(--space-sm) var(--space-md);">
        <button class="btn btn-primary btn-block" id="sidebar-new-board" style="display: flex; align-items: center; justify-content: center; gap: var(--space-xs);">
          ${Icons.plus} <span data-i18n="new_board">New Board</span>
        </button>
      </div>
      <div class="sidebar-search" style="padding: var(--space-xs) var(--space-sm);">
        <input type="text" id="board-search" placeholder="${I18n.__('search_files')}" style="
          width: 100%;
          padding: 8px var(--space-md);
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
        ">
      </div>
      <div id="board-list" style="padding: var(--space-xs) var(--space-sm);"></div>
      <div style="padding: var(--space-xs) var(--space-sm); border-top: 1px solid var(--hairline); margin-top: var(--space-sm);">
        <button class="sidebar-nav-btn" id="sidebar-settings" style="display: flex; align-items: center; gap: var(--space-sm); width: 100%; padding: var(--space-sm) var(--space-md); border: none; border-radius: var(--radius-md); background: none; cursor: pointer; color: var(--ink-secondary); font-size: var(--text-sm); transition: all var(--transition-fast);">
          ${Icons.settings}
          <span>${I18n.__('settings')}</span>
        </button>
      </div>
    `;

    this.footerEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-sm) var(--space-md);">
        <div style="
          width: 32px; height: 32px;
          border-radius: var(--radius-full);
          background: var(--primary);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: var(--text-sm); font-weight: var(--weight-semibold);
          flex-shrink: 0;
        ">${displayName.charAt(0).toUpperCase()}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: var(--text-sm); font-weight: var(--weight-medium); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayName}</div>
          <div style="font-size: var(--text-xs); color: var(--ink-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${email}</div>
        </div>
        <button class="sidebar-logout-btn" id="sidebar-logout" title="${I18n.__('sign_out')}">${Icons.logout}<span>${I18n.__('sign_out')}</span></button>
      </div>
      <div style="padding: var(--space-xs) var(--space-md); border-top: 1px solid var(--hairline);">
        <select id="sidebar-lang" style="width: 100%; padding: 6px var(--space-sm); background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-xs); color: var(--ink-secondary);">
          <option value="en">English</option>
          <option value="ar">العربية</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
          <option value="pt">Português</option>
          <option value="de">Deutsch</option>
          <option value="ru">Русский</option>
          <option value="tr">Türkçe</option>
          <option value="hi">हिन्दी</option>
          <option value="zh-CN">中文</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
          <option value="it">Italiano</option>
          <option value="nl">Nederlands</option>
          <option value="id">Bahasa Indonesia</option>
        </select>
      </div>
    `;

    document.getElementById('sidebar-lang')?.addEventListener('change', (e) => {
      I18n.setLanguage(e.target.value);
    });

    // Sync selector with current language
    const langSel = document.getElementById('sidebar-lang');
    if (langSel) langSel.value = I18n.currentLang;

    document.getElementById('sidebar-new-board')?.addEventListener('click', () => {
      Modal.show({
        title: I18n.__('new_board'),
        content: `
          <div class="form-group">
            <label for="new-board-title">${I18n.__('board_title')}</label>
            <input type="text" id="new-board-title" placeholder="${I18n.__('board_title')}" autofocus>
          </div>
        `,
        confirmText: I18n.__('create'),
        onConfirm: async () => {
          const title = document.getElementById('new-board-title').value.trim() || 'Untitled Board';
          const board = await BoardManager.create(title);
          Toast.show('Board created!', 'success');
          AppRouter.navigate('/board/' + board.id);
        }
      });
    });

    document.getElementById('sidebar-logout')?.addEventListener('click', () => {
      BoardFlowAuth.signOut();
    });

    document.getElementById('sidebar-settings')?.addEventListener('click', () => {
      AppRouter.navigate('/settings');
    });

    document.getElementById('board-search')?.addEventListener('input', (e) => {
      this.filterBoards(e.target.value);
    });
  }

  async loadBoards() {
    await BoardManager.init();
    this.renderBoardList();
  }

  renderBoardList(filter = '') {
    const listEl = document.getElementById('board-list');
    if (!listEl) return;

    let boards = BoardManager.boards;
    if (filter) {
      const q = filter.toLowerCase();
      boards = boards.filter(b => b.title.toLowerCase().includes(q));
    }

    if (boards.length === 0) {
      listEl.innerHTML = `
        <div style="padding: var(--space-xl); text-align: center; color: var(--ink-muted); font-size: var(--text-sm);">
          ${filter ? I18n.__('no_results') : I18n.__('no_boards_yet')}
        </div>
      `;
      return;
    }

    listEl.innerHTML = boards.map(board => `
      <div class="board-list-item" data-id="${board.id}" style="
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: var(--transition-fast);
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      ">
        <div style="
          width: 36px; height: 36px;
          border-radius: var(--radius-sm);
          background: ${this._getBoardColor(board)};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: white;
        ">${Icons.board}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: var(--text-sm); font-weight: var(--weight-medium); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this._escapeHtml(board.title)}</div>
          <div style="font-size: var(--text-xs); color: var(--ink-muted);">${this._formatDate(board.updated_at)}</div>
        </div>
        <button class="btn btn-ghost board-delete-btn" data-id="${board.id}" title="${I18n.__('delete')}" style="padding: var(--space-xs); opacity: 0; transition: var(--transition-fast); display: flex; align-items: center; justify-content: center;">${Icons.trash}</button>
      </div>
    `).join('');

    // Hover effects
    listEl.querySelectorAll('.board-list-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.background = 'var(--canvas-soft)';
        item.querySelector('.board-delete-btn').style.opacity = '1';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = '';
        item.querySelector('.board-delete-btn').style.opacity = '0';
      });
      item.addEventListener('click', (e) => {
        if (e.target.closest('.board-delete-btn')) return;
        AppRouter.navigate('/board/' + item.dataset.id);
      });
    });

    // Delete buttons
    listEl.querySelectorAll('.board-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._confirmDelete(btn.dataset.id);
      });
    });
  }

  filterBoards(query) {
    this.renderBoardList(query);
  }

  async _confirmDelete(boardId) {
    const board = BoardManager.boards.find(b => b.id === boardId);
    if (!board) return;

    Modal.show({
      title: I18n.__('confirm_delete_title'),
      content: `<p>${I18n.__('confirm_delete', { title: this._escapeHtml(board.title) })}</p>`,
      confirmText: I18n.__('delete'),
      confirmStyle: 'danger',
      onConfirm: async () => {
        await BoardManager.delete(boardId);
        Toast.show('Board deleted', 'success');
        this.loadBoards();
      }
    });
  }

  _getBoardColor(board) {
    const colors = ['#007aff', '#34c759', '#ff9f0a', '#ff3b30', '#af52de', '#5ac8fa', '#ff6482'];
    let hash = 0;
    for (let i = 0; i < board.title.length; i++) {
      hash = board.title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length] + '20';
  }

  _formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return I18n.__('just_now');
    if (diffMins < 60) return I18n.__('minutes_ago', { n: diffMins });
    if (diffHours < 24) return I18n.__('hours_ago', { n: diffHours });
    if (diffDays < 7) return I18n.__('days_ago', { n: diffDays });
    return d.toLocaleDateString();
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

try {
  Object.defineProperty(window, 'Sidebar', { value: new _Sidebar(), writable: false, configurable: true, enumerable: true });
} catch { window.Sidebar = new _Sidebar(); }
