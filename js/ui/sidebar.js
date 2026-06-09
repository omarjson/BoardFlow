// ============================================
// Sidebar Component
// ============================================

class _Sidebar {
  constructor() {
    this.el = null;
    this.contentEl = null;
    this.footerEl = null;
    this._isCollapsed = false;
  }

  init() {
    this.el = document.querySelector('#page-dashboard .sidebar');
    this.contentEl = document.getElementById('sidebar-content');
    this.footerEl = document.getElementById('sidebar-footer');
    if (!this.el) return;
    this._wireToggle();
    this._wireScrollShadow();
    this.render();
  }

  _wireToggle() {
    this._isCollapsed = this.el.classList.contains('collapsed');

    let scrim = document.getElementById('sidebar-scrim');
    if (!scrim) {
      scrim = document.createElement('div');
      scrim.id = 'sidebar-scrim';
      scrim.className = 'sidebar-scrim';
      document.body.appendChild(scrim);
      scrim.addEventListener('click', () => this.el.classList.remove('open'));
    }

    let toggle = document.getElementById('sidebar-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.id = 'sidebar-toggle';
      toggle.className = 'sidebar-toggle';
      toggle.setAttribute('aria-label', 'Toggle sidebar');
      document.body.appendChild(toggle);
    }

    if (!this._iconSet) {
      this._iconSet = true;
      toggle.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
    }

    if (!this._topbarBound) {
      this._topbarBound = () => {
        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        if (!isMobile) return;
        const scrim = document.getElementById('sidebar-scrim');
        const isOpen = this.el.classList.toggle('open');
        if (scrim) scrim.classList.toggle('active', isOpen);
      };
      const topbar = document.querySelector('.mobile-topbar');
      if (topbar) topbar.addEventListener('click', this._topbarBound);
    }
      this._toggleBound = () => {
        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        const scrim = document.getElementById('sidebar-scrim');
        if (isMobile) {
          const isOpen = this.el.classList.toggle('open');
          if (scrim) scrim.classList.toggle('active', isOpen);
        } else {
          this._isCollapsed = !this._isCollapsed;
          this.el.classList.toggle('collapsed', this._isCollapsed);
        }
      };
      toggle.addEventListener('click', this._toggleBound);
    }
    if (!this._autoOpenBound) {
      this._autoOpenBound = (e) => {
        const card = e.target.closest('.board-card, .board-list-item');
        if (card) {
          const isMobile = window.matchMedia('(max-width: 767px)').matches;
          const scrim = document.getElementById('sidebar-scrim');
          if (isMobile) {
            this.el.classList.remove('open');
            if (scrim) scrim.classList.remove('active');
          } else if (this._isCollapsed) {
            this._isCollapsed = false;
            this.el.classList.remove('collapsed');
          }
        }
      };
      document.addEventListener('click', this._autoOpenBound);
    }
    if (!this._clickOutsideBound) {
      this._clickOutsideBound = (e) => {
        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        if (!isMobile) return;
        if (!this.el.classList.contains('open')) return;
        if (e.target.closest('.sidebar') || e.target.closest('.sidebar-toggle')) return;
        const scrim = document.getElementById('sidebar-scrim');
        this.el.classList.remove('open');
        if (scrim) scrim.classList.remove('active');
      };
      document.addEventListener('click', this._clickOutsideBound);
    }
  }

  _wireScrollShadow() {
    if (!this.contentEl) return;
    this.contentEl.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.contentEl;
      this.contentEl.style.setProperty('--shadow-top', Math.min(scrollTop / 20, 1));
      this.contentEl.style.setProperty('--shadow-bottom', Math.min((scrollHeight - scrollTop - clientHeight) / 20, 1));
    });
  }

  render() {
    const user = BoardFlowAuth.getUser();
    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
    const email = user?.email || '';

    this.contentEl.innerHTML = `
      <div class="sidebar-section">
        <div class="sidebar-section-content">
          <button class="btn btn-primary btn-block" id="sidebar-new-board" title="New Board" style="display: flex; align-items: center; justify-content: center; gap: var(--space-xs);">
            ${Icons.plus} <span data-i18n="new_board">New Board</span>
          </button>
        </div>
      </div>
      <div class="sidebar-section">
        <span class="sidebar-label" data-i18n="search">Search</span>
        <div class="sidebar-section-content">
          <div class="sidebar-search">
            <span class="sidebar-search-icon">${Icons.search}</span>
            <input type="text" id="board-search" placeholder="${I18n.__('search_files')}" class="sidebar-search-input">
          </div>
        </div>
      </div>
      <div class="sidebar-section">
        <span class="sidebar-label" data-i18n="boards">Boards</span>
        <div class="sidebar-section-content">
          <div id="board-list"></div>
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-content sidebar-section-divider">
          <button class="sidebar-nav-btn" id="sidebar-settings" title="Settings">
            ${Icons.settings}
            <span>${I18n.__('settings')}</span>
          </button>
        </div>
      </div>
    `;

    this.footerEl.innerHTML = `
      <div class="user-profile-pill" title="${this._escapeHtml(displayName)}">
        <div class="user-avatar">${this._escapeHtml(displayName.charAt(0).toUpperCase())}</div>
        <div class="user-info">
          <div class="user-name">${this._escapeHtml(displayName)}</div>
          <div class="user-email">${this._escapeHtml(email)}</div>
        </div>
      </div>
      <select id="sidebar-lang" class="sidebar-lang-select">
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
      <button class="sidebar-logout-btn" id="sidebar-logout" title="${I18n.__('sign_out')}">${Icons.logout}<span>${I18n.__('sign_out')}</span></button>
    `;

    const langSel = document.getElementById('sidebar-lang');
    langSel?.addEventListener('change', (e) => {
      I18n.setLanguage(e.target.value);
    });
    if (langSel) langSel.value = I18n.currentLang;

    document.getElementById('sidebar-new-board')?.addEventListener('click', () => {
      Modal.show({
        title: I18n.__('new_board'),
        content: '<div class="form-group"><label for="new-board-title">' + I18n.__('board_title') + '</label><input type="text" id="new-board-title" placeholder="' + I18n.__('board_title') + '" autofocus></div>',
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

  showSkeleton() {
    const listEl = document.getElementById('board-list');
    if (!listEl) return;
    listEl.innerHTML = `
      <div class="sidebar-skeleton">
        <div class="sidebar-skeleton-row"><div class="sidebar-skeleton-icon"></div><div class="sidebar-skeleton-line"></div></div>
        <div class="sidebar-skeleton-row"><div class="sidebar-skeleton-icon"></div><div class="sidebar-skeleton-line short"></div></div>
        <div class="sidebar-skeleton-row"><div class="sidebar-skeleton-icon"></div><div class="sidebar-skeleton-line"></div></div>
        <div class="sidebar-skeleton-row"><div class="sidebar-skeleton-icon"></div><div class="sidebar-skeleton-line"></div></div>
        <div class="sidebar-skeleton-row"><div class="sidebar-skeleton-icon"></div><div class="sidebar-skeleton-line short"></div></div>
      </div>
    `;
  }

  async loadBoards() {
    this.showSkeleton();
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

    const currentBoardId = this._getCurrentBoardId();

    if (boards.length === 0) {
      listEl.innerHTML = `
        <div class="sidebar-empty">
          ${filter ? I18n.__('no_results') : I18n.__('no_boards_yet')}
        </div>
      `;
      return;
    }

    listEl.innerHTML = boards.map(board => `
      <div class="board-list-item${board.id === currentBoardId ? ' active' : ''}" data-id="${board.id}">
        <div class="board-icon" style="background: ${this._getBoardColor(board)}">
          ${Icons.board}
        </div>
        <div class="board-info">
          <div class="board-title" title="${this._escapeHtml(board.title)}">${this._escapeHtml(board.title)}</div>
          <div class="board-date">${this._formatDate(board.updated_at)}</div>
        </div>
        <button class="board-delete-btn btn btn-ghost" data-id="${board.id}" title="${I18n.__('delete')}">${Icons.trash}</button>
      </div>
    `).join('');

    listEl.querySelectorAll('.board-list-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.board-delete-btn')) return;
        if (e.target.closest('.board-title-rename')) return;
        AppRouter.navigate('/board/' + item.dataset.id);
      });
      this._wireInlineRename(item);
    });

    listEl.querySelectorAll('.board-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._confirmDelete(btn.dataset.id);
      });
    });
  }

  _wireInlineRename(item) {
    const titleEl = item.querySelector('.board-title');
    if (!titleEl) return;

    titleEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const currentTitle = titleEl.textContent;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'board-title-rename';
      input.value = currentTitle;
      input.style.cssText = `
        width: 100%; padding: 2px 4px; font-size: var(--text-sm); font-weight: var(--weight-medium);
        background: var(--surface); border: 1px solid var(--primary); border-radius: var(--radius-xs);
        color: var(--ink); outline: none; font-family: var(--font-sans);
      `;
      titleEl.replaceWith(input);
      input.focus();
      input.select();

      const finishRename = async () => {
        const newTitle = input.value.trim() || currentTitle;
        const boardId = item.dataset.id;
        const prev = document.createElement('div');
        prev.className = 'board-title';
        prev.textContent = newTitle;
        input.replaceWith(prev);
        this._wireInlineRename(item);
        if (newTitle !== currentTitle && boardId) {
          try {
            await BoardManager.update(boardId, { title: newTitle });
          } catch (err) {
            prev.textContent = currentTitle;
            Toast.show('Rename failed', 'error');
          }
        }
      };

      input.addEventListener('blur', finishRename);
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
        if (ev.key === 'Escape') { ev.preventDefault(); input.value = currentTitle; input.blur(); }
      });
    });
  }

  _getCurrentBoardId() {
    const match = window.location.hash.match(/\/board\/([^/?#]+)/);
    return match ? match[1] : null;
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
