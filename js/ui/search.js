class BoardSearch {
  constructor() {
    this.overlay = null;
    this.input = null;
    this.results = null;
    this.activeIndex = -1;
    this._keyHandler = null;
  }

  show() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'board-search-overlay';
    this.overlay.innerHTML = `
      <div class="board-search-bar">
        <span class="board-search-icon">🔍</span>
        <input type="text" class="board-search-input" placeholder="${I18n.__('search')}" autocomplete="off" autofocus>
        <span class="board-search-count"></span>
        <button class="board-search-close">✕</button>
      </div>
      <div class="board-search-results"></div>
    `;

    document.getElementById('page-board')?.appendChild(this.overlay);

    this.input = this.overlay.querySelector('.board-search-input');
    this.results = this.overlay.querySelector('.board-search-results');
    const countEl = this.overlay.querySelector('.board-search-count');
    const closeBtn = this.overlay.querySelector('.board-search-close');

    this.input.addEventListener('input', Utils.debounce(() => this._search(), 150));
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      if (e.key === 'Enter') this._goToResult(this.activeIndex);
      if (e.key === 'ArrowDown') { e.preventDefault(); this._navigate(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); this._navigate(-1); }
    });
    closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    requestAnimationFrame(() => this.input?.focus());
  }

  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.input = null;
      this.results = null;
      this.activeIndex = -1;
    }
  }

  _search() {
    const q = this.input?.value?.toLowerCase().trim() || '';
    const countEl = this.overlay?.querySelector('.board-search-count');
    this.results.innerHTML = '';

    if (!q) {
      if (countEl) countEl.textContent = '';
      return;
    }

    const matches = ItemManager.items.filter(item => {
      const title = (item.title || '').toLowerCase();
      const content = (item.content || '').toLowerCase();
      return title.includes(q) || content.includes(q);
    });

    if (countEl) countEl.textContent = matches.length ? `${matches.length} found` : '';

    if (matches.length === 0) {
      this.results.innerHTML = `<div class="board-search-empty">${I18n.__('no_results')}</div>`;
      return;
    }

    matches.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = 'board-search-result';
      el.dataset.index = i;
      el.innerHTML = `
        <span class="board-search-result-icon">${this._iconForType(item.type)}</span>
        <span class="board-search-result-title">${Utils.escapeHtml(item.title || item.type)}</span>
      `;
      el.addEventListener('click', () => this._goToResult(i));
      el.addEventListener('mouseenter', () => { this.activeIndex = i; this._highlight(); });
      this.results.appendChild(el);
    });

    this.activeIndex = 0;
    this._highlight();
    this._ensureVisible();
  }

  _navigate(dir) {
    const items = this.results?.querySelectorAll('.board-search-result');
    if (!items || items.length === 0) return;
    this.activeIndex = (this.activeIndex + dir + items.length) % items.length;
    this._highlight();
    this._ensureVisible();
  }

  _highlight() {
    this.results?.querySelectorAll('.board-search-result').forEach((el, i) => {
      el.classList.toggle('active', i === this.activeIndex);
    });
  }

  _ensureVisible() {
    const el = this.results?.querySelector(`[data-index="${this.activeIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  _goToResult(index) {
    const item = ItemManager.items[index];
    if (!item) return;
    ItemManager.deselectAll();
    ItemManager.selectItem(item.id);
    Canvas.panTo(item.position_x + item.width / 2, item.position_y + item.height / 2);
    this.close();
  }

  _iconForType(type) {
    const icons = {
      sticky_note: '📝', rich_note: '📄', sketch: '🎨',
      link_card: '🔗', roadmap: '🗺', image: '🖼',
      video: '🎬', audio: '🎵', file: '📎'
    };
    return icons[type] || '📋';
  }
}

window.BoardSearch = new BoardSearch();
